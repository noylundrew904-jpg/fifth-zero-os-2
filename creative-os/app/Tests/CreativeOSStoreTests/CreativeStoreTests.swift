import XCTest
import GRDB
import CreativeOSCore
@testable import CreativeOSStore

/// Uses in-memory databases, or a disposable temporary folder created and removed by the test.
/// No user folders are involved. All file paths in records are fictional strings.
final class CreativeStoreTests: XCTestCase {
    private var tempDir: URL?

    override func tearDownWithError() throws {
        // Removes only the folder this test created inside the system temp directory.
        if let dir = tempDir, dir.path.hasPrefix(FileManager.default.temporaryDirectory.path) {
            try? FileManager.default.removeItem(at: dir)
        }
        tempDir = nil
    }

    private func makeTempDir() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("CreativeOSTests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: false)
        tempDir = dir
        return dir
    }

    // MARK: Schema

    func testMigrationCreatesAllTables() throws {
        let store = try CreativeStore.inMemory()
        try store.dbQueue.read { db in
            for table in ["volume", "asset", "rule", "operation", "auditEvent", "quarantineEntry"] {
                XCTAssertTrue(try db.tableExists(table), table)
            }
        }
    }

    func testDataSurvivesReopening() throws {
        let path = try makeTempDir().appendingPathComponent("creative-os.sqlite").path
        do {
            let store = try CreativeStore(path: path)
            try store.registerVolume(id: "VOL-1", name: "Fixture SSD", role: "Footage")
        }
        let reopened = try CreativeStore(path: path)
        XCTAssertEqual(try reopened.volumes().map(\.id), ["VOL-1"])
        XCTAssertEqual(try reopened.auditEvents().count, 1)
    }

    // MARK: Assets

    func testAssetIDStaysStableAcrossScans() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(id: "V", name: "Mac", role: "Active")
        let first = try store.upsertAsset(volumeID: "V", path: "/Fixture/a.mov", sizeBytes: 10)
        let second = try store.upsertAsset(volumeID: "V", path: "/Fixture/./a.mov", sizeBytes: 10)
        XCTAssertEqual(first.id, second.id)
        XCTAssertEqual(try store.assets(onVolume: "V").count, 1)
    }

    func testSizeChangeClearsHash() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(id: "V", name: "Mac", role: "Active")
        var asset = try store.upsertAsset(volumeID: "V", path: "/Fixture/a.mov", sizeBytes: 10)
        asset.sha256 = String(repeating: "a", count: 64)
        try store.dbQueue.write { db in try asset.update(db) }
        let updated = try store.upsertAsset(volumeID: "V", path: "/Fixture/a.mov", sizeBytes: 11)
        XCTAssertNil(updated.sha256)
    }

    func testRelativePathIsRejected() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(id: "V", name: "Mac", role: "Active")
        XCTAssertThrowsError(try store.upsertAsset(volumeID: "V", path: "relative/a.mov", sizeBytes: 1))
    }

    func testAssetRequiresKnownVolume() throws {
        let store = try CreativeStore.inMemory()
        XCTAssertThrowsError(try store.upsertAsset(volumeID: "UNKNOWN", path: "/Fixture/a.mov", sizeBytes: 1))
    }

    // MARK: Rules

    func testOnlyApprovedLowRiskRulesCount() throws {
        let store = try CreativeStore.inMemory()
        try store.addRule(id: "low", name: "Briefs to Brief_References", definition: "ext=pdf", isLowRisk: true)
        try store.addRule(id: "risky", name: "Cross-drive footage", definition: "ext=mov", isLowRisk: false)
        XCTAssertEqual(try store.approvedRuleIDs(), [])
        try store.approveRule(id: "low")
        XCTAssertThrowsError(try store.approveRule(id: "risky")) { error in
            XCTAssertEqual(error as? StoreError, .ruleNotLowRisk("risky"))
        }
        XCTAssertEqual(try store.approvedRuleIDs(), ["low"])
        try store.revokeRule(id: "low")
        XCTAssertEqual(try store.approvedRuleIDs(), [])
    }

    // MARK: Journal

    private func samplePlan() -> [PlannedAction] {
        let reel = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: "Reel_01",
                                     purpose: .exports, exportFormat: .instagramReels, stage: .drafts)
        let files = [
            FileFacts(path: "/Fixture/Downloads/reel.mp4", volumeID: "mac", sizeBytes: 1,
                      classification: Classification(location: reel, confidence: 0.95)),
            FileFacts(path: "/Fixture/Downloads/linked.mov", volumeID: "mac", sizeBytes: 1, linkState: .linked,
                      classification: Classification(location: reel, confidence: 0.95)),
            FileFacts(path: "/Fixture/Downloads/rendering.mov", volumeID: "mac", sizeBytes: 1, isStable: false,
                      classification: nil),
        ]
        let context = PlannerContext(clientsRoot: "/Fixture/Creative_Master/01_CLIENTS",
                                     clientsRootVolumeID: "mac", onlineVolumeIDs: ["mac"])
        return ActionPlanner.plan(files, context: context)
    }

    func testPlanJournalsOnlyMovesAndExecutesNothing() throws {
        let store = try CreativeStore.inMemory()
        let ops = try store.recordPlan(samplePlan(), batchID: "B1")
        XCTAssertEqual(ops.count, 1)
        XCTAssertEqual(ops.first?.state, .planned)
        XCTAssertEqual(try store.operations(batchID: "B1").count, 1)
        XCTAssertEqual(try store.auditEvents().last?.message,
                       "Dry run: 1 moves planned, 1 left in place, 1 skipped.")
    }

    func testValidTransitionsAreAudited() throws {
        let store = try CreativeStore.inMemory()
        let op = try XCTUnwrap(store.recordPlan(samplePlan()).first)
        try store.transition(operationID: op.id, to: .approved)
        try store.transition(operationID: op.id, to: .inProgress)
        XCTAssertEqual(try store.unfinishedOperations().map(\.id), [op.id])
        try store.transition(operationID: op.id, to: .completed)
        try store.transition(operationID: op.id, to: .undone)
        let kinds = try store.auditEvents().map(\.kind)
        XCTAssertEqual(Array(kinds.suffix(4)),
                       ["operation.approved", "operation.inProgress", "operation.completed", "operation.undone"])
        XCTAssertTrue(try store.unfinishedOperations().isEmpty)
    }

    func testCannotExecuteWithoutApprovalAndNothingIsLogged() throws {
        let store = try CreativeStore.inMemory()
        let op = try XCTUnwrap(store.recordPlan(samplePlan()).first)
        let before = try store.auditEvents().count
        XCTAssertThrowsError(try store.transition(operationID: op.id, to: .inProgress)) { error in
            XCTAssertEqual(error as? StoreError, .invalidTransition(from: .planned, to: .inProgress))
        }
        XCTAssertEqual(try store.auditEvents().count, before)
        XCTAssertEqual(try store.operations(batchID: op.batchID).first?.state, .planned)
    }

    func testFailureIsRecordedWithReason() throws {
        let store = try CreativeStore.inMemory()
        let op = try XCTUnwrap(store.recordPlan(samplePlan()).first)
        try store.transition(operationID: op.id, to: .approved)
        try store.transition(operationID: op.id, to: .inProgress)
        let failed = try store.transition(operationID: op.id, to: .failed, error: "Destination drive disconnected")
        XCTAssertEqual(failed.errorMessage, "Destination drive disconnected")
        XCTAssertTrue(try store.auditEvents().last?.message.contains("Destination drive disconnected") ?? false)
    }

    // MARK: Append-only guarantees

    func testAuditLogCannotBeEditedOrDeleted() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(id: "V", name: "Mac", role: "Active")
        XCTAssertThrowsError(try store.dbQueue.write { db in
            try db.execute(sql: "UPDATE auditEvent SET message = 'tampered'")
        })
        XCTAssertThrowsError(try store.dbQueue.write { db in
            try db.execute(sql: "DELETE FROM auditEvent")
        })
        XCTAssertEqual(try store.auditEvents().count, 1)
        XCTAssertNotEqual(try store.auditEvents().first?.message, "tampered")
    }

    func testQuarantineRecordsAreNeverDeleted() throws {
        let store = try CreativeStore.inMemory()
        let entry = try store.recordQuarantine(originalPath: "/Fixture/a copy.wav",
                                               quarantinePath: "/Fixture/Creative_Master/04_QUARANTINE/a copy.wav",
                                               keptCopyPath: "/Fixture/lib/a.wav",
                                               sha256: String(repeating: "a", count: 64), sizeBytes: 10,
                                               reason: "Byte-identical")
        XCTAssertEqual(entry.retentionDays, 30)
        try store.markRestored(quarantineID: entry.id)
        XCTAssertTrue(try store.quarantineEntries().isEmpty)
        XCTAssertEqual(try store.quarantineEntries(includeRestored: true).count, 1)
        XCTAssertThrowsError(try store.dbQueue.write { db in
            try db.execute(sql: "DELETE FROM quarantineEntry")
        })
    }

    // MARK: Registered drives (A3)

    private func fixtureDrive(uuid: String? = "1234-ABCD", name: String = "Fixture SSD",
                              path: String = "/Volumes/Fixture SSD") -> VolumeInfo {
        VolumeInfo(uuid: uuid, name: name, mountPath: path, totalBytes: 2_000_000_000_000,
                   availableBytes: 900_000_000_000, format: "APFS", isRemovable: true)
    }

    func testRegisterConnectedDriveByUUID() throws {
        let store = try CreativeStore.inMemory()
        let record = try store.registerVolume(fixtureDrive(), role: "Footage")
        XCTAssertEqual(record.id, "uuid:1234-ABCD")
        XCTAssertTrue(record.isStableID)
        XCTAssertEqual(record.lastMountPath, "/Volumes/Fixture SSD")
        XCTAssertEqual(try store.registeredVolumes(),
                       [RegisteredVolume(id: "uuid:1234-ABCD", name: "Fixture SSD", role: "Footage")])
    }

    func testDriveWithoutUUIDNeedsConfirmation() throws {
        let store = try CreativeStore.inMemory()
        XCTAssertThrowsError(try store.registerVolume(fixtureDrive(uuid: nil), role: "Archive")) { error in
            XCTAssertEqual(error as? StoreError, .unstableVolumeID("Fixture SSD"))
        }
        let record = try store.registerVolume(fixtureDrive(uuid: nil), role: "Archive", userConfirmedUnstableID: true)
        XCTAssertFalse(record.isStableID)
    }

    func testIneligibleDriveIsRefused() throws {
        let store = try CreativeStore.inMemory()
        let nas = VolumeInfo(uuid: "N", name: "NAS", mountPath: "/Volumes/NAS", totalBytes: 1, availableBytes: 1, isLocal: false)
        XCTAssertThrowsError(try store.registerVolume(nas, role: "Archive"))
        XCTAssertTrue(try store.registeredVolumes().isEmpty)
    }

    func testRecordSeenTracksNewMountPathAndSkipsOffline() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(fixtureDrive(), role: "Footage")
        try store.registerVolume(fixtureDrive(uuid: "9999-0000", name: "Archive", path: "/Volumes/Archive"), role: "Archive")
        let remounted = fixtureDrive(path: "/Volumes/Fixture SSD 1")
        let result = VolumeRegistry.resolve(registered: try store.registeredVolumes(), mounted: [remounted])
        XCTAssertEqual(result.statuses["uuid:9999-0000"], .offline)
        try store.recordSeen(result)
        let byID = Dictionary(uniqueKeysWithValues: try store.volumes().map { ($0.id, $0) })
        XCTAssertEqual(byID["uuid:1234-ABCD"]?.lastMountPath, "/Volumes/Fixture SSD 1")
        XCTAssertEqual(byID["uuid:9999-0000"]?.lastMountPath, "/Volumes/Archive")
    }

    func testUnregisterKeepsHistory() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(fixtureDrive(), role: "Footage")
        try store.unregisterVolume(id: "uuid:1234-ABCD")
        XCTAssertTrue(try store.registeredVolumes().isEmpty)
        XCTAssertEqual(try store.volumes().count, 1)
        XCTAssertEqual(try store.auditEvents().last?.kind, "volume.unregistered")
    }

    // MARK: Fingerprints (A5)

    func testFingerprintIsStoredOnlyWhenSizeMatches() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(id: "V", name: "Mac", role: "Active")
        let asset = try store.upsertAsset(volumeID: "V", path: "/Fixture/a.wav", sizeBytes: 10)
        let hash = String(repeating: "c", count: 64)
        XCTAssertThrowsError(try store.recordFingerprint(assetID: asset.id, FileFingerprint(sizeBytes: 11, sha256: hash))) { error in
            XCTAssertEqual(error as? StoreError, .sizeMismatch(expected: 10, actual: 11))
        }
        let saved = try store.recordFingerprint(assetID: asset.id, FileFingerprint(sizeBytes: 10, sha256: hash.uppercased()))
        XCTAssertEqual(saved.sha256, hash)
    }

    func testIdenticalGroupsNeedSameSizeAndHash() throws {
        let store = try CreativeStore.inMemory()
        try store.registerVolume(id: "V", name: "Mac", role: "Active")
        let h1 = String(repeating: "a", count: 64)
        let h2 = String(repeating: "b", count: 64)
        func add(_ path: String, _ size: Int64, _ hash: String?) throws {
            let a = try store.upsertAsset(volumeID: "V", path: path, sizeBytes: size)
            if let hash { try store.recordFingerprint(assetID: a.id, FileFingerprint(sizeBytes: size, sha256: hash)) }
        }
        try add("/Fixture/beat.wav", 10, h1)
        try add("/Fixture/beat copy.wav", 10, h1)
        try add("/Fixture/other/beat.wav", 10, h2)      // same name, different content
        try add("/Fixture/unhashed.wav", 10, nil)       // never grouped without a fingerprint
        let groups = try store.identicalAssetGroups()
        XCTAssertEqual(groups.map { $0.map(\.path) }, [["/Fixture/beat copy.wav", "/Fixture/beat.wav"]])
    }
}
