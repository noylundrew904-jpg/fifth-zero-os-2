import Foundation

// MARK: - Data provenance

/// Where the numbers on screen come from. The UI must label anything that is not `.live`.
public enum DataSource: String, Sendable {
    case mock
    case live
}

// MARK: - Storage

public enum VolumeKind: String, Sendable {
    case internalDisk
    case external

    public var title: String {
        switch self {
        case .internalDisk: return "Internal"
        case .external: return "External"
        }
    }
}

public struct StorageVolume: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let name: String
    public let kind: VolumeKind
    public let role: String
    public let totalBytes: Int64
    public let freeBytes: Int64
    public let isOnline: Bool
    public let isRegistered: Bool

    public var usedBytes: Int64 { max(0, totalBytes - freeBytes) }
    public var usedFraction: Double {
        totalBytes > 0 ? Double(usedBytes) / Double(totalBytes) : 0
    }
}

// MARK: - Projects

public enum ProjectStatus: String, Sendable {
    case active
    case idle

    public var title: String {
        switch self {
        case .active: return "Active"
        case .idle: return "Idle"
        }
    }
}

/// Whether we know which external files a project depends on.
/// Anything other than `.resolved` means: never move or rename its media.
public enum DependencyState: String, Sendable {
    case resolved
    case unresolved
    case notChecked

    public var title: String {
        switch self {
        case .resolved: return "Links verified"
        case .unresolved: return "Unresolved links"
        case .notChecked: return "Not checked"
        }
    }

    public var allowsMoves: Bool { self == .resolved }
}

public struct Project: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let client: String
    public let name: String
    public let status: ProjectStatus
    public let lastActivity: Date
    public let sizeBytes: Int64
    public let fileCount: Int
    public let volumeName: String
    public let dependencyState: DependencyState
}

// MARK: - Review inbox

public struct ReviewItem: Identifiable, Hashable, Sendable {
    public let id: UUID
    /// Original path. Review items are never moved.
    public let path: String
    public let fileType: String
    public let reason: String
    public let suggestion: String?
    public let confidence: Double
}

// MARK: - Quarantine

public struct QuarantineItem: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let originalPath: String
    public let keptCopyPath: String
    public let sha256: String
    public let sizeBytes: Int64
    public let quarantinedAt: Date
    public let reason: String
}

// MARK: - Archive

public struct ArchiveSuggestion: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let client: String
    public let project: String
    public let inactiveDays: Int
    public let sizeBytes: Int64
    public let destination: String
    /// Reasons the archive cannot proceed yet. Empty means it could be offered for approval.
    public let blockers: [String]

    public var isReady: Bool { blockers.isEmpty }
}

// MARK: - Activity log

public enum Outcome: String, Sendable {
    case success
    case skipped
    case failed

    public var title: String {
        switch self {
        case .success: return "Done"
        case .skipped: return "Skipped"
        case .failed: return "Failed"
        }
    }
}

public struct ActivityEntry: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let date: Date
    public let action: String
    public let detail: String
    public let outcome: Outcome
    public let canUndo: Bool
}

// MARK: - Dry-run plan

public enum OperationKind: String, Sendable {
    case move
    case rename
    case quarantine
    case archive
    case leaveInPlace

    public var title: String {
        switch self {
        case .move: return "Move"
        case .rename: return "Rename"
        case .quarantine: return "Quarantine"
        case .archive: return "Archive"
        case .leaveInPlace: return "Leave in place"
        }
    }

    /// Operations that always require explicit approval (decision 12).
    public var alwaysNeedsApproval: Bool {
        self == .quarantine || self == .archive
    }
}

public enum Risk: Int, Comparable, Sendable {
    case noChange = 0
    case low
    case medium
    case high

    public var title: String {
        switch self {
        case .noChange: return "No change"
        case .low: return "Low risk"
        case .medium: return "Medium risk"
        case .high: return "High risk"
        }
    }

    public static func < (lhs: Risk, rhs: Risk) -> Bool { lhs.rawValue < rhs.rawValue }
}

public struct PlannedOperation: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let kind: OperationKind
    public let source: String
    public let destination: String?
    public let reason: String
    public let confidence: Double
    public let risk: Risk
    /// True when the file is referenced by a project file (or might be).
    public let isLinkedToProject: Bool
    /// False only for operations covered by a previously approved low-risk rule.
    public let needsApproval: Bool
}

// MARK: - Search

public struct SearchRecord: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let path: String
    public let client: String
    public let project: String
    public let fileType: String
    public let tags: [String]
    public let modified: Date

    public var fileName: String {
        path.split(separator: "/").last.map(String.init) ?? path
    }
}

public struct SearchHit: Identifiable, Hashable, Sendable {
    public var id: UUID { record.id }
    public let record: SearchRecord
    /// Human-readable explanation of why this record matched (spec: "show why each result matched").
    public let reasons: [String]
}

// MARK: - Snapshot

public struct DashboardSnapshot: Sendable {
    public let source: DataSource
    public let generatedAt: Date
    public let volumes: [StorageVolume]
    public let projects: [Project]
    public let reviewItems: [ReviewItem]
    public let quarantine: [QuarantineItem]
    public let archiveSuggestions: [ArchiveSuggestion]
    public let activity: [ActivityEntry]
    public let plannedOperations: [PlannedOperation]
    public let searchIndex: [SearchRecord]

    public var activeProjects: [Project] { projects.filter { $0.status == .active } }
}
