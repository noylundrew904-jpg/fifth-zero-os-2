import XCTest
@testable import CreativeOSCore

/// Fictional drives only.
final class VolumeRegistryTests: XCTestCase {
    private let GB: Int64 = 1_000_000_000

    private func ssd(name: String = "Footage SSD", path: String = "/Volumes/Footage SSD",
                     uuid: String? = "aaaa-1111", free: Int64 = 500_000_000_000) -> VolumeInfo {
        VolumeInfo(uuid: uuid, name: name, mountPath: path, totalBytes: 2_000 * GB, availableBytes: free,
                   format: "APFS", isRemovable: true)
    }

    func testIdentityUsesUUIDCaseInsensitively() {
        let id = VolumeIdentity.of(ssd(uuid: "aaaa-1111"))
        XCTAssertEqual(id, VolumeIdentity(id: "uuid:AAAA-1111", isStable: true))
        XCTAssertEqual(VolumeIdentity.of(ssd(uuid: "AAAA-1111")), id)
    }

    func testDriveWithoutUUIDGetsUnstableIdentity() {
        XCTAssertFalse(VolumeIdentity.of(ssd(uuid: nil)).isStable)
        XCTAssertFalse(VolumeIdentity.of(ssd(uuid: "  ")).isStable)
    }

    func testRecognisedByIDAfterRenameAndNewMountPath() {
        let reg = RegisteredVolume(id: "uuid:AAAA-1111", name: "Footage SSD", role: "Footage")
        let moved = ssd(name: "Footage SSD 2", path: "/Volumes/Footage SSD 1")
        let result = VolumeRegistry.resolve(registered: [reg], mounted: [moved])
        XCTAssertEqual(result.statuses[reg.id], .online(moved))
        XCTAssertEqual(result.notes.count, 1)
    }

    func testDisconnectedDriveIsOffline() {
        let reg = RegisteredVolume(id: "uuid:AAAA-1111", name: "Footage SSD", role: "Footage")
        let other = ssd(name: "Other", path: "/Volumes/Other", uuid: "bbbb-2222")
        let result = VolumeRegistry.resolve(registered: [reg], mounted: [other])
        XCTAssertEqual(result.statuses[reg.id], .offline)
        XCTAssertEqual(result.unregisteredEligible, [other])
    }

    func testClonedDrivesAreAmbiguousAndUnused() {
        let reg = RegisteredVolume(id: "uuid:AAAA-1111", name: "Footage SSD", role: "Footage")
        let a = ssd(path: "/Volumes/Footage SSD")
        let b = ssd(path: "/Volumes/Footage SSD 1")
        let result = VolumeRegistry.resolve(registered: [reg], mounted: [a, b])
        XCTAssertEqual(result.statuses[reg.id], .ambiguous(mountPaths: ["/Volumes/Footage SSD", "/Volumes/Footage SSD 1"]))
        XCTAssertNil(VolumeRegistry.absolutePath(relative: "a.mov", onVolume: reg.id, statuses: result.statuses))
    }

    func testIneligibleDrivesAreNotOffered() {
        let network = VolumeInfo(uuid: "n", name: "NAS", mountPath: "/Volumes/NAS", totalBytes: 1, availableBytes: 1, isLocal: false)
        let image = VolumeInfo(uuid: "i", name: "Installer", mountPath: "/Volumes/Installer", totalBytes: 1, availableBytes: 0, isReadOnly: true)
        let hidden = VolumeInfo(uuid: "h", name: "Preboot", mountPath: "/System/Volumes/Preboot", totalBytes: 1, availableBytes: 1, isBrowsable: false)
        let result = VolumeRegistry.resolve(registered: [], mounted: [network, image, hidden])
        XCTAssertTrue(result.unregisteredEligible.isEmpty)
        XCTAssertEqual(VolumeRules.eligibility(ssd()), .eligible)
    }

    func testTinySystemVolumesAndLookAlikesAreNotOffered() {
        let cryptex = VolumeInfo(uuid: "c", name: "Cryptex", mountPath: "/Volumes/Cryptex",
                                 totalBytes: 4_194_304, availableBytes: 3_137_536)
        let twinA = ssd(name: "Twin", path: "/Volumes/Twin", uuid: "same")
        let twinB = ssd(name: "Twin", path: "/Volumes/Twin 1", uuid: "same")
        let result = VolumeRegistry.resolve(registered: [], mounted: [cryptex, twinA, twinB, ssd()])
        XCTAssertEqual(result.unregisteredEligible, [ssd()])
    }

    func testAbsolutePathOnlyWhenOnlineAndSafe() {
        let reg = RegisteredVolume(id: "uuid:AAAA-1111", name: "Footage SSD", role: "Footage")
        let online = VolumeRegistry.resolve(registered: [reg], mounted: [ssd()]).statuses
        XCTAssertEqual(VolumeRegistry.absolutePath(relative: "Clients/A/clip.mov", onVolume: reg.id, statuses: online),
                       "/Volumes/Footage SSD/Clients/A/clip.mov")
        XCTAssertNil(VolumeRegistry.absolutePath(relative: "../Other/clip.mov", onVolume: reg.id, statuses: online))
        XCTAssertNil(VolumeRegistry.absolutePath(relative: "", onVolume: reg.id, statuses: online))
        let offline = VolumeRegistry.resolve(registered: [reg], mounted: []).statuses
        XCTAssertNil(VolumeRegistry.absolutePath(relative: "Clients/A/clip.mov", onVolume: reg.id, statuses: offline))
    }

    func testRelativePath() {
        XCTAssertEqual(VolumeRegistry.relativePath(of: "/Volumes/SSD/a/b.mov", mountPath: "/Volumes/SSD"), "a/b.mov")
        XCTAssertNil(VolumeRegistry.relativePath(of: "/Volumes/SSD2/a.mov", mountPath: "/Volumes/SSD"))
        XCTAssertEqual(VolumeRegistry.relativePath(of: "/Users/x/a.mov", mountPath: "/"), "Users/x/a.mov")
        XCTAssertNil(VolumeRegistry.relativePath(of: "/Volumes/SSD", mountPath: "/Volumes/SSD"))
    }

    func testCapacityCheckNeedsOnlineDriveAndMargin() {
        let reg = RegisteredVolume(id: "uuid:AAAA-1111", name: "Footage SSD", role: "Footage")
        let online = VolumeRegistry.resolve(registered: [reg], mounted: [ssd(free: 10 * GB)]).statuses
        XCTAssertTrue(VolumeRegistry.canFit(bytes: 5 * GB, onVolume: reg.id, statuses: online))
        XCTAssertFalse(VolumeRegistry.canFit(bytes: 10 * GB, onVolume: reg.id, statuses: online))
        XCTAssertFalse(VolumeRegistry.canFit(bytes: 1, onVolume: reg.id, statuses: [:]))
    }
}
