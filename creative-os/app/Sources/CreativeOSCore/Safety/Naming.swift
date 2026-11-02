import Foundation

/// Filename helpers. Professional names are suggestions only; the planner never applies
/// them to camera originals or to files a project links to.
public enum Naming {
    public static func splitExtension(_ filename: String) -> (base: String, ext: String) {
        guard let dot = filename.lastIndex(of: "."), dot != filename.startIndex else {
            return (filename, "")
        }
        return (String(filename[..<dot]), String(filename[filename.index(after: dot)...]))
    }

    /// Camera / recorder original names (decision 5: never renamed).
    public static func isCameraOriginal(_ filename: String) -> Bool {
        let base = splitExtension(filename).base.uppercased()
        let patterns = [
            "^IMG_[0-9]{3,}$",          // iPhone, Canon
            "^DSC[_F]?[0-9]{3,}$",      // Sony, Nikon stills
            "^C[0-9]{4}$",              // Sony video
            "^GOPR[0-9]{4}$", "^G[HXL][0-9]{6}$", // GoPro
            "^MVI_[0-9]{4}$",           // Canon video
            "^DJI_[0-9]{4}",            // DJI
            "^A[0-9]{3}C[0-9]{3}",      // ARRI / Blackmagic style reel+clip
            "^PXL_[0-9]{8}_[0-9]+",     // Pixel
            "^[0-9]{8}_[0-9]{6}$",      // Samsung / generic timestamp
            "^CLIP[0-9]+$", "^ZOOM[0-9]{4}$", "^TASCAM_[0-9]{4}",  // audio recorders
        ]
        return patterns.contains { base.range(of: $0, options: .regularExpression) != nil }
    }

    /// Version number from a name like `Teaser_v03.mp4` or `Teaser v3.mov`.
    public static func version(in filename: String) -> Int? {
        let base = splitExtension(filename).base
        guard let r = base.range(of: "[_ -][vV][0-9]{1,4}$", options: .regularExpression) else { return nil }
        return Int(base[r].drop(while: { !$0.isNumber }))
    }

    /// Next free version given the names already present (highest + 1, starting at 1).
    public static func nextVersion(existing names: [String]) -> Int {
        (names.compactMap(version(in:)).max() ?? 0) + 1
    }

    /// `CLIENT_Campaign_Deliverable_vNN.ext`, e.g. `AMINTIRI_CoffeeCampaign_Reel01_v03.mp4`.
    public static func suggestedName(client: String, campaign: String, deliverable: String,
                                     version: Int, ext: String) -> String? {
        let parts = [camel(client.uppercased()), camel(campaign), camel(deliverable)]
        guard version > 0, parts.allSatisfy({ !$0.isEmpty }) else { return nil }
        let v = version < 10 ? "0\(version)" : "\(version)"
        let e = ext.isEmpty ? "" : "." + ext.lowercased()
        return parts.joined(separator: "_") + "_v" + v + e
    }

    /// Returns `desired`, or `desired (2)`, `(3)`… so nothing is ever overwritten.
    /// Comparison ignores case and Unicode form because APFS does by default.
    public static func uniqueName(_ desired: String, taken: Set<String>) -> String {
        func key(_ s: String) -> String { s.precomposedStringWithCanonicalMapping.lowercased() }
        let used = Set(taken.map(key))
        if !used.contains(key(desired)) { return desired }
        let (base, ext) = splitExtension(desired)
        var n = 2
        while true {
            let candidate = ext.isEmpty ? "\(base) (\(n))" : "\(base) (\(n)).\(ext)"
            if !used.contains(key(candidate)) { return candidate }
            n += 1
        }
    }

    private static func camel(_ s: String) -> String {
        s.precomposedStringWithCanonicalMapping
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .map { String($0.prefix(1)).uppercased() + String($0.dropFirst()) }
            .joined()
    }
}
