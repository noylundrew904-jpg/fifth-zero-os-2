import Foundation

// MARK: - Storage

public enum StorageRules {
    public static let minimumFreeBytes: Int64 = 50_000_000_000   // 50 GB
    public static let minimumFreeFraction = 0.15                  // 15 %
    /// Extra room kept free when checking whether a copy fits.
    public static let copySafetyMarginBytes: Int64 = 1_000_000_000

    /// Warn when free space drops below the larger of 15 % of capacity or 50 GB.
    public static func lowSpaceThreshold(totalBytes: Int64) -> Int64 {
        // Integer ceiling of 15 % (avoids floating-point rounding).
        let fraction = (max(0, totalBytes) * 15 + 99) / 100
        return max(fraction, minimumFreeBytes)
    }

    public static func isLowOnSpace(totalBytes: Int64, freeBytes: Int64) -> Bool {
        freeBytes < lowSpaceThreshold(totalBytes: totalBytes)
    }

    public static func canFit(bytes: Int64, freeBytes: Int64) -> Bool {
        bytes >= 0 && freeBytes - bytes >= copySafetyMarginBytes
    }
}

// MARK: - Duplicates

public enum LinkState: String, Sendable {
    case notLinked
    case linked
    /// Could not determine (e.g. unparsed project format). Treated like linked.
    case unknown
}

public struct FileFingerprint: Hashable, Sendable {
    public let sizeBytes: Int64
    /// Full-file SHA-256, lowercase hex. Nil until hashed.
    public let sha256: String?

    public init(sizeBytes: Int64, sha256: String?) {
        self.sizeBytes = sizeBytes
        self.sha256 = sha256
    }
}

public enum DuplicateRules {
    /// Byte-identical only when sizes match AND both full SHA-256 hashes are known and equal.
    /// Same filename, similar look or similar export settings never count.
    public static func areByteIdentical(_ a: FileFingerprint, _ b: FileFingerprint) -> Bool {
        guard a.sizeBytes == b.sizeBytes,
              let ha = a.sha256?.lowercased(), let hb = b.sha256?.lowercased(),
              ha.count == 64, isHex(ha) else { return false }
        return ha == hb
    }

    /// Prefilter: only files sharing a size (and > 0 bytes) can be duplicates, so only these get hashed.
    public static func sizeGroupsNeedingHash<T>(_ items: [T], size: (T) -> Int64) -> [[T]] {
        var groups: [Int64: [T]] = [:]
        for item in items {
            let s = size(item)
            if s > 0 { groups[s, default: []].append(item) }
        }
        return groups.keys.sorted().compactMap { key in
            let g = groups[key] ?? []
            return g.count > 1 ? g : nil
        }
    }

    private static func isHex(_ s: String) -> Bool {
        s.unicodeScalars.allSatisfy { ("0"..."9").contains($0) || ("a"..."f").contains($0) }
    }
}

public struct DuplicateCandidate: Sendable {
    public let path: String
    public let fingerprint: FileFingerprint
    /// File-system identity (inode). Equal IDs mean hard links to the same data.
    public let fileID: UInt64?
    public let volumeOnline: Bool
    public let linkState: LinkState
    public let isActiveWorkingFile: Bool
    public let isLibraryMaster: Bool
    public let isVerifiedBackup: Bool

    public init(path: String, fingerprint: FileFingerprint, fileID: UInt64? = nil, volumeOnline: Bool = true,
                linkState: LinkState = .notLinked, isActiveWorkingFile: Bool = false,
                isLibraryMaster: Bool = false, isVerifiedBackup: Bool = false) {
        self.path = path
        self.fingerprint = fingerprint
        self.fileID = fileID
        self.volumeOnline = volumeOnline
        self.linkState = linkState
        self.isActiveWorkingFile = isActiveWorkingFile
        self.isLibraryMaster = isLibraryMaster
        self.isVerifiedBackup = isVerifiedBackup
    }
}

public enum QuarantineDecision: Equatable, Sendable {
    /// May be quarantined (reversibly) under an approved rule, or after the user approves it.
    case eligible(needsApproval: Bool)
    /// Shown for review only; the app will not quarantine it.
    case reviewOnly([String])
}

public enum QuarantinePolicy {
    public static let defaultRetentionDays = 30

    /// Decide whether `candidate` may be quarantined while `kept` stays where it is.
    public static func decide(candidate: DuplicateCandidate, kept: DuplicateCandidate,
                              ruleApproved: Bool) -> QuarantineDecision {
        var reasons: [String] = []
        if !DuplicateRules.areByteIdentical(candidate.fingerprint, kept.fingerprint) {
            reasons.append("Not verified byte-identical (full SHA-256 required).")
        }
        if PathSafety.normalizedAbsolute(candidate.path) == PathSafety.normalizedAbsolute(kept.path) {
            reasons.append("Both entries are the same file.")
        }
        if let a = candidate.fileID, let b = kept.fileID, a == b {
            reasons.append("Hard links to the same data; quarantining would free no space.")
        }
        if !candidate.volumeOnline { reasons.append("The duplicate's drive is offline.") }
        if !kept.volumeOnline { reasons.append("The copy that would be kept is offline, so it can't be verified.") }
        switch candidate.linkState {
        case .linked: reasons.append("A project links to this file.")
        case .unknown: reasons.append("Can't tell whether a project links to this file.")
        case .notLinked: break
        }
        if candidate.isActiveWorkingFile { reasons.append("It's an active working file.") }
        if candidate.isLibraryMaster { reasons.append("It's the shared-library master copy.") }
        if candidate.isVerifiedBackup { reasons.append("It's part of a verified backup.") }

        return reasons.isEmpty ? .eligible(needsApproval: !ruleApproved) : .reviewOnly(reasons)
    }

    /// After the retention period the app may *suggest* permanent deletion. It never deletes by itself.
    public static func deletionSuggestionDue(quarantinedAt: Date, now: Date,
                                             retentionDays: Int = defaultRetentionDays) -> Bool {
        guard retentionDays >= 1 else { return false }
        return now >= quarantinedAt.addingTimeInterval(Double(retentionDays) * 86_400)
    }
}
