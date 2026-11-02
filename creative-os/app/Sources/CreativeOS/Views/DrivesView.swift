import SwiftUI
import CreativeOSCore

struct DrivesView: View {
    let snapshot: DashboardSnapshot

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PageHeader(
                    title: "Drives & Storage",
                    subtitle: "Only registered drives are used. Offline drives are skipped, never swapped for another path."
                )
                ForEach(snapshot.volumes) { volume in
                    Card {
                        VolumeRow(volume: volume)
                        HStack(spacing: 16) {
                            Label(volume.kind.title, systemImage: "info.circle")
                            Label(volume.isRegistered ? "Registered" : "Not registered",
                                  systemImage: volume.isRegistered ? "checkmark.seal" : "xmark.seal")
                            Text("Volume ID: mock-" + String(volume.id.uuidString.prefix(8)))
                                .font(.caption.monospaced())
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }
                HStack {
                    FutureButton(title: "Register a drive…", systemImage: "plus", milestone: 3)
                    FutureButton(title: "Storage recommendations", systemImage: "lightbulb", milestone: 7)
                }
            }
            .padding(24)
        }
    }
}
