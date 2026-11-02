import SwiftUI
import AppKit
import CreativeOSCore

enum SidebarItem: String, CaseIterable, Identifiable, Hashable {
    case overview, projects, drives, review, quarantine, archive, activity, search, settings

    var id: String { rawValue }

    var title: String {
        switch self {
        case .overview: return "Overview"
        case .projects: return "Campaigns"
        case .drives: return "Drives & Storage"
        case .review: return "Review Inbox"
        case .quarantine: return "Duplicate Quarantine"
        case .archive: return "Archive Suggestions"
        case .activity: return "Activity & Undo"
        case .search: return "Search"
        case .settings: return "Settings"
        }
    }

    var icon: String {
        switch self {
        case .overview: return "square.grid.2x2"
        case .projects: return "folder"
        case .drives: return "externaldrive"
        case .review: return "tray"
        case .quarantine: return "doc.on.doc"
        case .archive: return "archivebox"
        case .activity: return "clock.arrow.circlepath"
        case .search: return "magnifyingglass"
        case .settings: return "gearshape"
        }
    }
}

struct RootView: View {
    @State private var snapshot = MockData.make()
    @State private var selection: SidebarItem? = .overview

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("Creative OS") {
                    ForEach(SidebarItem.allCases) { item in
                        Label(item.title, systemImage: item.icon)
                            .badge(badge(for: item))
                            .tag(item)
                    }
                }
            }
            .navigationSplitViewColumnWidth(min: 200, ideal: 220)
        } detail: {
            VStack(spacing: 0) {
                MockBanner()
                detail(for: selection ?? .overview)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .background(Color(nsColor: .windowBackgroundColor))
        }
    }

    private func badge(for item: SidebarItem) -> Int {
        switch item {
        case .review: return snapshot.reviewItems.count
        case .quarantine: return snapshot.quarantine.count
        case .archive: return snapshot.archiveSuggestions.count
        default: return 0
        }
    }

    @ViewBuilder
    private func detail(for item: SidebarItem) -> some View {
        switch item {
        case .overview: OverviewView(snapshot: snapshot, selection: $selection)
        case .projects: ProjectsView(snapshot: snapshot)
        case .drives: DrivesView(snapshot: snapshot)
        case .review: ReviewInboxView(snapshot: snapshot)
        case .quarantine: QuarantineView(snapshot: snapshot)
        case .archive: ArchiveView(snapshot: snapshot)
        case .activity: ActivityView(snapshot: snapshot)
        case .search: SearchView(snapshot: snapshot)
        case .settings: SettingsView()
        }
    }
}
