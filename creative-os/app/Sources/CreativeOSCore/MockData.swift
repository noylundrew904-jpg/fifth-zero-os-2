import Foundation

/// Fictional data for the Milestone 2 dashboard.
///
/// Every path starts with `MockData.root` so it can never be mistaken for, or
/// resolved to, a real location on this Mac. Clients are invented names.
/// Nothing here touches the file system.
public enum MockData {
    public static let root = "/MOCK"

    private static let GB: Int64 = 1_000_000_000
    private static let TB: Int64 = 1_000_000_000_000

    public static func make(now: Date = Date()) -> DashboardSnapshot {
        func daysAgo(_ d: Double) -> Date { now.addingTimeInterval(-d * 86_400) }
        let master = "\(root)/Creative_Master"

        let volumes = [
            StorageVolume(id: UUID(), name: "Macintosh HD (mock)", kind: .internalDisk,
                          role: "Active projects", totalBytes: 1 * TB, freeBytes: 212 * GB,
                          isOnline: true, isRegistered: true),
            StorageVolume(id: UUID(), name: "MOCK_Footage_SSD", kind: .external,
                          role: "Large footage", totalBytes: 2 * TB, freeBytes: 640 * GB,
                          isOnline: true, isRegistered: true),
            StorageVolume(id: UUID(), name: "MOCK_Archive_HDD", kind: .external,
                          role: "Archive", totalBytes: 4 * TB, freeBytes: 2_900 * GB,
                          isOnline: false, isRegistered: true),
        ]

        let projects = [
            Project(id: UUID(), client: "ACME", name: "Spring_Launch", status: .active,
                    lastActivity: daysAgo(2), sizeBytes: 48 * GB, fileCount: 312,
                    volumeName: "Macintosh HD (mock)", dependencyState: .resolved),
            Project(id: UUID(), client: "NORTHWIND", name: "Product_Demo", status: .active,
                    lastActivity: daysAgo(5), sizeBytes: 126 * GB, fileCount: 884,
                    volumeName: "MOCK_Footage_SSD", dependencyState: .unresolved),
            Project(id: UUID(), client: "INITECH", name: "Podcast_S2", status: .active,
                    lastActivity: daysAgo(1), sizeBytes: 19 * GB, fileCount: 140,
                    volumeName: "Macintosh HD (mock)", dependencyState: .notChecked),
            Project(id: UUID(), client: "ACME", name: "Brand_Refresh", status: .idle,
                    lastActivity: daysAgo(41), sizeBytes: 22 * GB, fileCount: 207,
                    volumeName: "Macintosh HD (mock)", dependencyState: .resolved),
            Project(id: UUID(), client: "GLOBEX", name: "Music_Video", status: .idle,
                    lastActivity: daysAgo(37), sizeBytes: 310 * GB, fileCount: 1_420,
                    volumeName: "MOCK_Footage_SSD", dependencyState: .unresolved),
        ]

        let review = [
            ReviewItem(id: UUID(), path: "\(root)/Desktop/untitled_export_final2.mp4",
                       fileType: "Video", reason: "No client or project found in path, filename or metadata.",
                       suggestion: nil, confidence: 0.22),
            ReviewItem(id: UUID(), path: "\(root)/Downloads/acme_globex_logo_options.psd",
                       fileType: "Design", reason: "Conflicting client matches: ACME and GLOBEX.",
                       suggestion: "ACME / Brand_Refresh", confidence: 0.48),
            ReviewItem(id: UUID(), path: "\(root)/Desktop/IMG_4821.MOV",
                       fileType: "Video", reason: "Original camera filename (kept as is). Project unknown.",
                       suggestion: "INITECH / Podcast_S2", confidence: 0.35),
            ReviewItem(id: UUID(), path: "\(root)/Downloads/prompt_ideas.txt",
                       fileType: "Prompt", reason: "Looks like AI prompts, but no project is named.",
                       suggestion: nil, confidence: 0.30),
        ]

        let quarantine = [
            QuarantineItem(id: UUID(), originalPath: "\(root)/Downloads/GLOBEX_beat_v2 copy.wav",
                           keptCopyPath: "\(master)/02_SHARED_ASSETS/MUSIC/GLOBEX_beat_v2.wav",
                           sha256: "9f2c4e1a7b0d3c58e6a1f4b2d9c07e3a5b8f1d6c2e4a9b7d0f3c5e8a1b2d4f6",
                           sizeBytes: 54_000_000, quarantinedAt: daysAgo(3),
                           reason: "Byte-identical (SHA-256) to a kept copy in the shared library."),
            QuarantineItem(id: UUID(), originalPath: "\(root)/Desktop/overlay_grain(1).mov",
                           keptCopyPath: "\(master)/02_SHARED_ASSETS/OVERLAYS/overlay_grain.mov",
                           sha256: "4b7e0a9c2d5f8e1b3a6c9d0f2e5b8a1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9",
                           sizeBytes: 812_000_000, quarantinedAt: daysAgo(9),
                           reason: "Byte-identical (SHA-256) to a kept copy in the shared library."),
        ]

        let archive = [
            ArchiveSuggestion(id: UUID(), client: "ACME", project: "Brand_Refresh", inactiveDays: 41,
                              sizeBytes: 22 * GB, destination: "MOCK_Archive_HDD/Archive",
                              blockers: ["Archive drive MOCK_Archive_HDD is offline."]),
            ArchiveSuggestion(id: UUID(), client: "GLOBEX", project: "Music_Video", inactiveDays: 37,
                              sizeBytes: 310 * GB, destination: "MOCK_Archive_HDD/Archive",
                              blockers: ["Archive drive MOCK_Archive_HDD is offline.",
                                         "Project links are unresolved; media could break if moved."]),
        ]

        let activity = [
            ActivityEntry(id: UUID(), date: daysAgo(0.1), action: "Organize run (mock)",
                          detail: "6 files filed by approved rules, 3 sent to Review Inbox.",
                          outcome: .success, canUndo: true),
            ActivityEntry(id: UUID(), date: daysAgo(0.1), action: "Skipped 2 files",
                          detail: "File size was still changing (download or render in progress).",
                          outcome: .skipped, canUndo: false),
            ActivityEntry(id: UUID(), date: daysAgo(3), action: "Quarantined 1 duplicate",
                          detail: "GLOBEX_beat_v2 copy.wav: hash verified, kept copy confirmed.",
                          outcome: .success, canUndo: true),
            ActivityEntry(id: UUID(), date: daysAgo(6), action: "Archive copy not started",
                          detail: "MOCK_Archive_HDD offline. Nothing was copied or removed.",
                          outcome: .failed, canUndo: false),
        ]

        let plan = [
            PlannedOperation(id: UUID(), kind: .move,
                             source: "\(root)/Downloads/ACME_SpringLaunch_Storyboard_v03.pdf",
                             destination: "\(master)/01_ACTIVE_PROJECTS/ACME/Spring_Launch/01_BRIEF_REFERENCES/",
                             reason: "Previously approved rule: ACME briefs go to the project's brief folder.",
                             confidence: 0.96, risk: .low, isLinkedToProject: false, needsApproval: false),
            PlannedOperation(id: UUID(), kind: .rename,
                             source: "\(root)/Desktop/export.mp4",
                             destination: "ACME_SpringLaunch_Teaser_v01.mp4",
                             reason: "New export, not referenced by any project. Matched by date and recent project.",
                             confidence: 0.84, risk: .medium, isLinkedToProject: false, needsApproval: true),
            PlannedOperation(id: UUID(), kind: .quarantine,
                             source: "\(root)/Downloads/INITECH_intro_sting copy.wav",
                             destination: "\(master)/04_QUARANTINE/",
                             reason: "Byte-identical (SHA-256) to a kept copy in 02_SHARED_ASSETS/SFX.",
                             confidence: 0.99, risk: .medium, isLinkedToProject: false, needsApproval: true),
            PlannedOperation(id: UUID(), kind: .leaveInPlace,
                             source: "\(root)/Projects/NORTHWIND/Product_Demo/footage/C0042.MP4",
                             destination: nil,
                             reason: "Referenced by Product_Demo.prproj. Linked media is never moved.",
                             confidence: 1.0, risk: .noChange, isLinkedToProject: true, needsApproval: false),
            PlannedOperation(id: UUID(), kind: .leaveInPlace,
                             source: "\(root)/Desktop/untitled_export_final2.mp4",
                             destination: nil,
                             reason: "Low confidence (22%). Sent to Review Inbox; stays at its original path.",
                             confidence: 0.22, risk: .noChange, isLinkedToProject: false, needsApproval: false),
        ]

        let index = [
            SearchRecord(id: UUID(), path: "\(master)/01_ACTIVE_PROJECTS/ACME/Spring_Launch/07_EXPORTS/ACME_SpringLaunch_Teaser_v03.mp4",
                         client: "ACME", project: "Spring_Launch", fileType: "mp4",
                         tags: ["teaser", "export", "vertical"], modified: daysAgo(2)),
            SearchRecord(id: UUID(), path: "\(master)/01_ACTIVE_PROJECTS/ACME/Spring_Launch/04_DESIGN_ASSETS/ACME_SpringLaunch_Poster_v02.psd",
                         client: "ACME", project: "Spring_Launch", fileType: "psd",
                         tags: ["poster", "design"], modified: daysAgo(4)),
            SearchRecord(id: UUID(), path: "\(master)/01_ACTIVE_PROJECTS/NORTHWIND/Product_Demo/03_AUDIO/voiceover_take3.wav",
                         client: "NORTHWIND", project: "Product_Demo", fileType: "wav",
                         tags: ["voiceover", "audio"], modified: daysAgo(5)),
            SearchRecord(id: UUID(), path: "\(master)/01_ACTIVE_PROJECTS/INITECH/Podcast_S2/05_AI_ASSETS/episode4_cover_prompt.txt",
                         client: "INITECH", project: "Podcast_S2", fileType: "txt",
                         tags: ["prompt", "ai", "cover art"], modified: daysAgo(1)),
            SearchRecord(id: UUID(), path: "\(master)/02_SHARED_ASSETS/MUSIC/GLOBEX_beat_v2.wav",
                         client: "GLOBEX", project: "Shared", fileType: "wav",
                         tags: ["music", "beat", "reusable"], modified: daysAgo(37)),
            SearchRecord(id: UUID(), path: "\(master)/02_SHARED_ASSETS/OVERLAYS/overlay_grain.mov",
                         client: "Shared", project: "Shared", fileType: "mov",
                         tags: ["overlay", "film grain", "reusable"], modified: daysAgo(60)),
        ]

        return DashboardSnapshot(
            source: .mock, generatedAt: now, volumes: volumes, projects: projects,
            reviewItems: review, quarantine: quarantine, archiveSuggestions: archive,
            activity: activity, plannedOperations: plan, searchIndex: index
        )
    }
}
