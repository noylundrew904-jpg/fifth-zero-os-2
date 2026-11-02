import SwiftUI
import AppKit

@main
struct CreativeOSApp: App {
    init() {
        // Lets the window come to the front when launched with `swift run`
        // (no .app bundle yet; packaging is Milestone 9).
        NSApplication.shared.setActivationPolicy(.regular)
    }

    var body: some Scene {
        WindowGroup("Creative OS") {
            RootView()
                .preferredColorScheme(.dark)
                .frame(minWidth: 980, minHeight: 640)
                .onAppear { NSApplication.shared.activate(ignoringOtherApps: true) }
        }
        .windowToolbarStyle(.unified)
    }
}
