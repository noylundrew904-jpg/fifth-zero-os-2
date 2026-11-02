import SwiftUI

struct SettingsView: View {
    @State private var threshold = 0.80

    var body: some View {
        Form {
            Section("Safety") {
                Toggle("Dry run for every new rule", isOn: .constant(true))
                    .disabled(true)
                    .help("Always on. Required by the safety rules.")
                VStack(alignment: .leading) {
                    Slider(value: $threshold, in: 0.5...0.99) {
                        Text("Auto-file confidence threshold")
                    }
                    Text("\(Int(threshold * 100))%. Below this, files go to the Review Inbox. (Mock: not saved.)")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            Section("Privacy & cost") {
                Toggle("Upload thumbnails to a cloud AI", isOn: .constant(false))
                    .disabled(true)
                Text("Not available. Creative OS is zero-cost and works fully offline. Nothing is ever uploaded.")
                    .font(.caption).foregroundStyle(.secondary)
                LabeledContent("Network access", value: "None")
                LabeledContent("Paid services", value: "None")
            }

            Section("Local intelligence (all free, on this Mac)") {
                LabeledContent("Image understanding", value: "Apple Vision (built in, no download)")
                LabeledContent("Text & OCR", value: "Apple Vision + NaturalLanguage (built in)")
                LabeledContent("Search", value: "SQLite full-text + rule-based parser")
                LabeledContent("Optional local language model", value: "Not installed: will ask first")
            }

            Section("Learned preferences") {
                LabeledContent("Client aliases", value: "3 (mock)")
                LabeledContent("Sorting rules", value: "1 approved (mock)")
                HStack {
                    FutureButton(title: "Edit rules…", systemImage: "slider.horizontal.3", milestone: 4)
                    FutureButton(title: "Reset learning", systemImage: "arrow.counterclockwise", milestone: 4)
                }
            }
        }
        .formStyle(.grouped)
        .padding(12)
    }
}
