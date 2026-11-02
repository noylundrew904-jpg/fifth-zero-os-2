import Foundation

/// Pure, lexical path checks. Nothing here touches the file system.
/// Symlink and permission checks happen later, in the scanner, against real files.
public enum PathSafety {
    /// APFS/HFS+ limit for one path component.
    public static let maxComponentBytes = 255

    /// Turns user/derived text into a safe single folder name, or nil if nothing usable remains.
    /// Unicode is normalized (NFC), path separators become "_", control characters are dropped,
    /// and leading dots are removed so folders can't become hidden or escape with "..".
    public static func sanitizeComponent(_ raw: String) -> String? {
        let nfc = raw.precomposedStringWithCanonicalMapping
        var out = ""
        for scalar in nfc.unicodeScalars {
            if scalar == "/" || scalar == ":" {
                out.append("_")
            } else if CharacterSet.controlCharacters.contains(scalar) {
                continue
            } else {
                out.unicodeScalars.append(scalar)
            }
        }
        var s = Substring(out.trimmingCharacters(in: .whitespacesAndNewlines))
        while s.first == "." { s = s.dropFirst() }
        while s.last == "." || s.last == " " { s = s.dropLast() }
        let result = String(s)
        guard !result.isEmpty, result.utf8.count <= maxComponentBytes else { return nil }
        return result
    }

    /// Lexically normalizes an absolute path: drops "." and empty parts, resolves "..", NFC-normalizes.
    /// Returns nil for relative paths and for ".." that would climb above "/".
    public static func normalizedAbsolute(_ path: String) -> String? {
        guard path.hasPrefix("/") else { return nil }
        var parts: [String] = []
        for comp in path.split(separator: "/", omittingEmptySubsequences: true) {
            if comp == "." { continue }
            if comp == ".." {
                if parts.isEmpty { return nil }
                parts.removeLast()
                continue
            }
            parts.append(String(comp).precomposedStringWithCanonicalMapping)
        }
        return "/" + parts.joined(separator: "/")
    }

    /// True when `path` is `root` or inside it. Case-sensitive on purpose (stricter = safer).
    public static func isContained(_ path: String, in root: String) -> Bool {
        guard let p = normalizedAbsolute(path), let r = normalizedAbsolute(root) else { return false }
        if r == "/" { return true }
        return p == r || p.hasPrefix(r + "/")
    }

    /// Joins already-sanitized components under `root`. Nil if any component is unsafe
    /// or the result would land outside `root`.
    public static func join(_ root: String, _ components: [String]) -> String? {
        guard let r = normalizedAbsolute(root) else { return nil }
        for c in components where sanitizeComponent(c) != c { return nil }
        let joined = components.isEmpty ? r : (r == "/" ? "/" : r + "/") + components.joined(separator: "/")
        guard let normalized = normalizedAbsolute(joined), isContained(normalized, in: r) else { return nil }
        return normalized
    }

    public static func parent(of path: String) -> String? {
        guard let p = normalizedAbsolute(path), p != "/" else { return nil }
        let parts = p.split(separator: "/")
        return parts.count <= 1 ? "/" : "/" + parts.dropLast().joined(separator: "/")
    }

    public static func lastComponent(of path: String) -> String? {
        guard let p = normalizedAbsolute(path), p != "/" else { return nil }
        return p.split(separator: "/").last.map(String.init)
    }
}
