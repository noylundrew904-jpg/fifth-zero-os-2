#if os(macOS)
import XCTest
import CreativeOSCore
@testable import CreativeOSScanner

/// Builds a throwaway practice folder in the system temp directory, scans it, and removes it.
final class FolderScannerTests: XCTestCase {
    private let fm = FileManager.default
    private var root = ""
    private var outside = ""
    private let hourAgo = Date().addingTimeInterval(-3_600)

    override func setUpWithError() throws {
        let tmp = fm.temporaryDirectory.path
        root = tmp + "/CreativeOSScanTest-\(UUID().uuidString)"
        outside = tmp + "/CreativeOSScanOutside-\(UUID().uuidString)"
        try fm.createDirectory(atPath: root, withIntermediateDirectories: true)
        try fm.createDirectory(atPath: outside, withIntermediateDirectories: true)

        try make("ACME/Spring_Launch/ACME_Spring_Launch_Teaser_01_v01.mp4")
        try make("ACME/Spring_Launch/Edit/Spring.prproj")
        try make("Downloads/old_mystery.mov")
        try make("Downloads/just_rendered.mov", old: false)
        try make("Downloads/movie.mov.crdownload")
        try make(".hidden_folder/secret.mov")
        try make(".DS_Store")
        try make("Library/Caches/thumb.mov")
        try make("Media Cache Files/clip.cfa")
        try make("Edit.fcpbundle/Media/inside_package.mov")
        try make("Creative_Master/04_QUARANTINE/old copy.wav")
        let outsideFile = outside + "/not_approved.mov"
        XCTAssertTrue(fm.createFile(atPath: outsideFile, contents: Data("x".utf8)))
        try fm.createSymbolicLink(atPath: root + "/LinkToOutside", withDestinationPath: outside)
        try fm.createSymbolicLink(atPath: root + "/Loop", withDestinationPath: root)
    }

    override func tearDownWithError() throws {
        let tmp = fm.temporaryDirectory.path
        for dir in [root, outside] where dir.hasPrefix(tmp + "/CreativeOSScan") { try? fm.removeItem(atPath: dir) }
    }

    private func make(_ relative: String, old: Bool = true) throws {
        let path = root + "/" + relative
        try fm.createDirectory(atPath: (path as NSString).deletingLastPathComponent, withIntermediateDirectories: true)
        XCTAssertTrue(fm.createFile(atPath: path, contents: Data("practice \(relative)".utf8)))
        if old { try fm.setAttributes([.modificationDate: hourAgo], ofItemAtPath: path) }
    }

    /// Every path with its size and date, to prove a scan changes nothing.
    private func snapshot() -> [String: String] {
        var result: [String: String] = [:]
        for case let rel as String in fm.enumerator(atPath: root)! {
            let a = try? fm.attributesOfItem(atPath: root + "/" + rel)
            result[rel] = "\(a?[.size] ?? "-")|\(a?[.modificationDate] ?? "-")"
        }
        return result
    }

    private func relative(_ files: [ScannedFile]) -> Set<String> {
        let prefix = (PathSafety.normalizedAbsolute(root) ?? root) + "/"
        return Set(files.map { String($0.path.dropFirst(prefix.count)) })
    }

    func testFindsOnlyAllowedFilesAndChangesNothing() throws {
        let before = snapshot()
        let result = FolderScanner.scan(roots: [root])
        XCTAssertEqual(snapshot(), before, "scan changed something")

        XCTAssertEqual(relative(result.files), [
            "ACME/Spring_Launch/ACME_Spring_Launch_Teaser_01_v01.mp4",
            "ACME/Spring_Launch/Edit/Spring.prproj",
            "Downloads/old_mystery.mov",
            "Downloads/just_rendered.mov",
            "Downloads/movie.mov.crdownload",
        ])
        XCTAssertFalse(result.wasCancelled)
        XCTAssertFalse(result.hitLimit)
        XCTAssertGreaterThanOrEqual(result.hiddenCount, 2)
        XCTAssertTrue(result.files.allSatisfy { $0.volumeID.hasPrefix("uuid:") })

        let reasons = result.skipped.map(\.reason).joined(separator: "\n")
        XCTAssertTrue(reasons.contains("Link: never followed."))
        XCTAssertTrue(reasons.contains("package"))
        XCTAssertTrue(reasons.contains("cache"))
    }

    func testFreshAndPartialFilesAreMarkedUnstable() throws {
        let result = FolderScanner.scan(roots: [root])
        let byName = Dictionary(uniqueKeysWithValues: result.files.map { (($0.path as NSString).lastPathComponent, $0) })
        XCTAssertEqual(byName["old_mystery.mov"]?.isStable, true)
        XCTAssertEqual(byName["just_rendered.mov"]?.isStable, false)
        XCTAssertEqual(byName["movie.mov.crdownload"]?.isStable, false)
    }

    func testMissingFolderIsSkippedWithReason() {
        let result = FolderScanner.scan(roots: [root + "/Nope"])
        XCTAssertTrue(result.files.isEmpty)
        XCTAssertEqual(result.skipped.count, 1)
    }

    func testCancelStopsTheScan() {
        let result = FolderScanner.scan(roots: [root], shouldCancel: { true })
        XCTAssertTrue(result.wasCancelled)
        XCTAssertTrue(result.files.isEmpty)
    }

    func testLimitStopsTheScan() {
        var options = ScanOptions()
        options.maxFiles = 2
        let result = FolderScanner.scan(roots: [root], options: options)
        XCTAssertTrue(result.hitLimit)
        XCTAssertEqual(result.files.count, 2)
    }

    /// The whole Organize Now preview on practice files: scan → suggestions → plan. Nothing moves.
    func testEndToEndDryRunChangesNothing() throws {
        let before = snapshot()
        let scan = FolderScanner.scan(roots: [root])
        let knowledge = ClassifierKnowledge(clients: [.init(name: "ACME", campaigns: ["Spring_Launch": []])])
        let volume = try XCTUnwrap(scan.files.first?.volumeID)
        let context = PlannerContext(clientsRoot: root + "/Creative_Master/01_CLIENTS", clientsRootVolumeID: volume,
                                     onlineVolumeIDs: [volume])
        let report = DryRun.build(scan: scan.files, knowledge: knowledge, context: context)

        XCTAssertEqual(snapshot(), before, "dry run changed something")
        // The teaser has no project file beside it, so it can be organized (with approval).
        let teaser = try XCTUnwrap(report.items.first { $0.file.path.hasSuffix("Teaser_01_v01.mp4") })
        guard case .move(let destination, false) = teaser.action.kind else { return XCTFail("\(teaser.action)") }
        XCTAssertTrue(destination.hasSuffix("/ACME/Spring_Launch/Teaser_01/Exports/Other_Formats/Drafts/ACME_Spring_Launch_Teaser_01_v01.mp4"))
        XCTAssertTrue(teaser.action.requiresApproval)
        // The project file stays put; the mystery file goes to review; fresh files are skipped.
        XCTAssertEqual(report.items.first { $0.file.path.hasSuffix(".prproj") }?.action.kind, .leaveInPlace(.linkUnknown))
        XCTAssertEqual(report.items.first { $0.file.path.hasSuffix("old_mystery.mov") }?.action.kind, .leaveInPlace(.unclassified))
        XCTAssertEqual(report.items.first { $0.file.path.hasSuffix("just_rendered.mov") }?.action.kind, .skip(.stillChanging))
        XCTAssertTrue(report.summary.contains("Nothing has been changed"))
    }
}
#endif
