import AppKit
import SwiftUI
import CreativeOSCore
import CreativeOSScanner
import CreativeOSSystem

/// Thread-safe flag/counter shared with the background scan.
final class ScanControl: @unchecked Sendable {
    private let lock = NSLock()
    private var cancelled = false
    private var found = 0
    private var done = false

    var isCancelled: Bool { lock.lock(); defer { lock.unlock() }; return cancelled }
    var foundCount: Int { lock.lock(); defer { lock.unlock() }; return found }
    var isDone: Bool { lock.lock(); defer { lock.unlock() }; return done }

    func cancel() { lock.lock(); cancelled = true; lock.unlock() }
    func report(_ count: Int) { lock.lock(); found = count; lock.unlock() }
    func finish() { lock.lock(); done = true; lock.unlock() }
}

struct PreviewOutcome: Sendable {
    let report: DryRunReport
    let scannedFolder: String
    let masterFolder: String
    let skipped: [ScanSkip]
    let hiddenCount: Int
    let hitLimit: Bool
    let wasCancelled: Bool
    let finishedAt: Date
}

/// Drives the read-only Organize Now preview. It never moves, renames, deletes or writes anything.
@MainActor
final class OrganizePreviewModel: ObservableObject {
    enum Phase: Sendable {
        case setup
        case scanning(found: Int)
        case done(PreviewOutcome)
        case failed(String)
    }

    @Published var sourceFolder: String?
    @Published var masterFolder: String?
    @Published var knowledgeText: String = KnowledgeText.example
    @Published private(set) var phase: Phase = .setup
    private var control: ScanControl?

    var parsed: KnowledgeText.Parsed { KnowledgeText.parse(knowledgeText) }

    var isScanning: Bool {
        if case .scanning = phase { return true }
        return false
    }

    /// The one thing still needed before a preview can run, in plain words. Nil when ready.
    var blockingProblem: String? {
        guard let source = sourceFolder else { return "Step 1: choose a folder to look through." }
        guard let master = masterFolder else { return "Step 2: choose where Creative_Master is (or will be)." }
        let home = NSHomeDirectory()
        if let p = ScopeRules.problem(with: source, home: home) { return "Step 1: \(p)" }
        if let p = ScopeRules.problem(with: master, home: home) { return "Step 2: \(p)" }
        if let p = ScopeRules.overlapProblem(source: source, master: master) { return p }
        if parsed.clientCount == 0 { return "Step 3: add at least one client with a campaign." }
        return nil
    }

    func chooseSource() {
        if let path = Self.pickFolder(message: "Choose a folder for Creative OS to look through. It only reads file names, sizes and dates.") {
            sourceFolder = path
            phase = .setup
        }
    }

    func chooseMaster() {
        if let path = Self.pickFolder(message: "Choose your Creative_Master folder. Nothing is created or changed now.") {
            masterFolder = path
            phase = .setup
        }
    }

    func runPreview() {
        guard blockingProblem == nil, let source = sourceFolder, let master = masterFolder else { return }
        let knowledge = parsed.knowledge
        let control = ScanControl()
        self.control = control
        phase = .scanning(found: 0)

        Task {
            let work = Task.detached(priority: .userInitiated) {
                Self.buildPreview(source: source, master: master, knowledge: knowledge, control: control)
            }
            while !control.isDone {
                try? await Task.sleep(nanoseconds: 250_000_000)
                if case .scanning = self.phase { self.phase = .scanning(found: control.foundCount) }
            }
            self.phase = await work.value
        }
    }

    func cancel() { control?.cancel() }

    func startOver() { phase = .setup }

    /// Runs off the main thread. Read-only: scan (names, sizes, dates) → suggestions → plan.
    nonisolated static func buildPreview(source: String, master: String, knowledge: ClassifierKnowledge,
                                         control: ScanControl) -> Phase {
        defer { control.finish() }
        let scan = FolderScanner.scan(roots: [source], shouldCancel: { control.isCancelled },
                                      progress: { control.report($0) })
        let normalizedSource = PathSafety.normalizedAbsolute(source) ?? source
        if let rootProblem = scan.skipped.first(where: { $0.path == normalizedSource || $0.path == source }) {
            return .failed(rootProblem.reason)
        }
        guard let masterVolume = MountedVolumeReader.volumeID(forPath: master) else {
            return .failed("Couldn't identify the drive that holds Creative_Master. Is it connected?")
        }
        let online = Set(scan.files.map(\.volumeID)).union([masterVolume])
        let context = PlannerContext(clientsRoot: master + "/" + RootFolder.clients.rawValue,
                                     clientsRootVolumeID: masterVolume, onlineVolumeIDs: online)
        let report = DryRun.build(scan: scan.files, knowledge: knowledge, context: context)
        return .done(PreviewOutcome(report: report, scannedFolder: source, masterFolder: master,
                                    skipped: scan.skipped, hiddenCount: scan.hiddenCount,
                                    hitLimit: scan.hitLimit, wasCancelled: scan.wasCancelled,
                                    finishedAt: Date()))
    }

    /// The standard macOS folder picker. Choosing a folder here is the user's permission to read it.
    private static func pickFolder(message: String) -> String? {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.canCreateDirectories = false
        panel.prompt = "Choose"
        panel.message = message
        return panel.runModal() == .OK ? panel.url?.path : nil
    }
}
