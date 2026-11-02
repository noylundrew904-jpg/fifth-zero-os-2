import SwiftUI
import CreativeOSCore

struct SearchView: View {
    let snapshot: DashboardSnapshot
    @State private var query = ""

    private var hits: [SearchHit] { LocalSearch.search(query, in: snapshot.searchIndex) }
    private let examples = ["acme psd", "reusable", "voiceover", "prompt"]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            PageHeader(
                title: "Search",
                subtitle: "Offline search of the local index. No internet or AI service needed."
            )
            TextField("Search clients, projects, file types, tags…", text: $query)
                .textFieldStyle(.roundedBorder)
                .font(.title3)
            HStack {
                Text("Try:").foregroundStyle(.secondary)
                ForEach(examples, id: \.self) { example in
                    Button(example) { query = example }.buttonStyle(.link)
                }
            }
            .font(.callout)

            if query.trimmingCharacters(in: .whitespaces).isEmpty {
                Text("The mock index holds \(snapshot.searchIndex.count) fictional files.")
                    .foregroundStyle(.secondary)
            } else if hits.isEmpty {
                Text("No matches. Every word must match a client, project, type, tag or filename.")
                    .foregroundStyle(.secondary)
            }

            List(hits) { hit in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(hit.record.fileName).fontWeight(.medium)
                        Spacer()
                        Text("\(hit.record.client) / \(hit.record.project)").foregroundStyle(.secondary)
                    }
                    Text(hit.record.path).font(.caption.monospaced()).foregroundStyle(.secondary)
                        .lineLimit(1).truncationMode(.middle)
                    Text("Why: " + hit.reasons.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.green)
                }
                .padding(.vertical, 3)
            }
            .listStyle(.inset)
        }
        .padding(24)
    }
}
