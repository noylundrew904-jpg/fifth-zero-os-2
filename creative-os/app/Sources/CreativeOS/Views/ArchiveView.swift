import SwiftUI
import CreativeOSCore

struct ArchiveView: View {
    let snapshot: DashboardSnapshot

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PageHeader(
                    title: "Archive Suggestions",
                    subtitle: "30 days without activity is a suggestion, not proof a project is finished."
                )
                ForEach(snapshot.archiveSuggestions) { s in
                    Card {
                        HStack {
                            Text("\(s.client) / \(s.project)").font(.headline)
                            Spacer()
                            Text("\(s.inactiveDays) days inactive").foregroundStyle(.secondary)
                        }
                        Text("\(Format.bytes(s.sizeBytes)) → \(s.destination)")
                            .font(.callout.monospaced())
                        if s.isReady {
                            Label("Ready for your approval", systemImage: "checkmark.circle")
                                .foregroundStyle(.green)
                        } else {
                            ForEach(s.blockers, id: \.self) { blocker in
                                Label(blocker, systemImage: "exclamationmark.triangle.fill")
                                    .foregroundStyle(.orange)
                            }
                        }
                        HStack {
                            FutureButton(title: "Review & approve…", systemImage: "archivebox", milestone: 7)
                            FutureButton(title: "Not finished yet", systemImage: "clock", milestone: 7)
                        }
                    }
                }
            }
            .padding(24)
        }
    }
}
