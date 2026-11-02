import Foundation

/// Metadata about one connected drive, as reported by macOS. No file contents involved.
public struct VolumeInfo: Equatable, Sendable {
    public let uuid: String?
    public let name: String
    public let mountPath: String
    public let totalBytes: Int64
    public let availableBytes: Int64
    public let format: String?
    public let isInternal: Bool
    public let isRemovable: Bool
    public let isLocal: Bool
    public let isRootFileSystem: Bool
    public let isBrowsable: Bool
    public let isReadOnly: Bool

    public init(uuid: String?, name: String, mountPath: String, totalBytes: Int64, availableBytes: Int64,
                format: String? = nil, isInternal: Bool = false, isRemovable: Bool = false, isLocal: Bool = true,
                isRootFileSystem: Bool = false, isBrowsable: Bool = true, isReadOnly: Bool = false) {
        self.uuid = uuid
        self.name = name
        self.mountPath = mountPath
        self.totalBytes = totalBytes
        self.availableBytes = availableBytes
        self.format = format
        self.isInternal = isInternal
        self.isRemovable = isRemovable
        self.isLocal = isLocal
        self.isRootFileSystem = isRootFileSystem
        self.isBrowsable = isBrowsable
        self.isReadOnly = isReadOnly
    }
}

/// How Creative OS recognises a drive. Mount paths and names can change; the volume UUID does not.
public struct VolumeIdentity: Hashable, Sendable {
    public let id: String
    /// False when the drive has no UUID (some FAT/exFAT drives). The user must confirm such drives.
    public let isStable: Bool

    public static func of(_ volume: VolumeInfo) -> VolumeIdentity {
        if let raw = volume.uuid?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty {
            return VolumeIdentity(id: "uuid:" + raw.uppercased(), isStable: true)
        }
        return VolumeIdentity(id: "fallback:\(volume.name)|\(volume.totalBytes)|\(volume.format ?? "?")",
                              isStable: false)
    }
}

public enum VolumeEligibility: Equatable, Sendable {
    case eligible
    case notEligible(String)
}

/// A drive the user registered.
public struct RegisteredVolume: Equatable, Sendable {
    public let id: String
    public let name: String
    public let role: String

    public init(id: String, name: String, role: String) {
        self.id = id
        self.name = name
        self.role = role
    }
}

public enum VolumeStatus: Equatable, Sendable {
    case online(VolumeInfo)
    case offline
    /// Two connected drives claim the same identity (e.g. a cloned disk). Neither is used.
    case ambiguous(mountPaths: [String])

    public var isUsable: Bool {
        if case .online = self { return true }
        return false
    }
}

public struct VolumeScanResult: Equatable, Sendable {
    /// Status of every registered drive, keyed by registered ID.
    public let statuses: [String: VolumeStatus]
    /// Connected drives that could be registered.
    public let unregisteredEligible: [VolumeInfo]
    /// Plain-language notes, e.g. a drive was renamed.
    public let notes: [String]
}

public enum VolumeRules {
    public static func eligibility(_ v: VolumeInfo) -> VolumeEligibility {
        if !v.isLocal { return .notEligible("Network drives aren't supported; they can disconnect mid-copy.") }
        if !v.isBrowsable { return .notEligible("Hidden system volume.") }
        if v.isReadOnly { return .notEligible("Read-only volume (for example a disk image or installer).") }
        if v.totalBytes <= 0 { return .notEligible("macOS did not report its capacity.") }
        return .eligible
    }
}

/// Pure matching of registered drives to what is connected right now.
public enum VolumeRegistry {
    public static func resolve(registered: [RegisteredVolume], mounted: [VolumeInfo]) -> VolumeScanResult {
        var byID: [String: [VolumeInfo]] = [:]
        for v in mounted { byID[VolumeIdentity.of(v).id, default: []].append(v) }

        var statuses: [String: VolumeStatus] = [:]
        var notes: [String] = []
        for reg in registered {
            let matches = byID[reg.id] ?? []
            switch matches.count {
            case 0:
                statuses[reg.id] = .offline
            case 1:
                let v = matches[0]
                statuses[reg.id] = .online(v)
                if v.name != reg.name { notes.append("“\(reg.name)” is now called “\(v.name)”. Recognised by its ID.") }
            default:
                statuses[reg.id] = .ambiguous(mountPaths: matches.map(\.mountPath).sorted())
                notes.append("Two connected drives look like “\(reg.name)”. Neither will be used until one is disconnected.")
            }
        }

        let registeredIDs = Set(registered.map(\.id))
        let candidates = mounted
            .filter { !registeredIDs.contains(VolumeIdentity.of($0).id) }
            .filter { VolumeRules.eligibility($0) == .eligible }
            .sorted { $0.mountPath < $1.mountPath }
        return VolumeScanResult(statuses: statuses, unregisteredEligible: candidates, notes: notes)
    }

    /// The only way to turn a stored drive-relative path into a real one.
    /// Nil if the drive is offline or ambiguous; never falls back to another location.
    public static func absolutePath(relative: String, onVolume id: String,
                                    statuses: [String: VolumeStatus]) -> String? {
        guard case .online(let info)? = statuses[id] else { return nil }
        let components = relative.split(separator: "/").map(String.init)
        guard !components.isEmpty else { return nil }
        for c in components where c == "." || c == ".." { return nil }
        return PathSafety.join(info.mountPath, components)
    }

    /// Drive-relative form of an absolute path, so stored paths survive the drive being remounted elsewhere.
    public static func relativePath(of absolute: String, mountPath: String) -> String? {
        guard let p = PathSafety.normalizedAbsolute(absolute),
              let m = PathSafety.normalizedAbsolute(mountPath),
              PathSafety.isContained(p, in: m), p != m else { return nil }
        return m == "/" ? String(p.dropFirst()) : String(p.dropFirst(m.count + 1))
    }

    /// True only if the drive is online and the copy leaves the safety margin free.
    public static func canFit(bytes: Int64, onVolume id: String, statuses: [String: VolumeStatus]) -> Bool {
        guard case .online(let info)? = statuses[id] else { return false }
        return StorageRules.canFit(bytes: bytes, freeBytes: info.availableBytes)
    }
}
