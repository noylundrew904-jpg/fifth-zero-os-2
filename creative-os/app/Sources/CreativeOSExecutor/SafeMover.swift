import Foundation
import CreativeOSCore
import CreativeOSStore

public enum ExecutionResult: Equatable, Sendable {
    case completed(destination: String)
    case undone(restoredTo: String)
    /// Checked before touching anything. Nothing changed.
    case refused(String)
    /// Tried and did not happen. The journal marks it failed. The file was not moved.
    case failed(String)
}

/// Executes approved, journaled moves on one drive, and undoes them.
///
/// Safety rules:
/// - Only paths inside `allowedRoots` (the folders the user approved) are ever touched,
///   checked after resolving symbolic links.
/// - Only regular files move. Folders, links and app/project packages never move.
/// - Same drive only (an instant rename). Moves between drives are refused for now.
/// - Nothing is overwritten and nothing is deleted. There is no delete code in this type.
/// - Every step is journaled before and after, so an interruption can be recovered.
public final class SafeMover {
    private let store: CreativeStore
    private let allowedRoots: [String]
    private let fm = FileManager.default

    public init(store: CreativeStore, allowedRoots: [String]) {
        self.store = store
        self.allowedRoots = allowedRoots.compactMap { SafeMover.resolved($0) }
    }

    // MARK: Execute

    public func execute(operationID: String, at now: Date = Date()) -> ExecutionResult {
        do {
            guard let op = try store.operation(id: operationID) else { return .refused("Unknown operation.") }
            guard op.kind == "move", let destination = op.destinationPath else {
                return try refuse(op, "Only moves are supported.", at: now)
            }
            guard op.state == .approved else {
                return try refuse(op, "Not approved (currently \(op.state.rawValue)).", at: now)
            }
            guard !op.crossVolume else {
                return try refuse(op, "Moves between drives are not enabled yet.", at: now)
            }
            if let problem = preflight(source: op.sourcePath, destination: destination) {
                return try refuse(op, problem, at: now)
            }

            try store.transition(operationID: op.id, to: .inProgress, at: now)
            do {
                try fm.createDirectory(atPath: Self.parent(destination), withIntermediateDirectories: true)
                // Same drive: this is a rename. It fails (rather than overwrites) if the destination exists.
                try fm.moveItem(atPath: op.sourcePath, toPath: destination)
            } catch {
                let reason = "Move failed: \(error.localizedDescription) The file was not moved."
                try store.transition(operationID: op.id, to: .failed, error: reason, at: now)
                return .failed(reason)
            }
            let fingerprint = self.fingerprint(destination)
            // The file has moved. If the journal can't be updated now, the entry stays "in progress"
            // and recoverInterrupted() records the truth on the next run.
            _ = try? store.complete(operationID: op.id, movedSize: fingerprint?.size,
                                    movedModifiedAt: fingerprint?.modified, at: now)
            return .completed(destination: destination)
        } catch {
            return .refused("Journal error, nothing was changed: \(error)")
        }
    }

    // MARK: Undo

    public func undo(operationID: String, at now: Date = Date()) -> ExecutionResult {
        do {
            guard let op = try store.operation(id: operationID) else { return .refused("Unknown operation.") }
            guard op.state == .completed, let destination = op.destinationPath else {
                return try refuse(op, "Only completed moves can be undone (currently \(op.state.rawValue)).", at: now)
            }
            guard let current = fingerprint(destination) else {
                return try refuse(op, "The organized file is no longer where it was put.", at: now)
            }
            if let size = op.movedSizeBytes, size != current.size {
                return try refuse(op, "The file changed after it was organized, so undo won't move it.", at: now)
            }
            if let modified = op.movedModifiedAt, abs(modified.timeIntervalSince(current.modified)) > 0.01 {
                return try refuse(op, "The file changed after it was organized, so undo won't move it.", at: now)
            }
            if let problem = preflight(source: destination, destination: op.sourcePath) {
                return try refuse(op, "Can't undo: \(problem)", at: now)
            }
            do {
                try fm.createDirectory(atPath: Self.parent(op.sourcePath), withIntermediateDirectories: true)
                try fm.moveItem(atPath: destination, toPath: op.sourcePath)
            } catch {
                return try refuse(op, "Undo failed: \(error.localizedDescription) The file was not moved.", at: now)
            }
            // The file is back. Record it; a journal failure here must not hide that fact.
            _ = try? store.transition(operationID: op.id, to: .undone, at: now)
            return .undone(restoredTo: op.sourcePath)
        } catch {
            return .refused("Journal error during undo: \(error)")
        }
    }

    // MARK: Recovery after an interruption (crash, power loss, drive unplugged)

    /// Looks at moves left "in progress" and records what actually happened on disk.
    /// It never moves anything; it only updates the journal.
    public func recoverInterrupted(at now: Date = Date()) -> [String: ExecutionResult] {
        var results: [String: ExecutionResult] = [:]
        guard let unfinished = try? store.unfinishedOperations() else { return results }
        for op in unfinished {
            guard let destination = op.destinationPath else { continue }
            let atSource = exists(op.sourcePath)
            let atDestination = exists(destination)
            do {
                if atDestination && !atSource {
                    let fp = fingerprint(destination)
                    try store.complete(operationID: op.id, movedSize: fp?.size, movedModifiedAt: fp?.modified, at: now)
                    results[op.id] = .completed(destination: destination)
                } else if atSource && !atDestination {
                    let reason = "Interrupted before the move. The file was not moved."
                    try store.transition(operationID: op.id, to: .failed, error: reason, at: now)
                    results[op.id] = .failed(reason)
                } else {
                    let reason = atSource
                        ? "Interrupted. Files exist at both locations. Please review; nothing was removed."
                        : "Interrupted. The file is at neither location. Please review."
                    try store.transition(operationID: op.id, to: .failed, error: reason, at: now)
                    results[op.id] = .failed(reason)
                }
            } catch {
                results[op.id] = .refused("Journal error during recovery: \(error)")
            }
        }
        return results
    }

    // MARK: Checks

    /// Returns a plain-language reason the move is unsafe, or nil if it may proceed.
    func preflight(source: String, destination: String) -> String? {
        guard PathSafety.normalizedAbsolute(source) != nil,
              PathSafety.normalizedAbsolute(destination) != nil else { return "The path is not valid." }
        guard isAllowed(source) else { return "The file is outside the folders you approved." }
        guard isAllowed(destination) else { return "The destination is outside the folders you approved." }
        guard let attributes = try? fm.attributesOfItem(atPath: source) else {
            return "The file is no longer there."
        }
        guard attributes[.type] as? FileAttributeType == .typeRegular else {
            return "Only regular files are moved (never folders, links or packages)."
        }
        if Self.isInsidePackage(source) { return "The file is inside an app or project package." }
        if exists(destination) { return "Something already exists at the destination. Nothing is overwritten." }
        guard sameVolume(Self.parent(source), Self.deepestExistingAncestor(of: destination)) else {
            return "The destination is on a different drive."
        }
        return nil
    }

    private func isAllowed(_ path: String) -> Bool {
        guard let normalized = PathSafety.normalizedAbsolute(path) else { return false }
        let existing = Self.deepestExistingAncestor(of: normalized)
        guard let real = Self.resolved(existing) else { return false }
        // Re-attach the part of the path that doesn't exist yet, then check containment.
        var rest = normalized.count > existing.count ? String(normalized.dropFirst(existing.count)) : ""
        if !rest.isEmpty && !rest.hasPrefix("/") { rest = "/" + rest }
        let full = (real == "/" ? "" : real) + rest
        return allowedRoots.contains { PathSafety.isContained(full, in: $0) }
    }

    /// True if anything (including a broken link) is at `path`.
    private func exists(_ path: String) -> Bool {
        (try? fm.attributesOfItem(atPath: path)) != nil
    }

    private func fingerprint(_ path: String) -> (size: Int64, modified: Date)? {
        guard let a = try? fm.attributesOfItem(atPath: path),
              let size = (a[.size] as? NSNumber)?.int64Value,
              let modified = a[.modificationDate] as? Date else { return nil }
        return (size, modified)
    }

    private func sameVolume(_ a: String, _ b: String) -> Bool {
        let key: Set<URLResourceKey> = [.volumeIdentifierKey]
        guard let va = try? URL(fileURLWithPath: a).resourceValues(forKeys: key).volumeIdentifier,
              let vb = try? URL(fileURLWithPath: b).resourceValues(forKeys: key).volumeIdentifier else { return false }
        return va.isEqual(vb)
    }

    private static func resolved(_ path: String) -> String? {
        guard PathSafety.normalizedAbsolute(path) != nil else { return nil }
        return PathSafety.normalizedAbsolute(URL(fileURLWithPath: path).resolvingSymlinksInPath().path)
    }

    static func parent(_ path: String) -> String {
        PathSafety.parent(of: path) ?? "/"
    }

    static func deepestExistingAncestor(of path: String) -> String {
        var current = PathSafety.normalizedAbsolute(path) ?? "/"
        while current != "/" && (try? FileManager.default.attributesOfItem(atPath: current)) == nil {
            current = parent(current)
        }
        return current
    }

    /// macOS treats folders like `Project.fcpbundle` or `App.app` as single documents. Never reach inside.
    static func isInsidePackage(_ path: String) -> Bool {
        let packageExtensions: Set<String> = ["app", "bundle", "fcpbundle", "photoslibrary", "imovielibrary",
                                              "logicx", "band", "framework", "plugin", "rtfd"]
        let parents = path.split(separator: "/").dropLast()
        return parents.contains { component in
            guard let dot = component.lastIndex(of: ".") else { return false }
            return packageExtensions.contains(component[component.index(after: dot)...].lowercased())
        }
    }

    private func refuse(_ op: OperationRecord, _ reason: String, at now: Date) throws -> ExecutionResult {
        try store.note("operation.refused", "Refused \(op.kind) of \(op.sourcePath): \(reason)", operationID: op.id, at: now)
        return .refused(reason)
    }
}
