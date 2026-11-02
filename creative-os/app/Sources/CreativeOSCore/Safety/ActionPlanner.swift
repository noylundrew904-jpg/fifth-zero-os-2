import Foundation

/// What the scanner knows about one file. (In A1 these are built by tests and mocks only.)
public struct FileFacts: Sendable {
    public let path: String
    public let volumeID: String
    public let sizeBytes: Int64
    /// False while size or modification time is still changing (download, render, copy).
    public let isStable: Bool
    public let linkState: LinkState
    public let classification: Classification?

    public init(path: String, volumeID: String, sizeBytes: Int64, isStable: Bool = true,
                linkState: LinkState = .notLinked, classification: Classification?) {
        self.path = path
        self.volumeID = volumeID
        self.sizeBytes = sizeBytes
        self.isStable = isStable
        self.linkState = linkState
        self.classification = classification
    }
}

public struct Classification: Sendable {
    public let location: OrganizedLocation
    public let confidence: Double
    /// The rule that produced this match, if any.
    public let ruleID: String?
    public let finalConfirmed: Bool

    public init(location: OrganizedLocation, confidence: Double, ruleID: String? = nil,
                finalConfirmed: Bool = false) {
        self.location = location
        self.confidence = confidence
        self.ruleID = ruleID
        self.finalConfirmed = finalConfirmed
    }
}

public struct PlannerContext: Sendable {
    /// Absolute path of `Creative_Master/01_CLIENTS`.
    public let clientsRoot: String
    public let clientsRootVolumeID: String
    public let onlineVolumeIDs: Set<String>
    /// Rules the user has approved for auto-execution (low-risk only).
    public let approvedRuleIDs: Set<String>
    public let confidenceThreshold: Double
    /// Names already present in each destination folder, keyed by absolute folder path.
    public let existingNames: [String: Set<String>]

    public init(clientsRoot: String, clientsRootVolumeID: String, onlineVolumeIDs: Set<String>,
                approvedRuleIDs: Set<String> = [], confidenceThreshold: Double = 0.8,
                existingNames: [String: Set<String>] = [:]) {
        self.clientsRoot = clientsRoot
        self.clientsRootVolumeID = clientsRootVolumeID
        self.onlineVolumeIDs = onlineVolumeIDs
        self.approvedRuleIDs = approvedRuleIDs
        self.confidenceThreshold = confidenceThreshold
        self.existingNames = existingNames
    }
}

public enum SkipReason: Equatable, Sendable {
    case stillChanging
    case sourceVolumeOffline
    case destinationOffline
    case alreadyOrganized
}

/// Why a file stays at its original path and appears in the virtual Review Inbox.
public enum ReviewReason: Equatable, Sendable {
    case invalidSourcePath
    case linkedToProject
    case linkUnknown
    case unclassified
    case lowConfidence(Double)
    case invalidDestination(String)
    case protectedNameWouldCollide
}

/// There is deliberately no delete case. A plan cannot express deletion.
public enum PlannedActionKind: Equatable, Sendable {
    case move(destinationPath: String, crossVolume: Bool)
    case leaveInPlace(ReviewReason)
    case skip(SkipReason)
}

public struct PlannedAction: Equatable, Sendable {
    public let sourcePath: String
    public let kind: PlannedActionKind
    public let risk: Risk
    public let requiresApproval: Bool
    public let explanation: String
}

/// Builds a dry-run plan. Pure: reads nothing from disk and changes nothing.
public enum ActionPlanner {
    public static func plan(_ files: [FileFacts], context: PlannerContext) -> [PlannedAction] {
        var taken: [String: Set<String>] = [:]
        for (folder, names) in context.existingNames {
            if let key = PathSafety.normalizedAbsolute(folder) { taken[key, default: []].formUnion(names) }
        }
        var actions: [PlannedAction] = []
        for file in files {
            actions.append(planOne(file, context: context, taken: &taken))
        }
        return actions
    }

    private static func planOne(_ f: FileFacts, context: PlannerContext,
                                taken: inout [String: Set<String>]) -> PlannedAction {
        func leave(_ r: ReviewReason, _ why: String) -> PlannedAction {
            PlannedAction(sourcePath: f.path, kind: .leaveInPlace(r), risk: .noChange,
                          requiresApproval: false, explanation: why + " Stays at its original path.")
        }
        func skip(_ r: SkipReason, _ why: String) -> PlannedAction {
            PlannedAction(sourcePath: f.path, kind: .skip(r), risk: .noChange,
                          requiresApproval: false, explanation: why)
        }

        guard let source = PathSafety.normalizedAbsolute(f.path),
              let name = PathSafety.lastComponent(of: source),
              let sourceFolder = PathSafety.parent(of: source) else {
            return leave(.invalidSourcePath, "The path could not be read safely.")
        }
        guard f.isStable else {
            return skip(.stillChanging, "Still changing (download, render or copy in progress). Try again later.")
        }
        guard context.onlineVolumeIDs.contains(f.volumeID) else {
            return skip(.sourceVolumeOffline, "Its drive is not connected.")
        }
        switch f.linkState {
        case .linked: return leave(.linkedToProject, "A project file links to it, so it is never moved.")
        case .unknown: return leave(.linkUnknown, "Can't confirm whether a project links to it.")
        case .notLinked: break
        }
        guard let c = f.classification else {
            return leave(.unclassified, "No client or campaign could be identified.")
        }
        guard c.confidence >= context.confidenceThreshold else {
            return leave(.lowConfidence(c.confidence),
                         "Match confidence \(Format.percent(c.confidence)) is below your threshold.")
        }

        let components: [String]
        switch c.location.folderComponents(finalConfirmed: c.finalConfirmed) {
        case .failure(let problem):
            return leave(.invalidDestination(problem.explanation), problem.explanation)
        case .success(let comps):
            components = comps
        }
        // Offline destination: skip. Never fall back to another location.
        guard context.onlineVolumeIDs.contains(context.clientsRootVolumeID) else {
            return skip(.destinationOffline, "The Creative_Master drive is not connected.")
        }
        guard let folder = PathSafety.join(context.clientsRoot, components) else {
            return leave(.invalidDestination("Unsafe destination"), "The destination path is not safe.")
        }
        if folder == sourceFolder {
            return skip(.alreadyOrganized, "Already in the right folder.")
        }

        let finalName = Naming.uniqueName(name, taken: taken[folder] ?? [])
        let renamed = finalName != name
        if renamed && Naming.isCameraOriginal(name) {
            return leave(.protectedNameWouldCollide,
                         "A file with the same camera-original name already exists there, and camera names are never changed.")
        }
        taken[folder, default: []].insert(finalName)

        let crossVolume = f.volumeID != context.clientsRootVolumeID
        let ruleApproved = c.ruleID.map { context.approvedRuleIDs.contains($0) } ?? false
        let risk: Risk = crossVolume ? .high : (renamed ? .medium : .low)
        let needsApproval = crossVolume || renamed || !ruleApproved

        var why = ruleApproved ? "Matches an approved rule." : "Suggested match (\(Format.percent(c.confidence)))."
        if renamed { why += " Name already taken there, so it becomes “\(finalName)”." }
        if crossVolume { why += " Different drive: copy, verify checksum, then remove the original, only with your approval." }

        return PlannedAction(sourcePath: source,
                             kind: .move(destinationPath: folder + "/" + finalName, crossVolume: crossVolume),
                             risk: risk, requiresApproval: needsApproval, explanation: why)
    }
}
