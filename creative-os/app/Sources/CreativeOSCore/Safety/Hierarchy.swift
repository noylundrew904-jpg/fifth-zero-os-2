import Foundation

// Locked organization model: Client → Campaign → Deliverable → File Type / Purpose.
// Example: 01_CLIENTS/AMINTIRI/Coffee_Campaign/Reel_01/Exports/Instagram_Reels/Revisions/

/// Top-level folders inside the user-chosen `Creative_Master` root.
public enum RootFolder: String, CaseIterable, Sendable {
    case clients = "01_CLIENTS"
    case sharedLibrary = "02_SHARED_ASSETS"
    /// Virtual: the Review Inbox is an index. Files are never moved here.
    case reviewInbox = "03_REVIEW_INBOX"
    case quarantine = "04_QUARANTINE"
    case system = "05_SYSTEM"
    case packages = "06_PACKAGES"
}

public enum FilePurpose: String, CaseIterable, Sendable {
    case sourceFootage
    case briefReferences
    case projectFiles
    case audio
    case graphics
    case aiAssets
    case exports
    case documents

    public var folderName: String {
        switch self {
        case .sourceFootage: return "Source_Footage"
        case .briefReferences: return "Brief_References"
        case .projectFiles: return "Project_Files"
        case .audio: return "Audio"
        case .graphics: return "Graphics"
        case .aiAssets: return "AI_Assets"
        case .exports: return "Exports"
        case .documents: return "Documents"
        }
    }

    /// Campaign-level folders are shared by every deliverable, so originals exist once.
    public var isCampaignLevel: Bool {
        self == .sourceFootage || self == .briefReferences
    }
}

/// Exports are grouped by format/purpose first.
public enum ExportFormat: String, CaseIterable, Sendable {
    case masters
    case instagramReels
    case stories
    case whatsApp
    case otherFormats

    public var folderName: String {
        switch self {
        case .masters: return "Masters"
        case .instagramReels: return "Instagram_Reels"
        case .stories: return "Stories"
        case .whatsApp: return "WhatsApp"
        case .otherFormats: return "Other_Formats"
        }
    }
}

/// Versions are kept inside each export category, grouped by stage.
public enum VersionStage: String, CaseIterable, Sendable {
    case drafts
    case revisions
    case finals

    public var folderName: String {
        switch self {
        case .drafts: return "Drafts"
        case .revisions: return "Revisions"
        case .finals: return "Finals"
        }
    }
}

public struct OrganizedLocation: Hashable, Sendable {
    public let client: String
    public let campaign: String
    public let deliverable: String?
    public let purpose: FilePurpose
    public let exportFormat: ExportFormat?
    public let stage: VersionStage?

    public init(client: String, campaign: String, deliverable: String?, purpose: FilePurpose,
                exportFormat: ExportFormat? = nil, stage: VersionStage? = nil) {
        self.client = client
        self.campaign = campaign
        self.deliverable = deliverable
        self.purpose = purpose
        self.exportFormat = exportFormat
        self.stage = stage
    }

    public enum Problem: Error, Equatable, Sendable {
        case invalidName(String)
        case deliverableRequired
        case deliverableNotAllowed
        case exportDetailsRequired
        case exportDetailsNotAllowed
        /// The Finals folder is only used after the user explicitly confirms approval.
        case finalsRequireConfirmation

        public var explanation: String {
            switch self {
            case .invalidName(let name): return "“\(name)” can't be used as a folder name."
            case .deliverableRequired: return "This file type belongs to a specific deliverable."
            case .deliverableNotAllowed: return "Source footage and briefs are shared by the whole campaign."
            case .exportDetailsRequired: return "Exports need a format and a version stage."
            case .exportDetailsNotAllowed: return "Only exports have a format and version stage."
            case .finalsRequireConfirmation: return "Finals need your explicit approval first."
            }
        }
    }

    /// Folder components relative to `01_CLIENTS`, or the reason the location is invalid.
    public func folderComponents(finalConfirmed: Bool = false) -> Result<[String], Problem> {
        guard let c = PathSafety.sanitizeComponent(client) else { return .failure(.invalidName(client)) }
        guard let k = PathSafety.sanitizeComponent(campaign) else { return .failure(.invalidName(campaign)) }

        if purpose.isCampaignLevel {
            guard deliverable == nil else { return .failure(.deliverableNotAllowed) }
            guard exportFormat == nil, stage == nil else { return .failure(.exportDetailsNotAllowed) }
            return .success([c, k, purpose.folderName])
        }

        guard let rawDeliverable = deliverable else { return .failure(.deliverableRequired) }
        guard let d = PathSafety.sanitizeComponent(rawDeliverable) else {
            return .failure(.invalidName(rawDeliverable))
        }

        if purpose == .exports {
            guard let format = exportFormat, let stage else { return .failure(.exportDetailsRequired) }
            if stage == .finals && !finalConfirmed { return .failure(.finalsRequireConfirmation) }
            return .success([c, k, d, purpose.folderName, format.folderName, stage.folderName])
        }

        guard exportFormat == nil, stage == nil else { return .failure(.exportDetailsNotAllowed) }
        return .success([c, k, d, purpose.folderName])
    }
}
