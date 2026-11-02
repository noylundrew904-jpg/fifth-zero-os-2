import SwiftUI
import CreativeOSCore

struct ActivityView: View {
    let snapshot: DashboardSnapshot

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PageHeader(
                    title: "Activity & Undo",
                    subtitle: "Every operation is journaled. Undo restores where feasible; it is not guaranteed in every case."
                )
                Card {
                    ForEach(snapshot.activity) { entry in
                        ActivityRow(entry: entry, showsUndo: true)
                        if entry.id != snapshot.activity.last?.id { Divider() }
                    }
                }
            }
            .padding(24)
        }
    }
}

struct ActivityRow: View {
    let entry: ActivityEntry
    var showsUndo = false

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).foregroundStyle(color).frame(width: 18)
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(entry.action).fontWeight(.medium)
                    Pill(text: entry.outcome.title, color: color)
                }
                Text(entry.detail).font(.callout).foregroundStyle(.secondary)
                Text(entry.date, format: .relative(presentation: .named))
                    .font(.caption).foregroundStyle(.tertiary)
            }
            Spacer()
            if showsUndo && entry.canUndo {
                FutureButton(title: "Undo", systemImage: "arrow.uturn.backward", milestone: 5)
            }
        }
    }

    private var icon: String {
        switch entry.outcome {
        case .success: return "checkmark.circle.fill"
        case .skipped: return "forward.circle.fill"
        case .failed: return "xmark.octagon.fill"
        }
    }

    private var color: Color {
        switch entry.outcome {
        case .success: return .green
        case .skipped: return .yellow
        case .failed: return .red
        }
    }
}
