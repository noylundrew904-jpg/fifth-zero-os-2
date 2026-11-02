import XCTest
@testable import CreativeOSCore

final class MockDataTests: XCTestCase {
    private let snapshot = MockData.make()

    func testSnapshotIsLabelledMock() {
        XCTAssertEqual(snapshot.source, .mock)
    }

    func testEveryMockPathIsUnderMockRoot() {
        let root = MockData.root + "/"
        var paths: [String] = []
        paths += snapshot.reviewItems.map(\.path)
        paths += snapshot.quarantine.flatMap { [$0.originalPath, $0.keptCopyPath] }
        paths += snapshot.plannedOperations.map(\.source)
        paths += snapshot.plannedOperations.compactMap(\.destination).filter { $0.hasPrefix("/") }
        paths += snapshot.searchIndex.map(\.path)
        XCTAssertFalse(paths.isEmpty)
        for path in paths {
            XCTAssertTrue(path.hasPrefix(root), "Mock path escapes mock root: \(path)")
        }
    }

    func testLinkedMediaIsNeverPlannedForMoveOrRename() {
        for op in snapshot.plannedOperations where op.isLinkedToProject {
            XCTAssertEqual(op.kind, .leaveInPlace, "Linked file planned for \(op.kind): \(op.source)")
        }
    }

    func testQuarantineAndArchiveAlwaysNeedApproval() {
        for op in snapshot.plannedOperations where op.kind.alwaysNeedsApproval {
            XCTAssertTrue(op.needsApproval, "\(op.kind) without approval: \(op.source)")
        }
    }

    func testEveryOperationExplainsItself() {
        for op in snapshot.plannedOperations {
            XCTAssertFalse(op.reason.isEmpty)
            XCTAssertTrue((0...1).contains(op.confidence))
        }
    }

    func testVolumeNumbersAreConsistent() {
        for v in snapshot.volumes {
            XCTAssertLessThanOrEqual(v.freeBytes, v.totalBytes)
            XCTAssertTrue((0...1).contains(v.usedFraction))
        }
    }

    func testArchiveToOfflineDriveIsBlocked() {
        let offline = Set(snapshot.volumes.filter { !$0.isOnline }.map(\.name))
        for s in snapshot.archiveSuggestions {
            let drive = String(s.destination.split(separator: "/").first ?? "")
            if offline.contains(drive) {
                XCTAssertFalse(s.isReady, "Archive to offline drive offered: \(s.project)")
            }
        }
    }
}

final class LocalSearchTests: XCTestCase {
    private let index = MockData.make().searchIndex

    func testEmptyQueryReturnsNothing() {
        XCTAssertTrue(LocalSearch.search("   ", in: index).isEmpty)
    }

    func testAllTermsMustMatch() {
        let hits = LocalSearch.search("acme psd", in: index)
        XCTAssertEqual(hits.count, 1)
        XCTAssertEqual(hits.first?.record.fileType, "psd")
        XCTAssertEqual(hits.first?.reasons.count, 2)
    }

    func testTagSearchExplainsMatch() {
        let hits = LocalSearch.search("reusable", in: index)
        XCTAssertEqual(hits.count, 2)
        XCTAssertTrue(hits.allSatisfy { $0.reasons.first?.hasPrefix("Tagged") == true })
    }

    func testNoMatch() {
        XCTAssertTrue(LocalSearch.search("acme zebra", in: index).isEmpty)
    }
}
