import Foundation

/// The user's client list, written as plain text so it is easy to read and edit:
///
///     # lines starting with # are notes
///     AMINTIRI (Amintiri Cafe, AMT): Coffee_Campaign, Winter_Menu
///     ACME: Spring_Launch
///
/// Client name, optional nicknames in brackets, a colon, then the campaigns.
public enum KnowledgeText {
    public struct Parsed: Sendable {
        public let knowledge: ClassifierKnowledge
        /// Plain-language problems, one per line that couldn't be understood.
        public let problems: [String]
        public var clientCount: Int { knowledge.clients.count }
        public var campaignCount: Int { knowledge.clients.reduce(0) { $0 + $1.campaigns.count } }
    }

    public static let example = """
        # One client per line:  CLIENT (nicknames): Campaign_One, Campaign_Two
        AMINTIRI (Amintiri Cafe): Coffee_Campaign, Winter_Menu
        ACME: Spring_Launch
        """

    public static func parse(_ text: String) -> Parsed {
        var clients: [ClassifierKnowledge.Client] = []
        var problems: [String] = []
        var seen = Set<String>()

        for (index, rawLine) in text.components(separatedBy: .newlines).enumerated() {
            let line = rawLine.trimmingCharacters(in: .whitespaces)
            if line.isEmpty || line.hasPrefix("#") { continue }
            let lineNumber = index + 1

            guard let colon = line.firstIndex(of: ":") else {
                problems.append("Line \(lineNumber): add a colon after the client name, e.g. “ACME: Spring_Launch”.")
                continue
            }
            var head = String(line[..<colon]).trimmingCharacters(in: .whitespaces)
            let tail = String(line[line.index(after: colon)...])

            var aliases: [String] = []
            if let open = head.firstIndex(of: "("), let close = head.lastIndex(of: ")"), open < close {
                aliases = list(String(head[head.index(after: open)..<close]))
                head = String(head[..<open]).trimmingCharacters(in: .whitespaces)
            }
            guard !head.isEmpty, PathSafety.sanitizeComponent(head) != nil else {
                problems.append("Line \(lineNumber): the client name is missing or can't be used as a folder name.")
                continue
            }
            let campaigns = list(tail).filter { PathSafety.sanitizeComponent($0) != nil }
            guard !campaigns.isEmpty else {
                problems.append("Line \(lineNumber): \(head) has no campaigns yet. Add at least one after the colon.")
                continue
            }
            guard seen.insert(head.lowercased()).inserted else {
                problems.append("Line \(lineNumber): \(head) is listed twice. Put all its campaigns on one line.")
                continue
            }
            var campaignMap: [String: [String]] = [:]
            for c in campaigns { campaignMap[c] = [] }
            clients.append(.init(name: head, aliases: aliases, campaigns: campaignMap))
        }
        return Parsed(knowledge: ClassifierKnowledge(clients: clients), problems: problems)
    }

    private static func list(_ text: String) -> [String] {
        text.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }
}

/// Keeps Organize Now focused on creative folders, never "the whole Mac".
public enum ScopeRules {
    /// Returns a plain-language reason if `folder` is too broad or a system location, else nil.
    public static func problem(with folder: String, home: String) -> String? {
        guard let path = PathSafety.normalizedAbsolute(folder) else { return "That isn't a valid folder." }
        let homePath = PathSafety.normalizedAbsolute(home) ?? home
        let tooBroad: Set<String> = ["/", "/Users", "/Volumes", homePath]
        if tooBroad.contains(path) {
            return "That folder is too broad. Pick a specific creative folder, like Desktop/Projects or a client folder."
        }
        for system in ["/System", "/Library", "/Applications", "/private", "/usr", "/bin", "/sbin", "/opt", "/cores",
                       homePath + "/Library", homePath + "/Applications", homePath + "/.Trash"]
            where PathSafety.isContained(path, in: system) {
            return "That is a system or app folder. Creative OS only organizes creative files."
        }
        return nil
    }

    /// The scanned folder and the Creative_Master folder must not be the same place.
    public static func overlapProblem(source: String, master: String) -> String? {
        guard let s = PathSafety.normalizedAbsolute(source), let m = PathSafety.normalizedAbsolute(master) else {
            return "That isn't a valid folder."
        }
        if s == m { return "Pick different folders: one to look through, and one for Creative_Master." }
        if PathSafety.isContained(s, in: m) {
            return "The folder to look through is inside Creative_Master. Pick a folder outside it."
        }
        return nil
    }
}
