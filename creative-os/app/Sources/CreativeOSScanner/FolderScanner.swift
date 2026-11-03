#if os(macOS)
import Foundation
import CreativeOSCore

public struct ScanOptions: Sendable {
    /// Files modified more recently than this are treated as possibly still downloading/rendering.
    public var stabilityWindow: TimeInterval = 120
    /// Safety cap so a wrongly chosen folder can't run forever.
    public var maxFiles: Int = 250_000

    public init() {}
}

public struct ScanSkip: Equatable, Sendable {
    public let path: String
    public let reason: String
}

public struct ScanResult: Sendable {
    public let files: [ScannedFile]
    /// Folders and items deliberately not scanned, with a plain-language reason.
    public let skipped: [ScanSkip]
    /// Hidden items (names starting with ".") that were ignored.
    public let hiddenCount: Int
    public let wasCancelled: Bool
    public let hitLimit: Bool
}

/// Lists the files inside folders the user approved.
///
/// Read-only and metadata-only: it reads names, sizes and dates. It never opens a file, never
/// follows links, never enters app/project packages, other drives mounted inside, hidden folders,
/// or system/cache folders, and never leaves the approved folders.
public enum FolderScanner {
    static let excludedFolderNames: Set<String> = [
        "library", "caches", "cache", "media cache", "media cache files", "peak files", "render files",
        "adobe premiere pro auto-save", "auto-save", "adobe premiere pro preview files",
        "after effects disk cache", "node_modules", "04_quarantine", "05_system", "06_packages",
    ]
    static let packageExtensions: Set<String> = [
        "app", "bundle", "fcpbundle", "photoslibrary", "imovielibrary", "logicx", "band", "framework",
        "plugin", "rtfd", "aplibrary", "cocatalog", "lrdata", "lrcat-data",
    ]
    static let partialDownloadExtensions: Set<String> = [
        "crdownload", "part", "partial", "download", "tmp", "temp", "opdownload", "!ut",
    ]

    public static func scan(roots: [String], now: Date = Date(), options: ScanOptions = ScanOptions(),
                            shouldCancel: (() -> Bool)? = nil, progress: ((Int) -> Void)? = nil) -> ScanResult {
        let fm = FileManager.default
        var files: [ScannedFile] = []
        var skipped: [ScanSkip] = []
        var hidden = 0
        var cancelled = false
        var hitLimit = false

        rootLoop: for rawRoot in roots {
            guard let root = PathSafety.normalizedAbsolute(rawRoot) else {
                skipped.append(ScanSkip(path: rawRoot, reason: "Not a valid folder path."))
                continue
            }
            guard let attributes = try? fm.attributesOfItem(atPath: root),
                  attributes[.type] as? FileAttributeType == .typeDirectory else {
                skipped.append(ScanSkip(path: root, reason: "Folder not found (or it is a link). Its drive may be disconnected."))
                continue
            }
            let rootURL = URL(fileURLWithPath: root, isDirectory: true)
            let rootValues = try? rootURL.resourceValues(forKeys: [.volumeUUIDStringKey, .volumeIdentifierKey])
            guard let uuid = rootValues?.volumeUUIDString, !uuid.isEmpty, let rootVolume = rootValues?.volumeIdentifier else {
                skipped.append(ScanSkip(path: root, reason: "Its drive has no ID. Register the drive first."))
                continue
            }
            let volumeID = "uuid:" + uuid.uppercased()

            guard let walker = fm.enumerator(atPath: root) else {
                skipped.append(ScanSkip(path: root, reason: "macOS did not allow this folder to be read."))
                continue
            }
            while let next = walker.nextObject() as? String {
                if shouldCancel?() == true { cancelled = true; break rootLoop }
                let name = (next as NSString).lastPathComponent
                let path = root + "/" + next

                if name.hasPrefix(".") {
                    hidden += 1
                    walker.skipDescendants()
                    continue
                }
                guard let item = try? fm.attributesOfItem(atPath: path),
                      let type = item[.type] as? FileAttributeType else {
                    skipped.append(ScanSkip(path: path, reason: "Couldn't read its details (permission?)."))
                    walker.skipDescendants()
                    continue
                }

                switch type {
                case .typeSymbolicLink:
                    skipped.append(ScanSkip(path: path, reason: "Link: never followed."))
                case .typeDirectory:
                    let ext = (name as NSString).pathExtension.lowercased()
                    let url = URL(fileURLWithPath: path, isDirectory: true)
                    let values = try? url.resourceValues(forKeys: [.isPackageKey, .volumeIdentifierKey])
                    if packageExtensions.contains(ext) || values?.isPackage == true {
                        skipped.append(ScanSkip(path: path, reason: "App or project package: kept as one item, never opened."))
                        walker.skipDescendants()
                    } else if excludedFolderNames.contains(name.lowercased()) {
                        skipped.append(ScanSkip(path: path, reason: "System, cache or Creative OS folder: not scanned."))
                        walker.skipDescendants()
                    } else if let v = values?.volumeIdentifier, !v.isEqual(rootVolume) {
                        skipped.append(ScanSkip(path: path, reason: "Another drive appears here: not scanned."))
                        walker.skipDescendants()
                    }
                case .typeRegular:
                    let size = (item[.size] as? NSNumber)?.int64Value ?? 0
                    let modified = item[.modificationDate] as? Date ?? now
                    let ext = (name as NSString).pathExtension.lowercased()
                    let stable = !partialDownloadExtensions.contains(ext)
                        && now.timeIntervalSince(modified) >= options.stabilityWindow
                    guard let normalized = PathSafety.normalizedAbsolute(path) else { continue }
                    files.append(ScannedFile(path: normalized, root: root, volumeID: volumeID, sizeBytes: size,
                                             modifiedAt: modified, isStable: stable))
                    if files.count % 500 == 0 { progress?(files.count) }
                    if files.count >= options.maxFiles { hitLimit = true; break rootLoop }
                default:
                    skipped.append(ScanSkip(path: path, reason: "Not a regular file."))
                }
            }
        }
        progress?(files.count)
        return ScanResult(files: files, skipped: skipped, hiddenCount: hidden,
                          wasCancelled: cancelled, hitLimit: hitLimit)
    }
}
#endif
