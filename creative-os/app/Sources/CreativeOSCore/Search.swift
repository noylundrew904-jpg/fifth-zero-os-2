import Foundation

/// Simple offline keyword search over an in-memory index.
///
/// Every word in the query must match at least one field (AND semantics).
/// Each hit carries the reasons it matched so the UI can explain results.
/// Milestone 4 replaces the in-memory list with SQLite FTS5; Milestone 8 adds a
/// rule-based natural-language parser. Neither needs a paid or online service.
public enum LocalSearch {
    public static func search(_ query: String, in records: [SearchRecord]) -> [SearchHit] {
        let terms = query
            .lowercased()
            .split(whereSeparator: { $0.isWhitespace || $0 == "," })
            .map(String.init)
            .filter { !$0.isEmpty }
        guard !terms.isEmpty else { return [] }

        var hits: [SearchHit] = []
        for record in records {
            var reasons: [String] = []
            var allMatched = true
            for term in terms {
                if let reason = match(term, record) {
                    reasons.append(reason)
                } else {
                    allMatched = false
                    break
                }
            }
            if allMatched {
                hits.append(SearchHit(record: record, reasons: reasons))
            }
        }
        return hits.sorted { $0.record.modified > $1.record.modified }
    }

    private static func match(_ term: String, _ r: SearchRecord) -> String? {
        if r.client.lowercased().contains(term) { return "Client “\(r.client)” matches “\(term)”" }
        if r.project.lowercased().contains(term) { return "Project “\(r.project)” matches “\(term)”" }
        if r.fileType.lowercased() == term { return "File type is \(r.fileType)" }
        if let tag = r.tags.first(where: { $0.lowercased().contains(term) }) {
            return "Tagged “\(tag)”"
        }
        if r.fileName.lowercased().contains(term) { return "Filename contains “\(term)”" }
        return nil
    }
}

public enum Format {
    public static func bytes(_ value: Int64) -> String {
        ByteCountFormatter.string(fromByteCount: value, countStyle: .file)
    }

    public static func percent(_ fraction: Double) -> String {
        "\(Int((fraction * 100).rounded()))%"
    }
}
