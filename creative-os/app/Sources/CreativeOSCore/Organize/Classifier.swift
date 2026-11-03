import Foundation

/// What kind of file something is, from its extension. Never enough on its own to pick a client or campaign.
public enum FileKind: String, CaseIterable, Sendable {
    case video, audio, image, design, projectFile, font, document, prompt, archive, other

    public static func of(_ filename: String) -> FileKind {
        let ext = Naming.splitExtension(filename).ext.lowercased()
        let lowerName = filename.lowercased()
        switch ext {
        case "mov", "mp4", "m4v", "mxf", "avi", "mkv", "braw", "r3d", "mts", "insv", "webm": return .video
        case "wav", "mp3", "aif", "aiff", "m4a", "flac", "aac", "ogg": return .audio
        case "jpg", "jpeg", "png", "heic", "tif", "tiff", "gif", "webp", "dng", "cr2", "cr3", "arw", "nef", "raf": return .image
        case "psd", "psb", "ai", "eps", "svg", "indd", "fig", "sketch", "xd", "afdesign", "afphoto": return .design
        case "prproj", "aep", "aepx", "drp", "fcpxml", "mogrt", "aegraphic": return .projectFile
        case "ttf", "otf", "woff", "woff2": return .font
        case "zip", "rar", "7z", "tar", "gz", "dmg": return .archive
        case "txt", "md", "rtf", "json":
            return lowerName.contains("prompt") ? .prompt : .document
        case "pdf", "doc", "docx", "pages", "key", "pptx", "xlsx", "numbers", "csv": return .document
        default: return .other
        }
    }

    /// Kinds that a project file may link to.
    public var isLinkableMedia: Bool {
        self == .video || self == .audio || self == .image || self == .design
    }
}

/// What the user has told Creative OS (client names and their campaigns). Stored locally and editable.
public struct ClassifierKnowledge: Sendable {
    public struct Client: Sendable {
        public let name: String
        public let aliases: [String]
        public let campaigns: [String: [String]]   // campaign name → extra aliases

        public init(name: String, aliases: [String] = [], campaigns: [String: [String]] = [:]) {
            self.name = name
            self.aliases = aliases
            self.campaigns = campaigns
        }
    }

    public let clients: [Client]
    public init(clients: [Client]) { self.clients = clients }
}

public struct ClassificationResult: Sendable {
    public let kind: FileKind
    /// Nil when there isn't enough evidence; the file then stays in place for review.
    public let classification: Classification?
    /// Plain-language evidence that was found.
    public let reasons: [String]
    /// Plain-language reasons the file can't be filed automatically.
    public let missing: [String]
}

/// Suggests Client → Campaign → Deliverable → Purpose from the file's path and name.
/// Pure and offline. Conflicting or weak evidence means "leave it for review".
public enum Classifier {
    public static func classify(path: String, root: String, knowledge: ClassifierKnowledge) -> ClassificationResult {
        let filename = PathSafety.lastComponent(of: path) ?? path
        let kind = FileKind.of(filename)
        var reasons: [String] = []
        var missing: [String] = []

        // Only look at folders below the approved root, plus the filename.
        let relative = PathSafety.isContained(path, in: root)
            ? String((PathSafety.normalizedAbsolute(path) ?? path).dropFirst((PathSafety.normalizedAbsolute(root) ?? root).count))
            : filename
        let folders = relative.split(separator: "/").dropLast().map(String.init)
        let folderTokens = folders.map { tokens($0) }
        let nameTokens = tokens(Naming.splitExtension(filename).base)
        let allTokens = Set(folderTokens.flatMap { $0 } + nameTokens)

        // 1. Client.
        var clientHits: [(client: ClassifierKnowledge.Client, inFolder: Bool)] = []
        for client in knowledge.clients {
            let keys = Set(([client.name] + client.aliases).map { tokens($0).joined() }.filter { !$0.isEmpty })
            let inFolder = folderTokens.contains { containsRun($0, keys) }
            let inName = containsRun(nameTokens, keys)
            if inFolder || inName { clientHits.append((client, inFolder)) }
        }
        let distinctClients = Set(clientHits.map { $0.client.name })
        guard distinctClients.count == 1, let hit = clientHits.first else {
            if distinctClients.count > 1 {
                missing.append("Matches more than one client: \(distinctClients.sorted().joined(separator: ", ")).")
            } else {
                missing.append("No known client found in the folder names or filename.")
            }
            return ClassificationResult(kind: kind, classification: nil, reasons: reasons, missing: missing)
        }
        let client = hit.client
        var confidence = hit.inFolder ? 0.45 : 0.4
        reasons.append("Client “\(client.name)” found in \(hit.inFolder ? "a folder name" : "the filename").")

        // 2. Campaign.
        var campaignHits: [String] = []
        for (campaign, aliases) in client.campaigns {
            let keys = Set(([campaign] + aliases).map { tokens($0).joined() }.filter { !$0.isEmpty })
            if folderTokens.contains(where: { containsRun($0, keys) }) || containsRun(nameTokens, keys) {
                campaignHits.append(campaign)
            }
        }
        guard campaignHits.count == 1, let campaign = campaignHits.first else {
            missing.append(campaignHits.isEmpty
                           ? "No campaign of \(client.name) found. Creative OS will suggest creating one; it won't guess."
                           : "Matches more than one campaign: \(campaignHits.sorted().joined(separator: ", ")).")
            return ClassificationResult(kind: kind, classification: nil, reasons: reasons, missing: missing)
        }
        confidence += 0.35
        reasons.append("Campaign “\(campaign)” recognised.")

        // 3. Purpose and deliverable.
        let deliverable = deliverableName(folders: folders, filename: filename)
        let purpose: FilePurpose
        var format: ExportFormat?
        var stage: VersionStage?
        switch kind {
        case .video:
            if Naming.isCameraOriginal(filename) || folders.contains(where: isFootageFolder) {
                purpose = .sourceFootage
                reasons.append("Looks like original footage (camera name or footage folder).")
            } else {
                purpose = .exports
                format = exportFormat(folderTokens + [nameTokens])
                stage = FinalApproval.stage(version: Naming.version(in: filename), approval: .notApproved)
                reasons.append("Looks like an export (\(format!.folderName), \(stage!.folderName)).")
            }
        case .audio: purpose = .audio
        case .image:
            purpose = Naming.isCameraOriginal(filename) || folders.contains(where: isFootageFolder) ? .sourceFootage : .graphics
        case .design: purpose = .graphics
        case .projectFile: purpose = .projectFiles
        case .prompt: purpose = .aiAssets
        case .document:
            purpose = allTokens.contains(where: { ["brief", "briefs", "ref", "refs", "reference", "references", "moodboard"].contains($0) })
                ? .briefReferences : .documents
        case .font, .archive, .other:
            missing.append("\(kind.rawValue.capitalized) files aren't sorted automatically.")
            return ClassificationResult(kind: kind, classification: nil, reasons: reasons, missing: missing)
        }

        let finalDeliverable: String?
        if purpose.isCampaignLevel {
            finalDeliverable = nil
        } else if let deliverable {
            finalDeliverable = deliverable
            confidence += 0.1
            reasons.append("Deliverable “\(deliverable)” found.")
        } else {
            missing.append("No deliverable (like Reel_01) found in the name or folders.")
            return ClassificationResult(kind: kind, classification: nil, reasons: reasons, missing: missing)
        }
        if purpose.isCampaignLevel { confidence += 0.1 }

        let location = OrganizedLocation(client: client.name, campaign: campaign, deliverable: finalDeliverable,
                                         purpose: purpose, exportFormat: format, stage: stage)
        return ClassificationResult(kind: kind,
                                    classification: Classification(location: location, confidence: min(confidence, 0.99)),
                                    reasons: reasons, missing: missing)
    }

    // MARK: Helpers

    /// Lowercased words: "ACME_SpringLaunch-Teaser v02" → ["acme", "spring", "launch", "teaser", "v", "02"].
    static func tokens(_ text: String) -> [String] {
        var words: [String] = []
        var current = ""
        var previous: Character?
        for ch in text.precomposedStringWithCanonicalMapping {
            if ch.isLetter || ch.isNumber {
                let boundary = previous.map { ($0.isLowercase && ch.isUppercase) || ($0.isLetter != ch.isLetter) } ?? false
                if boundary && !current.isEmpty { words.append(current.lowercased()); current = "" }
                current.append(ch)
            } else if !current.isEmpty {
                words.append(current.lowercased())
                current = ""
            }
            previous = ch
        }
        if !current.isEmpty { words.append(current.lowercased()) }
        return words
    }

    /// True if some run of consecutive words joins to one of the keys
    /// (so "Spring Launch", "SpringLaunch" and "spring_launch" all match "springlaunch").
    static func containsRun(_ words: [String], _ keys: Set<String>) -> Bool {
        guard !keys.isEmpty else { return false }
        let longest = keys.map(\.count).max() ?? 0
        for start in words.indices {
            var joined = ""
            for word in words[start...] {
                joined += word
                if keys.contains(joined) { return true }
                if joined.count >= longest { break }
            }
        }
        return false
    }

    private static func isFootageFolder(_ name: String) -> Bool {
        let t = tokens(name)
        return t.contains { ["footage", "raw", "rushes", "card", "dcim", "source", "clips", "broll"].contains($0) }
            || name.uppercased().range(of: "^A[0-9]{3}", options: .regularExpression) != nil
    }

    private static func exportFormat(_ wordLists: [[String]]) -> ExportFormat {
        func has(_ keys: Set<String>) -> Bool { wordLists.contains { containsRun($0, keys) } }
        if has(["whatsapp", "wa"]) { return .whatsApp }
        if has(["story", "stories"]) { return .stories }
        if has(["reel", "reels", "ig", "instagram"]) { return .instagramReels }
        if has(["master", "masters"]) { return .masters }
        return .otherFormats
    }

    /// "Reel 1", "reel_01", "Story-02", "Teaser01" → "Reel_01". Filename first, then nearest folder.
    static func deliverableName(folders: [String], filename: String) -> String? {
        let kinds = ["reel", "story", "teaser", "poster", "spot", "ad", "post", "video", "episode", "banner", "trailer"]
        for text in [Naming.splitExtension(filename).base] + folders.reversed() {
            let t = tokens(text)
            for (i, word) in t.enumerated() where kinds.contains(word) {
                if i + 1 < t.count, let n = Int(t[i + 1]), n > 0, n < 1000 {
                    let number = n < 10 ? "0\(n)" : "\(n)"
                    return String(word.prefix(1)).uppercased() + String(word.dropFirst()) + "_" + number
                }
            }
        }
        return nil
    }
}
