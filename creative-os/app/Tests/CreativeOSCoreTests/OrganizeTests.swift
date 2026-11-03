import XCTest
@testable import CreativeOSCore

/// Fictional paths only; nothing touches the disk.
final class ClassifierTests: XCTestCase {
    private let root = "/Practice/Inbox"
    private let knowledge = ClassifierKnowledge(clients: [
        .init(name: "AMINTIRI", aliases: ["Amintiri Cafe"], campaigns: ["Coffee_Campaign": ["coffee"], "Winter_Menu": []]),
        .init(name: "ACME", campaigns: ["Spring_Launch": []]),
    ])

    private func classify(_ relative: String) -> ClassificationResult {
        Classifier.classify(path: root + "/" + relative, root: root, knowledge: knowledge)
    }

    func testTokens() {
        XCTAssertEqual(Classifier.tokens("ACME_SpringLaunch-Teaser v02"), ["acme", "spring", "launch", "teaser", "v", "02"])
        XCTAssertEqual(Classifier.tokens("Reel01"), ["reel", "01"])
    }

    func testExportFromFolderAndFilename() throws {
        let r = classify("AMINTIRI/Coffee_Campaign/AMINTIRI_coffee_Reel_01_v02.mp4")
        let c = try XCTUnwrap(r.classification, "\(r.missing)")
        XCTAssertEqual(c.location, OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: "Reel_01",
                                                     purpose: .exports, exportFormat: .instagramReels, stage: .revisions))
        XCTAssertGreaterThanOrEqual(c.confidence, 0.8)
        XCTAssertFalse(r.reasons.isEmpty)
    }

    func testMultiWordNamesMatchInAnySpelling() throws {
        for name in ["ACME_SpringLaunch_Teaser_01.mov", "acme spring launch teaser 1.mov", "ACME-Spring_Launch-Teaser01.mov"] {
            let c = try XCTUnwrap(classify(name).classification, name)
            XCTAssertEqual(c.location.campaign, "Spring_Launch", name)
            XCTAssertEqual(c.location.deliverable, "Teaser_01", name)
        }
    }

    func testCameraOriginalGoesToSharedCampaignFootage() throws {
        let c = try XCTUnwrap(classify("AMINTIRI/Coffee_Campaign/Card_A/C0042.MP4").classification)
        XCTAssertEqual(c.location.purpose, .sourceFootage)
        XCTAssertNil(c.location.deliverable)
    }

    func testFinalInNameNeverMeansFinalsFolder() throws {
        let c = try XCTUnwrap(classify("ACME/Spring_Launch/ACME_Spring_Launch_Reel_02_FINAL_approved_v07.mp4").classification)
        XCTAssertEqual(c.location.stage, .revisions)
    }

    func testFormatDetection() throws {
        XCTAssertEqual(classify("ACME/Spring_Launch/Story_01_v01.mp4").classification?.location.exportFormat, .stories)
        XCTAssertEqual(classify("ACME/Spring_Launch/Reel_03_WhatsApp.mp4").classification?.location.exportFormat, .whatsApp)
        XCTAssertEqual(classify("ACME/Spring_Launch/Spot_01_master.mov").classification?.location.exportFormat, .masters)
    }

    func testNoClientMeansReview() {
        let r = classify("Desktop/untitled_export_final2.mp4")
        XCTAssertNil(r.classification)
        XCTAssertFalse(r.missing.isEmpty)
    }

    func testTwoClientsMeansReview() {
        let r = classify("ACME/amintiri_logo_options_Poster_01.psd")
        XCTAssertNil(r.classification)
        XCTAssertTrue(r.missing.first?.contains("more than one client") ?? false)
    }

    func testUnknownCampaignIsNotGuessed() {
        let r = classify("AMINTIRI/Summer_Pop_Up/Reel_01.mp4")
        XCTAssertNil(r.classification)
        XCTAssertTrue(r.missing.first?.contains("won't guess") ?? false)
    }

    func testMissingDeliverableMeansReview() {
        XCTAssertNil(classify("ACME/Spring_Launch/teaser_cut.mp4").classification)
    }

    func testExtensionAloneIsNeverEnough() {
        XCTAssertNil(classify("random_folder/clip.mov").classification)
    }

    func testBriefAndPromptAndFontHandling() {
        XCTAssertEqual(classify("ACME/Spring_Launch/ACME_brief.pdf").classification?.location.purpose, .briefReferences)
        XCTAssertEqual(classify("ACME/Spring_Launch/Reel_01/hero_prompt.txt").classification?.location.purpose, .aiAssets)
        XCTAssertNil(classify("ACME/Spring_Launch/Brand.otf").classification)
    }
}

final class DryRunTests: XCTestCase {
    private let root = "/Practice/Inbox"
    private let knowledge = ClassifierKnowledge(clients: [.init(name: "ACME", campaigns: ["Spring_Launch": []])])
    private let context = PlannerContext(clientsRoot: "/Practice/Creative_Master/01_CLIENTS",
                                         clientsRootVolumeID: "mac", onlineVolumeIDs: ["mac"])

    private func file(_ relative: String, stable: Bool = true) -> ScannedFile {
        ScannedFile(path: root + "/" + relative, root: root, volumeID: "mac", sizeBytes: 10,
                    modifiedAt: Date(timeIntervalSince1970: 0), isStable: stable)
    }

    func testMediaNextToProjectFileStaysInPlace() {
        let report = DryRun.build(scan: [
            file("ACME/Spring_Launch/Edit/Spring.prproj"),
            file("ACME/Spring_Launch/Edit/Media/Teaser_01_v01.mp4"),
            file("ACME/Spring_Launch/Exports/Teaser_01_v02.mp4"),
        ], knowledge: knowledge, context: context)
        XCTAssertEqual(report.items[0].action.kind, .leaveInPlace(.linkUnknown))
        XCTAssertEqual(report.items[1].action.kind, .leaveInPlace(.linkUnknown))
        guard case .move = report.items[2].action.kind else { return XCTFail("\(report.items[2].action)") }
    }

    func testSummaryCountsAndNothingChangedWording() {
        let report = DryRun.build(scan: [
            file("ACME/Spring_Launch/Teaser_01_v01.mp4"),
            file("Desktop/mystery.mov"),
            file("ACME/Spring_Launch/Teaser_02_v01.mp4", stable: false),
        ], knowledge: knowledge, context: context)
        XCTAssertEqual(report.moves.count, 1)
        XCTAssertEqual(report.reviewInbox.count, 1)
        XCTAssertEqual(report.skipped.count, 1)
        XCTAssertTrue(report.summary.contains("Nothing has been changed"))
        XCTAssertFalse(report.reviewInbox[0].missing.isEmpty)
    }

    func testEveryMoveNeedsApprovalWithoutApprovedRules() {
        let report = DryRun.build(scan: [file("ACME/Spring_Launch/Teaser_01_v01.mp4")], knowledge: knowledge, context: context)
        XCTAssertTrue(report.moves.allSatisfy { $0.action.requiresApproval })
    }
}
