import SwiftUI
import CreativeOSCore

struct QuarantineView: View {
    let snapshot: DashboardSnapshot

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PageHeader(
                    title: "Duplicate Quarantine",
                    subtitle: "Byte-identical copies only (size, then SHA-256). Nothing is ever deleted automatically."
                )
                ForEach(snapshot.quarantine) { item in
                    Card {
                        HStack {
                            Text(Format.bytes(item.sizeBytes)).monospacedDigit()
                            Spacer()
                            Text(item.quarantinedAt, format: .relative(presentation: .named))
                                .foregroundStyle(.secondary)
                        }
                        PathText(label: "Was", path: item.originalPath)
                        PathText(label: "Kept", path: item.keptCopyPath)
                        Text("SHA-256 " + String(item.sha256.prefix(16)) + "…")
                            .font(.caption.monospaced())
                            .foregroundStyle(.secondary)
                        Text(item.reason).font(.callout)
                        HStack {
                            FutureButton(title: "Restore", systemImage: "arrow.uturn.backward", milestone: 6)
                            FutureButton(title: "Reveal kept copy", systemImage: "eye", milestone: 6)
                        }
                    }
                }
            }
            .padding(24)
        }
    }
}
