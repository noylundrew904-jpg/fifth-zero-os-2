#if os(macOS)
import XCTest
import CreativeOSCore
@testable import CreativeOSSystem

/// Runs against the machine running the tests (the GitHub-hosted Mac in CI).
/// Reads drive metadata only.
final class MountedVolumeReaderTests: XCTestCase {
    func testStartupDiskIsFoundAndUsable() throws {
        let volumes = MountedVolumeReader.currentVolumes()
        for v in volumes {
            print("VOLUME name=\(v.name) path=\(v.mountPath) root=\(v.isRootFileSystem) uuid=\(v.uuid ?? "nil") "
                  + "readOnly=\(v.isReadOnly) local=\(v.isLocal) internal=\(v.isInternal) "
                  + "total=\(v.totalBytes) free=\(v.availableBytes) eligibility=\(VolumeRules.eligibility(v))")
        }
        let root = try XCTUnwrap(volumes.first { $0.mountPath == "/" }, "No startup disk listed")
        XCTAssertTrue(root.isRootFileSystem)
        XCTAssertTrue(VolumeIdentity.of(root).isStable, "Startup disk has no UUID")
        XCTAssertGreaterThan(root.totalBytes, 0)
        XCTAssertGreaterThan(root.availableBytes, 0)
        XCTAssertEqual(VolumeRules.eligibility(root), .eligible)
    }

    func testIdentityIsStableAcrossReads() {
        let first = MountedVolumeReader.currentVolumes().map { VolumeIdentity.of($0).id }.sorted()
        let second = MountedVolumeReader.currentVolumes().map { VolumeIdentity.of($0).id }.sorted()
        XCTAssertEqual(first, second)
    }
}
#endif
