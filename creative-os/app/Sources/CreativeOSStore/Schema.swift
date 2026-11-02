import Foundation
import GRDB

/// Database migrations. Existing migrations are never edited; changes go in new ones.
enum Schema {
    static var migrator: DatabaseMigrator {
        var migrator = DatabaseMigrator()

        migrator.registerMigration("v1") { db in
            try db.create(table: "volume") { t in
                t.primaryKey("id", .text)
                t.column("name", .text).notNull()
                t.column("role", .text).notNull().defaults(to: "")
                t.column("isRegistered", .boolean).notNull().defaults(to: false)
                t.column("registeredAt", .datetime)
                t.column("lastSeenAt", .datetime)
            }

            try db.create(table: "asset") { t in
                t.primaryKey("id", .text)
                t.column("volumeID", .text).notNull().indexed().references("volume")
                t.column("path", .text).notNull()
                t.column("sizeBytes", .integer).notNull()
                t.column("sha256", .text)
                t.column("firstSeenAt", .datetime).notNull()
                t.column("lastSeenAt", .datetime).notNull()
                t.uniqueKey(["volumeID", "path"])
            }

            try db.create(table: "rule") { t in
                t.primaryKey("id", .text)
                t.column("name", .text).notNull()
                t.column("definition", .text).notNull()
                t.column("isLowRisk", .boolean).notNull()
                t.column("isApproved", .boolean).notNull().defaults(to: false)
                t.column("createdAt", .datetime).notNull()
                t.column("approvedAt", .datetime)
            }

            try db.create(table: "operation") { t in
                t.primaryKey("id", .text)
                t.column("batchID", .text).notNull().indexed()
                t.column("assetID", .text).references("asset")
                t.column("kind", .text).notNull()
                t.column("sourcePath", .text).notNull()
                t.column("destinationPath", .text)
                t.column("crossVolume", .boolean).notNull()
                t.column("state", .text).notNull()
                t.column("risk", .integer).notNull()
                t.column("requiresApproval", .boolean).notNull()
                t.column("explanation", .text).notNull()
                t.column("createdAt", .datetime).notNull()
                t.column("updatedAt", .datetime).notNull()
                t.column("errorMessage", .text)
            }

            try db.create(table: "auditEvent") { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("at", .datetime).notNull()
                t.column("kind", .text).notNull()
                t.column("operationID", .text)
                t.column("message", .text).notNull()
            }
            // Append-only: the database itself refuses to edit or delete audit lines.
            try db.execute(sql: """
                CREATE TRIGGER auditEvent_no_update BEFORE UPDATE ON auditEvent
                BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
                CREATE TRIGGER auditEvent_no_delete BEFORE DELETE ON auditEvent
                BEGIN SELECT RAISE(ABORT, 'audit log is append-only'); END;
                """)

            try db.create(table: "quarantineEntry") { t in
                t.primaryKey("id", .text)
                t.column("assetID", .text).references("asset")
                t.column("originalPath", .text).notNull()
                t.column("quarantinePath", .text).notNull()
                t.column("keptCopyPath", .text).notNull()
                t.column("sha256", .text).notNull()
                t.column("sizeBytes", .integer).notNull()
                t.column("reason", .text).notNull()
                t.column("retentionDays", .integer).notNull()
                t.column("quarantinedAt", .datetime).notNull()
                t.column("restoredAt", .datetime)
            }
            // Quarantine entries are a permanent record: never deleted.
            try db.execute(sql: """
                CREATE TRIGGER quarantineEntry_no_delete BEFORE DELETE ON quarantineEntry
                BEGIN SELECT RAISE(ABORT, 'quarantine records are permanent'); END;
                """)
        }

        migrator.registerMigration("v2-volume-details") { db in
            try db.alter(table: "volume") { t in
                t.add(column: "isStableID", .boolean).notNull().defaults(to: true)
                t.add(column: "lastMountPath", .text)
                t.add(column: "totalBytes", .integer)
            }
        }

        migrator.registerMigration("v3-operation-fingerprint") { db in
            try db.alter(table: "operation") { t in
                t.add(column: "movedSizeBytes", .integer)
                t.add(column: "movedModifiedAt", .datetime)
            }
        }

        return migrator
    }
}
