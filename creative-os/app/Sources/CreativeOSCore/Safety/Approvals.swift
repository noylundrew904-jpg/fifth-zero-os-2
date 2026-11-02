import Foundation

// MARK: - Final approved exports

/// Approval is a user decision. Nothing in the app sets `.confirmedFinal` except `confirmFinal`.
public enum ApprovalState: Equatable, Sendable {
    case notApproved
    case confirmedFinal(at: Date)

    public var isConfirmed: Bool {
        if case .confirmedFinal = self { return true }
        return false
    }
}

public struct ExportRecord: Equatable, Sendable {
    public let filename: String
    public private(set) var approval: ApprovalState = .notApproved

    public init(filename: String) { self.filename = filename }

    /// The only way an export becomes a confirmed Final: the user says so.
    public mutating func confirmFinal(at date: Date) { approval = .confirmedFinal(at: date) }
    public mutating func revokeFinal() { approval = .notApproved }
}

public struct FinalSuggestion: Equatable, Sendable {
    public let isSuggested: Bool
    /// Plain-language signals. Shown to the user; never treated as proof.
    public let reasons: [String]
}

public enum FinalApproval {
    /// Suggests (never confirms) that an export might be the approved final.
    public static func suggest(filename: String, isHighestVersion: Bool, sentToClient: Bool) -> FinalSuggestion {
        var reasons: [String] = []
        let lower = filename.lowercased()
        for word in ["final", "approved", "master"] where lower.contains(word) {
            reasons.append("Filename says “\(word)” (a hint, not proof)")
        }
        if isHighestVersion { reasons.append("Latest version in its format") }
        if sentToClient { reasons.append("Found in a delivery/sent folder") }
        return FinalSuggestion(isSuggested: !reasons.isEmpty, reasons: reasons)
    }

    /// Which version-stage folder an export belongs in. Finals only after confirmation.
    public static func stage(version: Int?, approval: ApprovalState) -> VersionStage {
        if approval.isConfirmed { return .finals }
        if let v = version, v > 1 { return .revisions }
        return .drafts
    }
}

// MARK: - Campaign status

public enum CampaignStatus: String, CaseIterable, Sendable {
    case active
    case inReview
    case onHold
    case completed

    public var title: String {
        switch self {
        case .active: return "Active"
        case .inReview: return "In review"
        case .onHold: return "On hold"
        case .completed: return "Completed"
        }
    }
}

/// Status the user confirmed, plus an optional suggestion the app offers.
public struct StatusState: Equatable, Sendable {
    public private(set) var confirmed: CampaignStatus
    public private(set) var suggested: CampaignStatus?

    public init(confirmed: CampaignStatus = .active) {
        self.confirmed = confirmed
        self.suggested = nil
    }

    public mutating func suggest(_ status: CampaignStatus?) {
        suggested = (status == confirmed) ? nil : status
    }

    /// User action only.
    public mutating func confirm(_ status: CampaignStatus) {
        confirmed = status
        suggested = nil
    }

    /// Collect & Package starts only after the user explicitly confirms Completed.
    public var canStartCollectAndPackage: Bool { confirmed == .completed }
}

public enum StatusSuggester {
    public static func suggest(lastActivity: Date, now: Date, hasConfirmedFinal: Bool,
                               inactivityDays: Int = 30) -> CampaignStatus? {
        let days = now.timeIntervalSince(lastActivity) / 86_400
        if hasConfirmedFinal && days >= 14 { return .completed }
        if hasConfirmedFinal { return .inReview }
        if days >= Double(inactivityDays) { return .onHold }
        return nil
    }
}
