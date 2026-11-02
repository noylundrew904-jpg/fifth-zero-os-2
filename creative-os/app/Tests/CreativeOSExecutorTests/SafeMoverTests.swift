import XCTest
import CreativeOSCore
import CreativeOSStore
@testable import CreativeOSExecutor

/// Every test works only inside two throwaway folders it creates in the system temp directory
/// ("root", which the mover is allowed to touch, and "outside", which it is not), and removes them afterwards.
final class SafeMoverTests: XCTestCase {
    private let fm = FileManager.default
    private var root = ""
    private var outside = ""
    private var store: CreativeStore!
    private var mover: SafeMover!

    private let reel = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: "Reel_01",
                                         purpose: .exports, exportFormat: .instagramReels, stage: .drafts)

    override func setUpWithError() throws {
        let tmp = fm.temporaryDirectory.path
        root = tmp + "/CreativeOSMoverTest-\(UUID().uuidString)"
        outside = tmp + "/CreativeOSMoverOutside-\(UUID().uuidString)"
        try fm.createDirectory(atPath: root + "/Downloads", withIntermediateDirectories: true)
        try fm.createDirectory(atPath: outside, withIntermediateDirectories: true)
        store = try CreativeStore.inMemory()
        mover = SafeMover(store: store, allowedRoots: [root])
    }

    override func tearDownWithError() throws {
        let tmp = fm.temporaryDirectory.path
        for dir in [root, outside] where dir.hasPrefix(tmp + "/CreativeOSMover") {
            try? fm.setAttributes([.posixPermissions: 0o755], ofItemAtPath: dir + "/Downloads")
            try? fm.removeItem(atPath: dir)
        }
    }

    // MARK: Helpers

    @discardableResult
    private func makeFile(_ path: String, _ text: String = "practice file") throws -> Data {
        let data = Data(text.utf8)
        try fm.createDirectory(atPath: (path as NSString).deletingLastPathComponent, withIntermediateDirectories: true)
        XCTAssertTrue(fm.createFile(atPath: path, contents: data))
        return data
    }

    private var clientsRoot: String { root + "/Creative_Master/01_CLIENTS" }
    private var reelFolder: String {
        clientsRoot + "/AMINTIRI/Coffee_Campaign/Reel_01/Exports/Instagram_Reels/Drafts"
    }

    /// Plans one move with the real planner, journals it, and (optionally) approves it.
    private func journaledMove(_ source: String, volume: String = "mac", approve: Bool = true) throws -> OperationRecord {
        let facts = FileFacts(path: source, volumeID: volume, sizeBytes: 1,
                              classification: Classification(location: reel, confidence: 0.99))
        let context = PlannerContext(clientsRoot: clientsRoot, clientsRootVolumeID: "mac",
                                     onlineVolumeIDs: ["mac", "ssd"])
        let plan = ActionPlanner.plan([facts], context: context)
        let op = try XCTUnwrap(store.recordPlan(plan).first, "planner did not produce a move: \(plan)")
        if approve { try store.transition(operationID: op.id, to: .approved) }
        return try XCTUnwrap(store.operation(id: op.id))
    }

    private func state(_ op: OperationRecord) throws -> OperationState? {
        try store.operation(id: op.id)?.state
    }

    // MARK: Happy path

    func testMoveAndUndoRoundTripKeepsContentIdentical() throws {
        let source = root + "/Downloads/reel.mp4"
        let original = try makeFile(source, "frame data")
        let op = try journaledMove(source)

        XCTAssertEqual(mover.execute(operationID: op.id), .completed(destination: reelFolder + "/reel.mp4"))
        XCTAssertFalse(fm.fileExists(atPath: source))
        XCTAssertEqual(fm.contents(atPath: reelFolder + "/reel.mp4"), original)
        XCTAssertEqual(try state(op), .completed)
        XCTAssertNotNil(try store.operation(id: op.id)?.movedSizeBytes)

        XCTAssertEqual(mover.undo(operationID: op.id), .undone(restoredTo: source))
        XCTAssertEqual(fm.contents(atPath: source), original)
        XCTAssertFalse(fm.fileExists(atPath: reelFolder + "/reel.mp4"))
        XCTAssertEqual(try state(op), .undone)

        let kinds = try store.auditEvents().map(\.kind)
        XCTAssertTrue(kinds.contains("operation.inProgress"))
        XCTAssertTrue(kinds.contains("operation.completed"))
        XCTAssertTrue(kinds.contains("operation.undone"))
    }

    func testUnicodeFilename() throws {
        let source = root + "/Downloads/Cafe\u{0301} Reel \u{00FC}.mp4"
        let original = try makeFile(source)
        let op = try journaledMove(source)
        guard case .completed(let dest) = mover.execute(operationID: op.id) else { return XCTFail("not moved") }
        XCTAssertEqual(fm.contents(atPath: dest), original)
        XCTAssertEqual(mover.undo(operationID: op.id), .undone(restoredTo: op.sourcePath))
        XCTAssertEqual(fm.contents(atPath: op.sourcePath), original)
    }

    // MARK: Refusals (nothing changes)

    func testUnapprovedMoveIsRefused() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source)
        let op = try journaledMove(source, approve: false)
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("executed without approval") }
        XCTAssertTrue(fm.fileExists(atPath: source))
        XCTAssertEqual(try state(op), .planned)
        XCTAssertEqual(try store.auditEvents().last?.kind, "operation.refused")
    }

    func testRunningTwiceDoesNothingTheSecondTime() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source)
        let op = try journaledMove(source)
        XCTAssertEqual(mover.execute(operationID: op.id), .completed(destination: reelFolder + "/reel.mp4"))
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("ran twice") }
        XCTAssertTrue(fm.fileExists(atPath: reelFolder + "/reel.mp4"))
    }

    func testFileOutsideApprovedFoldersIsRefused() throws {
        let source = outside + "/reel.mp4"
        try makeFile(source)
        let op = try journaledMove(source)
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("moved outside approved folders") }
        XCTAssertTrue(fm.fileExists(atPath: source))
        XCTAssertFalse(fm.fileExists(atPath: reelFolder))
    }

    func testSymlinkedFolderEscapingApprovedFoldersIsRefused() throws {
        try makeFile(outside + "/secret.mp4")
        try fm.createSymbolicLink(atPath: root + "/Downloads/Linked", withDestinationPath: outside)
        let op = try journaledMove(root + "/Downloads/Linked/secret.mp4")
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("followed a link outside") }
        XCTAssertTrue(fm.fileExists(atPath: outside + "/secret.mp4"))
    }

    func testSymbolicLinkFileIsNeverMoved() throws {
        try makeFile(root + "/Downloads/real.mp4")
        try fm.createSymbolicLink(atPath: root + "/Downloads/link.mp4", withDestinationPath: root + "/Downloads/real.mp4")
        let op = try journaledMove(root + "/Downloads/link.mp4")
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("moved a link") }
        XCTAssertNotNil(try? fm.destinationOfSymbolicLink(atPath: root + "/Downloads/link.mp4"))
    }

    func testFileInsidePackageIsNeverMoved() throws {
        let source = root + "/Downloads/Edit.fcpbundle/Media/clip.mov"
        try makeFile(source)
        let op = try journaledMove(source)
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("reached inside a package") }
        XCTAssertTrue(fm.fileExists(atPath: source))
    }

    func testNeverOverwritesExistingFile() throws {
        let source = root + "/Downloads/reel.mp4"
        let incoming = try makeFile(source, "new")
        let existing = try makeFile(reelFolder + "/reel.mp4", "already here")
        let op = try journaledMove(source)
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("overwrote a file") }
        XCTAssertEqual(fm.contents(atPath: reelFolder + "/reel.mp4"), existing)
        XCTAssertEqual(fm.contents(atPath: source), incoming)
    }

    func testMissingFileIsRefused() throws {
        let source = root + "/Downloads/gone.mp4"
        try makeFile(source)
        let op = try journaledMove(source)
        try fm.removeItem(atPath: source)   // test setup: simulate the user deleting it after planning
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("acted on a missing file") }
        XCTAssertFalse(fm.fileExists(atPath: reelFolder))
    }

    func testCrossDriveMoveIsRefusedForNow() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source)
        let op = try journaledMove(source, volume: "ssd")
        XCTAssertTrue(op.crossVolume)
        guard case .refused = mover.execute(operationID: op.id) else { return XCTFail("cross-drive move ran") }
        XCTAssertTrue(fm.fileExists(atPath: source))
    }

    // MARK: Failures

    func testPermissionErrorFailsSafely() throws {
        let source = root + "/Downloads/locked.mp4"
        let original = try makeFile(source)
        let op = try journaledMove(source)
        try fm.setAttributes([.posixPermissions: 0o555], ofItemAtPath: root + "/Downloads")
        guard case .failed = mover.execute(operationID: op.id) else {
            return XCTFail("expected a permission failure (tests must not run as root)")
        }
        XCTAssertEqual(fm.contents(atPath: source), original)
        XCTAssertEqual(try state(op), .failed)
        XCTAssertNotNil(try store.operation(id: op.id)?.errorMessage)
    }

    // MARK: Undo safety

    func testUndoRefusedIfFileWasEditedAfterOrganizing() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source, "v1")
        let op = try journaledMove(source)
        XCTAssertEqual(mover.execute(operationID: op.id), .completed(destination: reelFolder + "/reel.mp4"))
        let edited = Data("v1 plus edits".utf8)
        try edited.write(to: URL(fileURLWithPath: reelFolder + "/reel.mp4"))
        guard case .refused = mover.undo(operationID: op.id) else { return XCTFail("undid an edited file") }
        XCTAssertEqual(fm.contents(atPath: reelFolder + "/reel.mp4"), edited)
        XCTAssertEqual(try state(op), .completed)
    }

    func testUndoRefusedIfOriginalLocationIsTaken() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source, "organized")
        let op = try journaledMove(source)
        XCTAssertEqual(mover.execute(operationID: op.id), .completed(destination: reelFolder + "/reel.mp4"))
        let newcomer = try makeFile(source, "a different new file")
        guard case .refused = mover.undo(operationID: op.id) else { return XCTFail("undo overwrote a file") }
        XCTAssertEqual(fm.contents(atPath: source), newcomer)
        XCTAssertTrue(fm.fileExists(atPath: reelFolder + "/reel.mp4"))
    }

    // MARK: Interrupted runs

    func testRecoveryWhenInterruptedBeforeMove() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source)
        let op = try journaledMove(source)
        try store.transition(operationID: op.id, to: .inProgress)   // simulate a crash right here
        guard case .failed = mover.recoverInterrupted()[op.id] else { return XCTFail("not recovered") }
        XCTAssertEqual(try state(op), .failed)
        XCTAssertTrue(fm.fileExists(atPath: source))
    }

    func testRecoveryWhenInterruptedAfterMove() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source)
        let op = try journaledMove(source)
        try store.transition(operationID: op.id, to: .inProgress)
        // Simulate: the rename happened, then power was lost before the journal was updated.
        try fm.createDirectory(atPath: reelFolder, withIntermediateDirectories: true)
        try fm.moveItem(atPath: source, toPath: reelFolder + "/reel.mp4")
        XCTAssertEqual(mover.recoverInterrupted()[op.id], .completed(destination: reelFolder + "/reel.mp4"))
        XCTAssertEqual(try state(op), .completed)
        XCTAssertEqual(mover.undo(operationID: op.id), .undone(restoredTo: source))
    }

    func testRecoveryWithFilesAtBothLocationsAsksForReview() throws {
        let source = root + "/Downloads/reel.mp4"
        try makeFile(source, "a")
        let op = try journaledMove(source)
        try store.transition(operationID: op.id, to: .inProgress)
        try makeFile(reelFolder + "/reel.mp4", "b")
        guard case .failed(let reason) = mover.recoverInterrupted()[op.id] else { return XCTFail("not flagged") }
        XCTAssertTrue(reason.contains("review"))
        XCTAssertTrue(fm.fileExists(atPath: source))
        XCTAssertTrue(fm.fileExists(atPath: reelFolder + "/reel.mp4"))
    }
}
