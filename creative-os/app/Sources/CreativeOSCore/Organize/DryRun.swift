import Foundation

/// One file found by a scan: path and metadata only, never contents.
public struct ScannedFile: Equatable, Sendable {
    public let path: String
    public let root: String
    public let volumeID: String
    public let sizeBytes: Int64
    public let modifiedAt: Date
    /// False while the file may still be downloading, rendering or copying.
    public let isStable: Bool

    public init(path: String, root: String, volumeID: String, sizeBytes: Int64, modifiedAt: Date, isStable: Bool) {
        self.path = path
        self.root = root
        self.volumeID = volumeID
        self.sizeBytes = sizeBytes
        self.modifiedAt = modifiedAt
        self.isStable = isStable
    }
}

/// One row of the dry-run preview: what would happen, and why.
public struct DryRunItem: Sendable {
    public let file: ScannedFile
    public let kind: FileKind
    public let action: PlannedAction
    public let evidence: [String]
    public let missing: [String]
}

public struct DryRunReport: Sendable {
    public let items: [DryRunItem]

    public var moves: [DryRunItem] { items.filter { if case .move = $0.action.kind { return true }; return false } }
    public var reviewInbox: [DryRunItem] { items.filter { if case .leaveInPlace = $0.action.kind { return true }; return false } }
    public var skipped: [DryRunItem] { items.filter { if case .skip = $0.action.kind { return true }; return false } }
    public var plannedActions: [PlannedAction] { items.map(\.action) }

    public var summary: String {
        "\(moves.count) to organize, \(reviewInbox.count) left in place for review, \(skipped.count) skipped. Nothing has been changed."
    }
}

/// Turns a scan into a preview. Pure: reads nothing from disk and changes nothing.
public enum DryRun {
    public static func build(scan: [ScannedFile], knowledge: ClassifierKnowledge,
                             context: PlannerContext) -> DryRunReport {
        let projectFolders = foldersWithProjectFiles(scan)
        var facts: [FileFacts] = []
        var details: [(ScannedFile, ClassificationResult)] = []

        for file in scan {
            let result = Classifier.classify(path: file.path, root: file.root, knowledge: knowledge)
            let link = linkState(for: file, kind: result.kind, projectFolders: projectFolders)
            facts.append(FileFacts(path: file.path, volumeID: file.volumeID, sizeBytes: file.sizeBytes,
                                   isStable: file.isStable, linkState: link, classification: result.classification))
            details.append((file, result))
        }

        let actions = ActionPlanner.plan(facts, context: context)
        let items = zip(details, actions).map { pair, action in
            DryRunItem(file: pair.0, kind: pair.1.kind, action: action, evidence: pair.1.reasons, missing: pair.1.missing)
        }
        return DryRunReport(items: items)
    }

    /// Conservative link guess, because project files can't be read reliably yet:
    /// - project files themselves stay where they are;
    /// - media in a folder (or below a folder) that contains a project file is treated as possibly linked.
    /// Projects elsewhere that point at a file can't be detected yet; that is a known limitation.
    static func linkState(for file: ScannedFile, kind: FileKind, projectFolders: Set<String>) -> LinkState {
        if kind == .projectFile { return .unknown }
        guard kind.isLinkableMedia else { return .notLinked }
        var folder = PathSafety.parent(of: file.path)
        let root = PathSafety.normalizedAbsolute(file.root) ?? file.root
        while let current = folder, PathSafety.isContained(current, in: root) {
            if projectFolders.contains(current) { return .unknown }
            if current == root { break }
            folder = PathSafety.parent(of: current)
        }
        return .notLinked
    }

    static func foldersWithProjectFiles(_ scan: [ScannedFile]) -> Set<String> {
        Set(scan.compactMap { file in
            guard let name = PathSafety.lastComponent(of: file.path), FileKind.of(name) == .projectFile else { return nil }
            return PathSafety.parent(of: file.path)
        })
    }
}
