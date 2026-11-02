import XCTest
@testable import CreativeOSCore

final class OperationStateTests: XCTestCase {
    func testHappyPathAndUndo() {
        XCTAssertTrue(OperationState.planned.canTransition(to: .approved))
        XCTAssertTrue(OperationState.approved.canTransition(to: .inProgress))
        XCTAssertTrue(OperationState.inProgress.canTransition(to: .completed))
        XCTAssertTrue(OperationState.completed.canTransition(to: .undone))
    }

    func testCannotSkipApproval() {
        XCTAssertFalse(OperationState.planned.canTransition(to: .inProgress))
        XCTAssertFalse(OperationState.planned.canTransition(to: .completed))
    }

    func testFailedRetryNeedsReapproval() {
        XCTAssertFalse(OperationState.failed.canTransition(to: .inProgress))
        XCTAssertTrue(OperationState.failed.canTransition(to: .approved))
    }

    func testFinalStates() {
        XCTAssertTrue(OperationState.cancelled.isFinal)
        XCTAssertTrue(OperationState.undone.isFinal)
        XCTAssertFalse(OperationState.completed.isFinal)
        XCTAssertFalse(OperationState.completed.canTransition(to: .inProgress))
    }
}
