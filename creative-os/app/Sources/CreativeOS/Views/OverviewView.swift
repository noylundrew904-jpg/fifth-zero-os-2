import SwiftUI
import CreativeOSCore

struct OverviewView: View {
    let snapshot: DashboardSnapshot
    @Binding var selection: SidebarItem?
    @State private var showOrganize = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                PageHeader(
                    title: "Overview",
                    subtitle: "One click: scan → dry-run plan → approve → execute → verify → report."
                )

                HStack(alignment: .center, spacing: 16) {
                    Button {
                        showOrganize = true
                    } label: {
                        Label("Organize Now", systemImage: "sparkles")
                            .font(.title3.weight(.semibold))
                            .padding(.horizontal, 20)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .keyboardShortcut("o", modifiers: [.command, .shift])

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Simulation only in this build.").fontWeight(.medium)
                        Text("Shows a fictional dry-run plan. Nothing is scanned or changed.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 190), spacing: 14)], spacing: 14) {
                    stat("Active projects", "\(snapshot.activeProjects.count)", "folder", .projects)
                    stat("Review inbox", "\(snapshot.reviewItems.count)", "tray", .review)
                    stat("In quarantine", "\(snapshot.quarantine.count)", "doc.on.doc", .quarantine)
                    stat("Archive suggestions", "\(snapshot.archiveSuggestions.count)", "archivebox", .archive)
                    stat("Offline drives",
                         "\(snapshot.volumes.filter { !$0.isOnline }.count)", "externaldrive.badge.xmark", .drives)
                }

                Card(title: "Storage") {
                    ForEach(snapshot.volumes) { volume in
                        VolumeRow(volume: volume)
                        if volume.id != snapshot.volumes.last?.id { Divider() }
                    }
                }

                Card(title: "Recent activity") {
                    ForEach(snapshot.activity.prefix(3)) { entry in
                        ActivityRow(entry: entry)
                    }
                }
            }
            .padding(24)
        }
        .sheet(isPresented: $showOrganize) {
            OrganizeSheet(operations: snapshot.plannedOperations)
        }
    }

    private func stat(_ title: String, _ value: String, _ icon: String, _ target: SidebarItem) -> some View {
        Button {
            selection = target
        } label: {
            Card {
                HStack {
                    Image(systemName: icon).foregroundStyle(.secondary)
                    Spacer()
                    MockPill()
                }
                Text(value).font(.system(size: 34, weight: .semibold, design: .rounded)).monospacedDigit()
                Text(title).foregroundStyle(.secondary)
            }
        }
        .buttonStyle(.plain)
        .help("Open \(target.title)")
    }
}

/// Simulated Organize Now flow. Every step is fictional and says so.
struct OrganizeSheet: View {
    let operations: [PlannedOperation]

    @Environment(\.dismiss) private var dismiss
    @State private var phase: Phase = .plan
    @State private var progress: Double = 0

    enum Phase { case plan, running, report }

    private var actionable: [PlannedOperation] { operations.filter { $0.kind != .leaveInPlace } }
    private var leftInPlace: [PlannedOperation] { operations.filter { $0.kind == .leaveInPlace } }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(title).font(.title2.weight(.semibold))
                Spacer()
                Pill(text: "SIMULATION", color: Theme.mock)
            }
            Text("These operations are fictional. Approving runs a pretend execution and changes nothing on disk.")
                .foregroundStyle(.secondary)

            switch phase {
            case .plan:
                List(operations) { op in
                    OperationRow(operation: op)
                        .padding(.vertical, 4)
                }
                .listStyle(.inset)
            case .running:
                Spacer()
                ProgressView(value: progress) {
                    Text("Simulating execute and verify…")
                }
                Spacer()
            case .report:
                report
            }

            HStack {
                Spacer()
                switch phase {
                case .plan:
                    Button("Cancel", role: .cancel) { dismiss() }
                        .keyboardShortcut(.cancelAction)
                    Button("Approve & Simulate") { simulate() }
                        .keyboardShortcut(.defaultAction)
                case .running:
                    EmptyView()
                case .report:
                    Button("Done") { dismiss() }
                        .keyboardShortcut(.defaultAction)
                }
            }
        }
        .padding(24)
        .frame(width: 780, height: 580)
    }

    private var title: String {
        switch phase {
        case .plan: return "Dry-run plan"
        case .running: return "Running (simulated)"
        case .report: return "Report (simulated)"
        }
    }

    private var report: some View {
        VStack(alignment: .leading, spacing: 12) {
            Card(title: "Summary") {
                Label("\(actionable.count) operations simulated", systemImage: "checkmark.circle")
                Label("\(leftInPlace.count) items left in place (linked or uncertain)", systemImage: "hand.raised")
                Label("Verification: simulated, no checksums computed", systemImage: "number")
                Label("Nothing on disk was changed", systemImage: "lock.shield")
                    .foregroundStyle(.green)
            }
            Card(title: "Left in place") {
                ForEach(leftInPlace) { op in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(op.source).font(.caption.monospaced()).lineLimit(1).truncationMode(.middle)
                        Text(op.reason).font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            Spacer()
        }
    }

    private func simulate() {
        phase = .running
        progress = 0
        Task { @MainActor in
            for step in 1...25 {
                try? await Task.sleep(nanoseconds: 50_000_000)
                progress = Double(step) / 25
            }
            phase = .report
        }
    }
}

struct OperationRow: View {
    let operation: PlannedOperation

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 8) {
                Image(systemName: icon).frame(width: 18)
                Text(operation.kind.title).fontWeight(.semibold)
                RiskBadge(risk: operation.risk)
                if operation.isLinkedToProject {
                    Pill(text: "Linked media", color: .blue)
                }
                Spacer()
                ConfidenceLabel(value: operation.confidence)
            }
            PathText(label: "From", path: operation.source)
            if let destination = operation.destination {
                PathText(label: "To", path: destination)
            }
            Text(operation.reason).font(.callout).foregroundStyle(.secondary)
            if operation.needsApproval {
                Text("Needs your approval").font(.caption.weight(.semibold)).foregroundStyle(.orange)
            } else if operation.kind != .leaveInPlace {
                Text("Covered by a previously approved low-risk rule").font(.caption).foregroundStyle(.green)
            }
        }
    }

    private var icon: String {
        switch operation.kind {
        case .move: return "arrow.right.doc.on.clipboard"
        case .rename: return "pencil"
        case .quarantine: return "doc.on.doc"
        case .archive: return "archivebox"
        case .leaveInPlace: return "hand.raised"
        }
    }
}
