import SwiftUI
import CreativeOSCore
import CreativeOSScanner

/// Organize Now, preview only. One step at a time; nothing on disk changes.
struct OrganizePreviewView: View {
    @ObservedObject var model: OrganizePreviewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                PageHeader(
                    title: "Organize Now",
                    subtitle: "Preview only. Creative OS reads file names, sizes and dates in the folder you choose and shows what it would do. Nothing is moved, renamed or deleted."
                )

                stepCard(number: 1, title: "Folder to look through", path: model.sourceFolder,
                         note: "Pick one creative folder, like Desktop/Projects or Downloads.",
                         action: model.chooseSource)
                stepCard(number: 2, title: "Where Creative_Master lives", path: model.masterFolder,
                         note: "Organized files would go into 01_CLIENTS inside it. Nothing is created now.",
                         action: model.chooseMaster)
                clientsCard

                switch model.phase {
                case .setup:
                    runButton
                case .scanning(let found):
                    Card {
                        HStack(spacing: 12) {
                            ProgressView().controlSize(.small)
                            Text("Looking… \(found) files found").monospacedDigit()
                            Spacer()
                            Button("Cancel", action: model.cancel)
                        }
                    }
                case .failed(let reason):
                    Card {
                        Label(reason, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
                        Button("Try again", action: model.startOver)
                    }
                case .done(let outcome):
                    results(outcome)
                }
            }
            .padding(24)
        }
    }

    // MARK: Steps

    private func stepCard(number: Int, title: String, path: String?, note: String,
                          action: @escaping () -> Void) -> some View {
        Card {
            HStack(alignment: .top, spacing: 12) {
                stepNumber(number, done: path != nil)
                VStack(alignment: .leading, spacing: 6) {
                    Text(title).font(.headline)
                    if let path {
                        Text(path).font(.callout.monospaced()).textSelection(.enabled)
                            .lineLimit(2).truncationMode(.middle)
                    } else {
                        Text("Not chosen yet").foregroundStyle(.secondary)
                    }
                    Text(note).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button(path == nil ? "Choose…" : "Change…", action: action)
                    .disabled(model.isScanning)
            }
        }
    }

    private var clientsCard: some View {
        let parsed = model.parsed
        return Card {
            HStack(alignment: .top, spacing: 12) {
                stepNumber(3, done: parsed.clientCount > 0 && parsed.problems.isEmpty)
                VStack(alignment: .leading, spacing: 8) {
                    Text("Your clients and campaigns").font(.headline)
                    Text("One client per line: CLIENT (nicknames): Campaign_One, Campaign_Two")
                        .font(.caption).foregroundStyle(.secondary)
                    TextEditor(text: $model.knowledgeText)
                        .font(.body.monospaced())
                        .frame(minHeight: 96)
                        .scrollContentBackground(.hidden)
                        .padding(6)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Color.black.opacity(0.25)))
                        .disabled(model.isScanning)
                    Text("\(parsed.clientCount) clients, \(parsed.campaignCount) campaigns understood.")
                        .font(.caption).foregroundStyle(parsed.clientCount > 0 ? Color.green : Color.orange)
                    ForEach(parsed.problems, id: \.self) { problem in
                        Text(problem).font(.caption).foregroundStyle(.orange)
                    }
                    Text("Not saved yet: this list is kept only while the app is open.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }

    private var runButton: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: model.runPreview) {
                Label("Show Preview", systemImage: "eye")
                    .font(.title3.weight(.semibold))
                    .padding(.horizontal, 18)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(model.blockingProblem != nil)
            if let problem = model.blockingProblem {
                Text(problem).foregroundStyle(.secondary)
            }
        }
    }

    private func stepNumber(_ n: Int, done: Bool) -> some View {
        ZStack {
            Circle().fill(done ? Color.green.opacity(0.25) : Color.white.opacity(0.08)).frame(width: 28, height: 28)
            if done {
                Image(systemName: "checkmark").font(.caption.weight(.bold)).foregroundStyle(.green)
            } else {
                Text("\(n)").font(.callout.weight(.semibold))
            }
        }
    }

    // MARK: Results

    private func results(_ outcome: PreviewOutcome) -> some View {
        let report = outcome.report
        return VStack(alignment: .leading, spacing: 14) {
            Card {
                HStack {
                    Pill(text: "PREVIEW · NOTHING CHANGED", color: .green)
                    Spacer()
                    Text(outcome.finishedAt, style: .time).font(.caption).foregroundStyle(.secondary)
                }
                Text(report.summary).font(.headline)
                HStack(spacing: 24) {
                    count(report.moves.count, "would be organized", .accentColor)
                    count(report.reviewInbox.count, "stay put for review", .orange)
                    count(report.skipped.count, "skipped for now", .secondary)
                }
                if outcome.wasCancelled { Text("You stopped the scan early, so this is a partial preview.").foregroundStyle(.orange) }
                if outcome.hitLimit { Text("Stopped at the safety limit of files. Pick a smaller folder for a full preview.").foregroundStyle(.orange) }
                if !outcome.skipped.isEmpty || outcome.hiddenCount > 0 {
                    Text("\(outcome.skipped.count) items not looked into (system, cache, packages, links) and \(outcome.hiddenCount) hidden items ignored.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                HStack {
                    Button("Run preview again", action: model.runPreview)
                    Button("Change settings", action: model.startOver)
                }
            }

            ResultSection("Would be organized", subtitle: "Each one would need your approval. Moving isn't switched on yet.",
                    items: report.moves, expanded: true) { item in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(fileName(item)).fontWeight(.medium)
                        RiskBadge(risk: item.action.risk)
                        Spacer()
                        if item.action.requiresApproval { Text("Needs approval").font(.caption).foregroundStyle(.orange) }
                    }
                    PathText(label: "From", path: item.file.path)
                    if case .move(let destination, _) = item.action.kind { PathText(label: "To", path: destination) }
                    Text((item.evidence + [item.action.explanation]).joined(separator: " "))
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            ResultSection("Review Inbox", subtitle: "Unclear files. They stay exactly where they are.",
                    items: report.reviewInbox, expanded: false) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(fileName(item)).fontWeight(.medium)
                    PathText(label: "Path", path: item.file.path)
                    Text((item.missing.isEmpty ? [item.action.explanation] : item.missing).joined(separator: " "))
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            ResultSection("Skipped for now", subtitle: "Still changing, or on a drive that isn't connected.",
                    items: report.skipped, expanded: false) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(fileName(item)).fontWeight(.medium)
                    Text(item.action.explanation).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }

    private func count(_ n: Int, _ label: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(n)").font(.system(size: 28, weight: .semibold, design: .rounded)).monospacedDigit().foregroundStyle(color)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
    }

    private func fileName(_ item: DryRunItem) -> String {
        PathSafety.lastComponent(of: item.file.path) ?? item.file.path
    }

}

/// One collapsible results list. Shows at most 200 rows so the window stays fast.
private struct ResultSection<Row: View>: View {
    let title: String
    let subtitle: String
    let items: [DryRunItem]
    let row: (DryRunItem) -> Row
    @State private var isExpanded: Bool

    init(_ title: String, subtitle: String, items: [DryRunItem], expanded: Bool,
         @ViewBuilder row: @escaping (DryRunItem) -> Row) {
        self.title = title
        self.subtitle = subtitle
        self.items = items
        self.row = row
        _isExpanded = State(initialValue: expanded)
    }

    var body: some View {
        Card {
            DisclosureGroup(isExpanded: $isExpanded) {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(Array(items.prefix(200).enumerated()), id: \.offset) { _, item in
                        row(item)
                        Divider()
                    }
                    if items.count > 200 {
                        Text("…and \(items.count - 200) more.").font(.caption).foregroundStyle(.secondary)
                    }
                    if items.isEmpty {
                        Text("Nothing here.").foregroundStyle(.secondary)
                    }
                }
                .padding(.top, 8)
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(title) (\(items.count))").font(.headline)
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }
}
