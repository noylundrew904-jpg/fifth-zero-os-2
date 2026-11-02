import Foundation
import GRDB
import CreativeOSCore

/// A drive Creative OS knows about. `id` is the volume UUID.
public struct VolumeRecord: Codable, Equatable, FetchableRecord, PersistableRecord, Sendable {
    public static let databaseTableName = "volume"
    public var id: String
    public var name: String
    public var role: String
    public var isRegistered: Bool
    public var registeredAt: Date?
    public var lastSeenAt: Date?
    // Added in migration v2:
    /// False when the drive had no UUID and the user confirmed a fallback identity.
    public var isStableID: Bool
    public var lastMountPath: String?
    public var totalBytes: Int64?
}

/// One file, with an identifier that stays the same across scans (and later, across moves).
public struct AssetRecord: Codable, Equatable, FetchableRecord, PersistableRecord, Sendable {
    public static let databaseTableName = "asset"
    public var id: String
    public var volumeID: String
    public var path: String
    public var sizeBytes: Int64
    public var sha256: String?
    public var firstSeenAt: Date
    public var lastSeenAt: Date
}

/// A sorting rule. Only approved, low-risk rules may run without asking.
public struct RuleRecord: Codable, Equatable, FetchableRecord, PersistableRecord, Sendable {
    public static let databaseTableName = "rule"
    public var id: String
    public var name: String
    /// Human-readable or JSON description of what the rule matches. Inspectable and editable.
    public var definition: String
    public var isLowRisk: Bool
    public var isApproved: Bool
    public var createdAt: Date
    public var approvedAt: Date?
}

/// One journaled file operation (the "operation journal").
public struct OperationRecord: Codable, Equatable, FetchableRecord, PersistableRecord, Sendable {
    public static let databaseTableName = "operation"
    public var id: String
    public var batchID: String
    public var assetID: String?
    public var kind: String
    public var sourcePath: String
    public var destinationPath: String?
    public var crossVolume: Bool
    public var state: OperationState
    public var risk: Int
    public var requiresApproval: Bool
    public var explanation: String
    public var createdAt: Date
    public var updatedAt: Date
    public var errorMessage: String?
    // Added in migration v3: what the moved file looked like right after the move.
    // Undo only proceeds if the file still matches, so it never "restores" a file you edited later.
    public var movedSizeBytes: Int64?
    public var movedModifiedAt: Date?
}

/// One line of the append-only audit log. The database refuses edits and deletions.
public struct AuditEvent: Codable, Equatable, FetchableRecord, TableRecord, Sendable {
    public static let databaseTableName = "auditEvent"
    public var id: Int64
    public var at: Date
    public var kind: String
    public var operationID: String?
    public var message: String
}

/// Quarantine manifest entry. Restoring marks it restored; nothing is ever deleted.
public struct QuarantineRecord: Codable, Equatable, FetchableRecord, PersistableRecord, Sendable {
    public static let databaseTableName = "quarantineEntry"
    public var id: String
    public var assetID: String?
    public var originalPath: String
    public var quarantinePath: String
    public var keptCopyPath: String
    public var sha256: String
    public var sizeBytes: Int64
    public var reason: String
    public var retentionDays: Int
    public var quarantinedAt: Date
    public var restoredAt: Date?
}
