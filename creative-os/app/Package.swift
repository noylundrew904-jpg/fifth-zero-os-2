// swift-tools-version:5.9
// Creative OS — no third-party dependencies yet. GRDB.swift (MIT) arrives in Milestone 4.
import PackageDescription

let package = Package(
    name: "CreativeOS",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "CreativeOS", targets: ["CreativeOS"]),
    ],
    targets: [
        // Foundation-only models and logic. No SwiftUI, no file access.
        .target(name: "CreativeOSCore", path: "Sources/CreativeOSCore"),
        // SwiftUI dashboard.
        .executableTarget(
            name: "CreativeOS",
            dependencies: ["CreativeOSCore"],
            path: "Sources/CreativeOS"
        ),
        .testTarget(
            name: "CreativeOSCoreTests",
            dependencies: ["CreativeOSCore"],
            path: "Tests/CreativeOSCoreTests"
        ),
    ]
)
