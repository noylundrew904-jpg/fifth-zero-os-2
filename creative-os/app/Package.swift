// swift-tools-version:5.9
// Creative OS — free, local-first. Third-party code: GRDB.swift (MIT), pinned exactly.
// GRDB 6.29.3 is used (not 7.x) because 7.x needs a newer Xcode than macOS 13/14 can run.
import PackageDescription

let package = Package(
    name: "CreativeOS",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "CreativeOS", targets: ["CreativeOS"]),
    ],
    dependencies: [
        .package(url: "https://github.com/groue/GRDB.swift.git", exact: "6.29.3"),
    ],
    targets: [
        // Foundation-only models and logic. No SwiftUI, no file access.
        .target(name: "CreativeOSCore", path: "Sources/CreativeOSCore"),
        // Local SQLite notebook: index, rules, journal, audit log, quarantine manifest.
        // Records information only; never moves, copies or deletes files.
        .target(
            name: "CreativeOSStore",
            dependencies: ["CreativeOSCore", .product(name: "GRDB", package: "GRDB.swift")],
            path: "Sources/CreativeOSStore"
        ),
        // macOS read-only system access: drive names, IDs and capacity. No file contents.
        .target(
            name: "CreativeOSSystem",
            dependencies: ["CreativeOSCore"],
            path: "Sources/CreativeOSSystem"
        ),
        // The only code allowed to move files: approved, journaled, same-drive moves and undo,
        // inside user-approved folders only. Contains no delete code.
        .target(
            name: "CreativeOSExecutor",
            dependencies: ["CreativeOSCore", "CreativeOSStore"],
            path: "Sources/CreativeOSExecutor"
        ),
        // Read-only SHA-256 fingerprints of file contents, streamed in 1 MB pieces (Apple CryptoKit).
        .target(
            name: "CreativeOSFingerprint",
            dependencies: ["CreativeOSCore"],
            path: "Sources/CreativeOSFingerprint"
        ),
        // Read-only folder scanner: names, sizes and dates inside approved folders. Never opens files.
        .target(
            name: "CreativeOSScanner",
            dependencies: ["CreativeOSCore"],
            path: "Sources/CreativeOSScanner"
        ),
        // SwiftUI dashboard: live read-only Organize Now preview + mock sample screens.
        .executableTarget(
            name: "CreativeOS",
            // Read-only layers only. The app cannot move files yet (no executor, no store).
            dependencies: ["CreativeOSCore", "CreativeOSScanner", "CreativeOSSystem"],
            path: "Sources/CreativeOS"
        ),
        .testTarget(
            name: "CreativeOSCoreTests",
            dependencies: ["CreativeOSCore"],
            path: "Tests/CreativeOSCoreTests"
        ),
        .testTarget(
            name: "CreativeOSStoreTests",
            dependencies: ["CreativeOSStore", "CreativeOSCore", .product(name: "GRDB", package: "GRDB.swift")],
            path: "Tests/CreativeOSStoreTests"
        ),
        .testTarget(
            name: "CreativeOSSystemTests",
            dependencies: ["CreativeOSSystem", "CreativeOSCore"],
            path: "Tests/CreativeOSSystemTests"
        ),
        .testTarget(
            name: "CreativeOSExecutorTests",
            dependencies: ["CreativeOSExecutor", "CreativeOSStore", "CreativeOSCore"],
            path: "Tests/CreativeOSExecutorTests"
        ),
        .testTarget(
            name: "CreativeOSFingerprintTests",
            dependencies: ["CreativeOSFingerprint", "CreativeOSCore"],
            path: "Tests/CreativeOSFingerprintTests"
        ),
        .testTarget(
            name: "CreativeOSScannerTests",
            dependencies: ["CreativeOSScanner", "CreativeOSCore"],
            path: "Tests/CreativeOSScannerTests"
        ),
    ]
)
