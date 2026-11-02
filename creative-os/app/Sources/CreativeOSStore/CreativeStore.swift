import Foundation
import GRDB
import CreativeOSCore

public enum StoreError: Error, Equatable {
    case invalidPath(String)
    case notFound(String)
    case invalidTransition(from: OperationState, to: OperationState)
    case ruleNotLowRisk(String)
}

/// Creative OS's private notebook: index, rules, operation journal, audit log, quarantine manifest.
///
/// This type only records information. It never moves, copies or deletes files,
/// and it offers no way to delete journal, audit or quarantine records.
public final class CreativeStore {
    public let dbQueue: DatabaseQueue

    /// Opens (or creates) the database file at `path` and applies migrations.
    public convenience init(path: String) throws {
        try self.init(queue: DatabaseQueue(path: path))
    }

    /// A throwaway in-memory database, for tests and previews.
    public static func inMemory() throws -> CreativeStore {
        try CreativeStore(queue: DatabaseQueue())
    }

    init(queue: DatabaseQueue) throws {
        dbQueue = queue
        try Schema.migrator.migrate(queue)
    }

    // MARK: Volumes

    @discardableResult
    public func registerVolume(id: String, name: String, role: String, at now: Date = Date()) throws -> VolumeRecord {
        try dbQueue.write { db in
            var volume = try VolumeRecord.fetchOne(db, key: id)
                ?? VolumeRecord(id: id, name: name, role: role, isRegistered: false,
                                registeredAt: nil, lastSeenAt: nil)
            volume.name = name
            volume.role = role
            volume.isRegistered = true
            volume.registeredAt = volume.registeredAt ?? now
            volume.lastSeenAt = now
            try volume.save(db)
            try Self.audit(db, "volume.registered", "Registered drive “\(name)” as \(role).", at: now)
            return volume
        }
    }

    public func volumes() throws -> [VolumeRecord] {
        try dbQueue.read { db in try VolumeRecord.order(Column("name")).fetchAll(db) }
    }

    // MARK: Assets

    /// Records a file seen by a scan. The same volume + path always keeps the same asset ID.
    @discardableResult
    public func upsertAsset(volumeID: String, path: String, sizeBytes: Int64, at now: Date = Date()) throws -> AssetRecord {
        guard let normalized = PathSafety.normalizedAbsolute(path) else { throw StoreError.invalidPath(path) }
        return try dbQueue.write { db in
            if var existing = try AssetRecord
                .filter(Column("volumeID") == volumeID && Column("path") == normalized)
                .fetchOne(db) {
                if existing.sizeBytes != sizeBytes { existing.sha256 = nil }   // content may have changed
                existing.sizeBytes = sizeBytes
                existing.lastSeenAt = now
                try existing.update(db)
                return existing
            }
            let asset = AssetRecord(id: UUID().uuidString, volumeID: volumeID, path: normalized,
                                    sizeBytes: sizeBytes, sha256: nil, firstSeenAt: now, lastSeenAt: now)
            try asset.insert(db)
            return asset
        }
    }

    public func assets(onVolume volumeID: String) throws -> [AssetRecord] {
        try dbQueue.read { db in
            try AssetRecord.filter(Column("volumeID") == volumeID).order(Column("path")).fetchAll(db)
        }
    }

    // MARK: Rules

    public func addRule(id: String, name: String, definition: String, isLowRisk: Bool,
                        at now: Date = Date()) throws {
        try dbQueue.write { db in
            let rule = RuleRecord(id: id, name: name, definition: definition, isLowRisk: isLowRisk,
                                  isApproved: false, createdAt: now, approvedAt: nil)
            try rule.insert(db)
            try Self.audit(db, "rule.added", "Added rule “\(name)” (not approved yet).", at: now)
        }
    }

    /// The user approves a rule for one-click auto-execution. Only low-risk rules qualify.
    public func approveRule(id: String, at now: Date = Date()) throws {
        try dbQueue.write { db in
            guard var rule = try RuleRecord.fetchOne(db, key: id) else { throw StoreError.notFound(id) }
            guard rule.isLowRisk else { throw StoreError.ruleNotLowRisk(id) }
            rule.isApproved = true
            rule.approvedAt = now
            try rule.update(db)
            try Self.audit(db, "rule.approved", "You approved rule “\(rule.name)”.", at: now)
        }
    }

    public func revokeRule(id: String, at now: Date = Date()) throws {
        try dbQueue.write { db in
            guard var rule = try RuleRecord.fetchOne(db, key: id) else { throw StoreError.notFound(id) }
            rule.isApproved = false
            rule.approvedAt = nil
            try rule.update(db)
            try Self.audit(db, "rule.revoked", "Approval removed from rule “\(rule.name)”.", at: now)
        }
    }

    /// IDs the planner may treat as pre-approved: approved AND low-risk.
    public func approvedRuleIDs() throws -> Set<String> {
        try dbQueue.read { db in
            let rules = try RuleRecord
                .filter(Column("isApproved") == true && Column("isLowRisk") == true)
                .fetchAll(db)
            return Set(rules.map(\.id))
        }
    }

    // MARK: Operation journal

    /// Saves a dry-run plan. Moves become `planned` journal entries; nothing is executed.
    @discardableResult
    public func recordPlan(_ actions: [PlannedAction], batchID: String = UUID().uuidString,
                           at now: Date = Date()) throws -> [OperationRecord] {
        try dbQueue.write { db in
            var records: [OperationRecord] = []
            var leftInPlace = 0
            var skipped = 0
            for action in actions {
                switch action.kind {
                case .move(let destination, let crossVolume):
                    let record = OperationRecord(
                        id: UUID().uuidString, batchID: batchID, assetID: nil, kind: "move",
                        sourcePath: action.sourcePath, destinationPath: destination, crossVolume: crossVolume,
                        state: .planned, risk: action.risk.rawValue, requiresApproval: action.requiresApproval,
                        explanation: action.explanation, createdAt: now, updatedAt: now, errorMessage: nil)
                    try record.insert(db)
                    records.append(record)
                case .leaveInPlace:
                    leftInPlace += 1
                case .skip:
                    skipped += 1
                }
            }
            try Self.audit(db, "plan.created",
                           "Dry run: \(records.count) moves planned, \(leftInPlace) left in place, \(skipped) skipped.",
                           at: now)
            return records
        }
    }

    /// Moves an operation to its next state. Invalid steps are refused and nothing is written.
    @discardableResult
    public func transition(operationID: String, to next: OperationState, error: String? = nil,
                           at now: Date = Date()) throws -> OperationRecord {
        try dbQueue.write { db in
            guard var op = try OperationRecord.fetchOne(db, key: operationID) else {
                throw StoreError.notFound(operationID)
            }
            guard op.state.canTransition(to: next) else {
                throw StoreError.invalidTransition(from: op.state, to: next)
            }
            let previous = op.state
            op.state = next
            op.updatedAt = now
            op.errorMessage = error
            try op.update(db)
            var message = "\(op.kind): \(previous.rawValue) → \(next.rawValue) for \(op.sourcePath)"
            if let error { message += ". Error: \(error)" }
            try Self.audit(db, "operation.\(next.rawValue)", message, operationID: op.id, at: now)
            return op
        }
    }

    public func operations(batchID: String) throws -> [OperationRecord] {
        try dbQueue.read { db in
            try OperationRecord.filter(Column("batchID") == batchID).order(Column("createdAt")).fetchAll(db)
        }
    }

    /// Operations left mid-way (e.g. after a crash), to resume or roll back on the next Organize Now.
    public func unfinishedOperations() throws -> [OperationRecord] {
        try dbQueue.read { db in
            try OperationRecord.filter(Column("state") == OperationState.inProgress.rawValue).fetchAll(db)
        }
    }

    // MARK: Quarantine manifest

    @discardableResult
    public func recordQuarantine(originalPath: String, quarantinePath: String, keptCopyPath: String,
                                 sha256: String, sizeBytes: Int64, reason: String,
                                 retentionDays: Int = QuarantinePolicy.defaultRetentionDays,
                                 at now: Date = Date()) throws -> QuarantineRecord {
        for p in [originalPath, quarantinePath, keptCopyPath] where PathSafety.normalizedAbsolute(p) == nil {
            throw StoreError.invalidPath(p)
        }
        return try dbQueue.write { db in
            let entry = QuarantineRecord(id: UUID().uuidString, assetID: nil, originalPath: originalPath,
                                         quarantinePath: quarantinePath, keptCopyPath: keptCopyPath,
                                         sha256: sha256, sizeBytes: sizeBytes, reason: reason,
                                         retentionDays: retentionDays, quarantinedAt: now, restoredAt: nil)
            try entry.insert(db)
            try Self.audit(db, "quarantine.recorded", "Quarantined \(originalPath). Restorable.", at: now)
            return entry
        }
    }

    public func markRestored(quarantineID: String, at now: Date = Date()) throws {
        try dbQueue.write { db in
            guard var entry = try QuarantineRecord.fetchOne(db, key: quarantineID) else {
                throw StoreError.notFound(quarantineID)
            }
            entry.restoredAt = now
            try entry.update(db)
            try Self.audit(db, "quarantine.restored", "Restored \(entry.originalPath).", at: now)
        }
    }

    public func quarantineEntries(includeRestored: Bool = false) throws -> [QuarantineRecord] {
        try dbQueue.read { db in
            var request = QuarantineRecord.order(Column("quarantinedAt"))
            if !includeRestored { request = request.filter(Column("restoredAt") == nil) }
            return try request.fetchAll(db)
        }
    }

    // MARK: Audit log

    public func auditEvents() throws -> [AuditEvent] {
        try dbQueue.read { db in try AuditEvent.order(Column("id")).fetchAll(db) }
    }

    private static func audit(_ db: Database, _ kind: String, _ message: String,
                              operationID: String? = nil, at now: Date) throws {
        try db.execute(sql: "INSERT INTO auditEvent (at, kind, operationID, message) VALUES (?, ?, ?, ?)",
                       arguments: [now, kind, operationID, message])
    }
}
