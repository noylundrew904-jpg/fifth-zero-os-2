import Foundation

/// Life cycle of one journaled file operation.
///
///     planned ──► approved ──► inProgress ──► completed ──► undone
///        │           │                 └────► failed ──► approved (retry, needs re-approval)
///        └───────────┴──► cancelled
///
/// Every transition is written to the append-only audit log in the same transaction.
public enum OperationState: String, CaseIterable, Codable, Sendable {
    case planned
    case approved
    case inProgress
    case completed
    case failed
    case cancelled
    case undone

    public func canTransition(to next: OperationState) -> Bool {
        switch (self, next) {
        case (.planned, .approved), (.planned, .cancelled):
            return true
        case (.approved, .inProgress), (.approved, .cancelled):
            return true
        case (.inProgress, .completed), (.inProgress, .failed):
            return true
        case (.failed, .approved), (.failed, .cancelled):
            return true
        case (.completed, .undone):
            return true
        default:
            return false
        }
    }

    /// No further transitions are possible.
    public var isFinal: Bool {
        OperationState.allCases.allSatisfy { !canTransition(to: $0) }
    }
}
