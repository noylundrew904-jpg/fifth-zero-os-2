import SwiftUI
import CreativeOSCore

struct ProjectsView: View {
    let snapshot: DashboardSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            PageHeader(
                title: "Campaigns",
                subtitle: "Client → Campaign → Deliverable → File type. Unverified links are never moved."
            )
            Table(snapshot.projects) {
                TableColumn("Client", value: \.client)
                TableColumn("Campaign", value: \.name)
                TableColumn("Status") { p in Text(p.status.title) }
                TableColumn("Last activity") { p in
                    Text(p.lastActivity, format: .relative(presentation: .named))
                }
                TableColumn("Size") { p in Text(Format.bytes(p.sizeBytes)).monospacedDigit() }
                TableColumn("Files") { p in Text("\(p.fileCount)").monospacedDigit() }
                TableColumn("Volume", value: \.volumeName)
                TableColumn("Links") { p in
                    Pill(text: p.dependencyState.title,
                         color: p.dependencyState.allowsMoves ? .green : .orange)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
        }
        .padding(24)
    }
}
