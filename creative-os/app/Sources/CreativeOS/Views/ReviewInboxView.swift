import SwiftUI
import CreativeOSCore

struct ReviewInboxView: View {
    let snapshot: DashboardSnapshot

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PageHeader(
                    title: "Review Inbox",
                    subtitle: "Unclear files stay at their original path until you decide. This list is an index, not a folder."
                )
                ForEach(snapshot.reviewItems) { item in
                    Card {
                        HStack {
                            Pill(text: item.fileType, color: .blue)
                            Spacer()
                            ConfidenceLabel(value: item.confidence)
                        }
                        PathText(label: "Path", path: item.path)
                        Text(item.reason)
                        if let suggestion = item.suggestion {
                            Text("Best guess: \(suggestion)").font(.callout).foregroundStyle(.secondary)
                        } else {
                            Text("No suggestion").font(.callout).foregroundStyle(.secondary)
                        }
                        HStack {
                            FutureButton(title: "Assign to project…", systemImage: "folder.badge.plus", milestone: 4)
                            FutureButton(title: "Keep where it is", systemImage: "hand.raised", milestone: 4)
                            FutureButton(title: "Remember this rule", systemImage: "brain", milestone: 4)
                        }
                    }
                }
            }
            .padding(24)
        }
    }
}
