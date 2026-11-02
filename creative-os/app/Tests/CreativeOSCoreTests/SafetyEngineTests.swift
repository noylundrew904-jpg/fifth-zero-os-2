import XCTest
@testable import CreativeOSCore

// All paths below are fictional strings. These tests never touch the disk.

final class HierarchyTests: XCTestCase {
    func testExportPathFollowsLockedModel() {
        let loc = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: "Reel_01",
                                    purpose: .exports, exportFormat: .instagramReels, stage: .revisions)
        XCTAssertEqual(try loc.folderComponents().get(),
                       ["AMINTIRI", "Coffee_Campaign", "Reel_01", "Exports", "Instagram_Reels", "Revisions"])
    }

    func testSourceFootageIsSharedAtCampaignLevel() {
        let shared = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: nil,
                                       purpose: .sourceFootage)
        XCTAssertEqual(try shared.folderComponents().get(), ["AMINTIRI", "Coffee_Campaign", "Source_Footage"])

        let perDeliverable = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign",
                                               deliverable: "Reel_01", purpose: .sourceFootage)
        XCTAssertEqual(perDeliverable.folderComponents(), .failure(.deliverableNotAllowed))
    }

    func testFinalsFolderRequiresConfirmation() {
        let loc = OrganizedLocation(client: "A", campaign: "B", deliverable: "C",
                                    purpose: .exports, exportFormat: .masters, stage: .finals)
        XCTAssertEqual(loc.folderComponents(), .failure(.finalsRequireConfirmation))
        XCTAssertNoThrow(try loc.folderComponents(finalConfirmed: true).get())
    }

    func testExportsNeedFormatAndStage() {
        let loc = OrganizedLocation(client: "A", campaign: "B", deliverable: "C", purpose: .exports)
        XCTAssertEqual(loc.folderComponents(), .failure(.exportDetailsRequired))
    }

    func testTraversalNamesAreRejected() {
        let loc = OrganizedLocation(client: "..", campaign: "B", deliverable: "C", purpose: .audio)
        XCTAssertEqual(loc.folderComponents(), .failure(.invalidName("..")))
    }
}

final class PathSafetyTests: XCTestCase {
    func testSanitizeComponent() {
        XCTAssertEqual(PathSafety.sanitizeComponent("Coffee/Campaign"), "Coffee_Campaign")
        XCTAssertEqual(PathSafety.sanitizeComponent("  .hidden "), "hidden")
        XCTAssertNil(PathSafety.sanitizeComponent(".."))
        XCTAssertNil(PathSafety.sanitizeComponent("   "))
        XCTAssertNil(PathSafety.sanitizeComponent(String(repeating: "a", count: 256)))
    }

    func testUnicodeIsNormalized() {
        let decomposed = "Cafe\u{0301}"   // e + combining accent
        let composed = "Caf\u{00E9}"
        XCTAssertEqual(PathSafety.sanitizeComponent(decomposed), composed)
        XCTAssertTrue(PathSafety.isContained("/X/\(decomposed)/file", in: "/X/\(composed)"))
    }

    func testNormalizationAndContainment() {
        XCTAssertEqual(PathSafety.normalizedAbsolute("/a/./b//c/../d"), "/a/b/d")
        XCTAssertNil(PathSafety.normalizedAbsolute("relative/path"))
        XCTAssertNil(PathSafety.normalizedAbsolute("/../etc"))
        XCTAssertTrue(PathSafety.isContained("/Root/Clients/A", in: "/Root/Clients"))
        XCTAssertFalse(PathSafety.isContained("/Root/ClientsEvil/A", in: "/Root/Clients"))
        XCTAssertFalse(PathSafety.isContained("/Root/Clients/../Other", in: "/Root/Clients"))
    }

    func testJoinRejectsUnsafeComponents() {
        XCTAssertEqual(PathSafety.join("/R", ["A", "B"]), "/R/A/B")
        XCTAssertNil(PathSafety.join("/R", ["..", "B"]))
        XCTAssertNil(PathSafety.join("/R", ["A/B"]))
    }
}

final class NamingTests: XCTestCase {
    func testSuggestedName() {
        XCTAssertEqual(Naming.suggestedName(client: "Amintiri", campaign: "Coffee Campaign",
                                            deliverable: "Reel 01", version: 3, ext: "MP4"),
                       "AMINTIRI_CoffeeCampaign_Reel01_v03.mp4")
    }

    func testVersionParsingAndNext() {
        XCTAssertEqual(Naming.version(in: "Teaser_v03.mp4"), 3)
        XCTAssertEqual(Naming.version(in: "Teaser v12.mov"), 12)
        XCTAssertNil(Naming.version(in: "Teaser_final.mp4"))
        XCTAssertEqual(Naming.nextVersion(existing: ["A_v01.mp4", "A_v07.mp4", "notes.txt"]), 8)
        XCTAssertEqual(Naming.nextVersion(existing: []), 1)
    }

    func testCollisionNeverOverwrites() {
        let taken: Set<String> = ["clip.mov", "Clip (2).mov"]
        XCTAssertEqual(Naming.uniqueName("CLIP.mov", taken: taken), "CLIP (3).mov")
        XCTAssertEqual(Naming.uniqueName("new.mov", taken: taken), "new.mov")
        XCTAssertEqual(Naming.uniqueName("README", taken: ["readme"]), "README (2)")
    }

    func testCameraOriginalsDetected() {
        for name in ["IMG_4821.MOV", "C0042.MP4", "GOPR0012.MP4", "DSC_1234.JPG", "A001C003_220101.mov"] {
            XCTAssertTrue(Naming.isCameraOriginal(name), name)
        }
        for name in ["ACME_Teaser_v01.mp4", "export.mp4"] {
            XCTAssertFalse(Naming.isCameraOriginal(name), name)
        }
    }
}

final class ApprovalAndStatusTests: XCTestCase {
    func testFinalWordsAreOnlyASuggestion() {
        let s = FinalApproval.suggest(filename: "Reel_final_FINAL_approved.mp4", isHighestVersion: false, sentToClient: false)
        XCTAssertTrue(s.isSuggested)
        let record = ExportRecord(filename: "Reel_final_FINAL_approved.mp4")
        XCTAssertEqual(record.approval, .notApproved)
        XCTAssertNotEqual(FinalApproval.stage(version: 9, approval: record.approval), .finals)
    }

    func testOnlyExplicitConfirmationMakesFinal() {
        var record = ExportRecord(filename: "Reel_v04.mp4")
        record.confirmFinal(at: Date(timeIntervalSince1970: 0))
        XCTAssertEqual(FinalApproval.stage(version: 4, approval: record.approval), .finals)
        record.revokeFinal()
        XCTAssertEqual(FinalApproval.stage(version: 4, approval: record.approval), .revisions)
        XCTAssertEqual(FinalApproval.stage(version: 1, approval: record.approval), .drafts)
    }

    func testSuggestedCompletedDoesNotStartPackaging() {
        let now = Date(timeIntervalSince1970: 100 * 86_400)
        var state = StatusState()
        state.suggest(StatusSuggester.suggest(lastActivity: now.addingTimeInterval(-20 * 86_400),
                                              now: now, hasConfirmedFinal: true))
        XCTAssertEqual(state.suggested, .completed)
        XCTAssertFalse(state.canStartCollectAndPackage)
        state.confirm(.completed)
        XCTAssertTrue(state.canStartCollectAndPackage)
    }
}

final class StorageAndDuplicateTests: XCTestCase {
    private let GB: Int64 = 1_000_000_000

    func testLowSpaceThresholdIsLargerOf15PercentOr50GB() {
        XCTAssertEqual(StorageRules.lowSpaceThreshold(totalBytes: 1_000 * GB), 150 * GB)
        XCTAssertEqual(StorageRules.lowSpaceThreshold(totalBytes: 200 * GB), 50 * GB)
        XCTAssertTrue(StorageRules.isLowOnSpace(totalBytes: 1_000 * GB, freeBytes: 120 * GB))
        XCTAssertFalse(StorageRules.isLowOnSpace(totalBytes: 1_000 * GB, freeBytes: 200 * GB))
        XCTAssertFalse(StorageRules.canFit(bytes: 10 * GB, freeBytes: 10 * GB))
    }

    private let hashA = String(repeating: "a", count: 64)
    private let hashB = String(repeating: "b", count: 64)

    func testOnlyFullHashMatchCountsAsDuplicate() {
        let a = FileFingerprint(sizeBytes: 10, sha256: hashA)
        XCTAssertTrue(DuplicateRules.areByteIdentical(a, FileFingerprint(sizeBytes: 10, sha256: hashA.uppercased())))
        XCTAssertFalse(DuplicateRules.areByteIdentical(a, FileFingerprint(sizeBytes: 10, sha256: hashB)))
        XCTAssertFalse(DuplicateRules.areByteIdentical(a, FileFingerprint(sizeBytes: 11, sha256: hashA)))
        XCTAssertFalse(DuplicateRules.areByteIdentical(a, FileFingerprint(sizeBytes: 10, sha256: nil)))
        XCTAssertFalse(DuplicateRules.areByteIdentical(FileFingerprint(sizeBytes: 10, sha256: "abc"),
                                                       FileFingerprint(sizeBytes: 10, sha256: "abc")))
    }

    func testSizePrefilter() {
        let groups = DuplicateRules.sizeGroupsNeedingHash([5, 5, 7, 0, 0, 9, 9, 9]) { Int64($0) }
        XCTAssertEqual(groups, [[5, 5], [9, 9, 9]])
    }

    func testProtectedFilesAreNeverQuarantined() {
        let fp = FileFingerprint(sizeBytes: 10, sha256: hashA)
        let kept = DuplicateCandidate(path: "/F/lib/beat.wav", fingerprint: fp)
        let cases: [DuplicateCandidate] = [
            DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, linkState: .linked),
            DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, linkState: .unknown),
            DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, isActiveWorkingFile: true),
            DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, isLibraryMaster: true),
            DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, isVerifiedBackup: true),
            DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, volumeOnline: false),
            DuplicateCandidate(path: "/F/lib/beat.wav", fingerprint: fp),            // same file
            DuplicateCandidate(path: "/F/a.wav", fingerprint: FileFingerprint(sizeBytes: 10, sha256: hashB)),
        ]
        for c in cases {
            guard case .reviewOnly = QuarantinePolicy.decide(candidate: c, kept: kept, ruleApproved: true) else {
                return XCTFail("Protected candidate was eligible: \(c.path)")
            }
        }
        let offlineKept = DuplicateCandidate(path: "/F/lib/beat.wav", fingerprint: fp, volumeOnline: false)
        let plain = DuplicateCandidate(path: "/F/a.wav", fingerprint: fp)
        guard case .reviewOnly = QuarantinePolicy.decide(candidate: plain, kept: offlineKept, ruleApproved: true) else {
            return XCTFail("Quarantined while kept copy was offline")
        }
    }

    func testHardLinksAreNotDuplicates() {
        let fp = FileFingerprint(sizeBytes: 10, sha256: hashA)
        let a = DuplicateCandidate(path: "/F/a.wav", fingerprint: fp, fileID: 42)
        let b = DuplicateCandidate(path: "/F/b.wav", fingerprint: fp, fileID: 42)
        guard case .reviewOnly = QuarantinePolicy.decide(candidate: a, kept: b, ruleApproved: true) else {
            return XCTFail("Hard link treated as duplicate")
        }
    }

    func testEligibleDuplicateStillNeedsApprovalWithoutRule() {
        let fp = FileFingerprint(sizeBytes: 10, sha256: hashA)
        let a = DuplicateCandidate(path: "/F/a.wav", fingerprint: fp)
        let b = DuplicateCandidate(path: "/F/b.wav", fingerprint: fp)
        XCTAssertEqual(QuarantinePolicy.decide(candidate: a, kept: b, ruleApproved: false), .eligible(needsApproval: true))
        XCTAssertEqual(QuarantinePolicy.decide(candidate: a, kept: b, ruleApproved: true), .eligible(needsApproval: false))
    }

    func testRetentionOnlySuggestsAfter30Days() {
        let t0 = Date(timeIntervalSince1970: 0)
        XCTAssertFalse(QuarantinePolicy.deletionSuggestionDue(quarantinedAt: t0, now: t0.addingTimeInterval(29 * 86_400)))
        XCTAssertTrue(QuarantinePolicy.deletionSuggestionDue(quarantinedAt: t0, now: t0.addingTimeInterval(30 * 86_400)))
        XCTAssertFalse(QuarantinePolicy.deletionSuggestionDue(quarantinedAt: t0, now: t0.addingTimeInterval(999 * 86_400),
                                                              retentionDays: 0))
    }
}

final class ActionPlannerTests: XCTestCase {
    private let root = "/Fixture/Creative_Master/01_CLIENTS"
    private let reelLocation = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: "Reel_01",
                                                 purpose: .exports, exportFormat: .instagramReels, stage: .drafts)

    private func context(online: Set<String> = ["mac", "ssd"], rules: Set<String> = ["r1"],
                         existing: [String: Set<String>] = [:]) -> PlannerContext {
        PlannerContext(clientsRoot: root, clientsRootVolumeID: "mac", onlineVolumeIDs: online,
                       approvedRuleIDs: rules, confidenceThreshold: 0.8, existingNames: existing)
    }

    private func file(_ path: String, volume: String = "mac", stable: Bool = true, link: LinkState = .notLinked,
                      confidence: Double = 0.95, rule: String? = "r1", location: OrganizedLocation? = nil) -> FileFacts {
        FileFacts(path: path, volumeID: volume, sizeBytes: 100, isStable: stable, linkState: link,
                  classification: Classification(location: location ?? reelLocation, confidence: confidence, ruleID: rule))
    }

    private let reelFolder = "/Fixture/Creative_Master/01_CLIENTS/AMINTIRI/Coffee_Campaign/Reel_01/Exports/Instagram_Reels/Drafts"

    func testApprovedRuleSameVolumeIsLowRiskAutoAction() {
        let plan = ActionPlanner.plan([file("/Fixture/Downloads/reel.mp4")], context: context())
        XCTAssertEqual(plan.first?.kind, .move(destinationPath: reelFolder + "/reel.mp4", crossVolume: false))
        XCTAssertEqual(plan.first?.risk, .low)
        XCTAssertEqual(plan.first?.requiresApproval, false)
    }

    func testUnapprovedRuleNeedsApproval() {
        let plan = ActionPlanner.plan([file("/Fixture/Downloads/reel.mp4", rule: "unknown")], context: context())
        XCTAssertEqual(plan.first?.requiresApproval, true)
    }

    func testLinkedAndUnknownLinksStayInPlace() {
        let plan = ActionPlanner.plan([file("/Fixture/a.mp4", link: .linked), file("/Fixture/b.mp4", link: .unknown)],
                                      context: context())
        XCTAssertEqual(plan.map(\.kind), [.leaveInPlace(.linkedToProject), .leaveInPlace(.linkUnknown)])
    }

    func testLowConfidenceGoesToReviewInbox() {
        let plan = ActionPlanner.plan([file("/Fixture/a.mp4", confidence: 0.5)], context: context())
        XCTAssertEqual(plan.first?.kind, .leaveInPlace(.lowConfidence(0.5)))
    }

    func testUnstableFileIsSkipped() {
        let plan = ActionPlanner.plan([file("/Fixture/a.mp4", stable: false)], context: context())
        XCTAssertEqual(plan.first?.kind, .skip(.stillChanging))
    }

    func testOfflineDrivesAreSkippedWithoutFallback() {
        let srcOffline = ActionPlanner.plan([file("/Volumes/SSD/a.mp4", volume: "ssd")], context: context(online: ["mac"]))
        XCTAssertEqual(srcOffline.first?.kind, .skip(.sourceVolumeOffline))
        let destOffline = ActionPlanner.plan([file("/Volumes/SSD/a.mp4", volume: "ssd")], context: context(online: ["ssd"]))
        XCTAssertEqual(destOffline.first?.kind, .skip(.destinationOffline))
    }

    func testCrossVolumeMoveIsHighRiskAndNeedsApproval() {
        let plan = ActionPlanner.plan([file("/Volumes/SSD/a.mp4", volume: "ssd")], context: context())
        XCTAssertEqual(plan.first?.risk, .high)
        XCTAssertEqual(plan.first?.requiresApproval, true)
        guard case .move(_, let cross)? = plan.first?.kind else { return XCTFail("expected move") }
        XCTAssertTrue(cross)
    }

    func testCollisionsGetUniqueNamesIncludingWithinOneBatch() {
        let plan = ActionPlanner.plan(
            [file("/Fixture/one/reel.mp4"), file("/Fixture/two/reel.mp4")],
            context: context(existing: [reelFolder: ["reel.mp4"]]))
        XCTAssertEqual(plan.map(\.kind), [
            .move(destinationPath: reelFolder + "/reel (2).mp4", crossVolume: false),
            .move(destinationPath: reelFolder + "/reel (3).mp4", crossVolume: false),
        ])
        XCTAssertTrue(plan.allSatisfy { $0.requiresApproval })
    }

    func testCameraOriginalIsNeverRenamedOnCollision() {
        let footage = OrganizedLocation(client: "AMINTIRI", campaign: "Coffee_Campaign", deliverable: nil, purpose: .sourceFootage)
        let folder = "/Fixture/Creative_Master/01_CLIENTS/AMINTIRI/Coffee_Campaign/Source_Footage"
        let plan = ActionPlanner.plan([file("/Fixture/card/C0042.MP4", location: footage)],
                                      context: context(existing: [folder: ["C0042.MP4"]]))
        XCTAssertEqual(plan.first?.kind, .leaveInPlace(.protectedNameWouldCollide))
    }

    func testUnconfirmedFinalIsNotFiledAsFinal() {
        let finals = OrganizedLocation(client: "A", campaign: "B", deliverable: "C",
                                       purpose: .exports, exportFormat: .masters, stage: .finals)
        let plan = ActionPlanner.plan([file("/Fixture/C_final_APPROVED.mp4", location: finals)], context: context())
        guard case .leaveInPlace(.invalidDestination(_))? = plan.first?.kind else {
            return XCTFail("Unconfirmed final was filed")
        }
    }

    func testAlreadyOrganizedIsSkipped() {
        let plan = ActionPlanner.plan([file(reelFolder + "/reel.mp4")], context: context())
        XCTAssertEqual(plan.first?.kind, .skip(.alreadyOrganized))
    }

    /// Invariant: every move stays inside the clients root and nothing else changes files.
    func testEveryMoveStaysInsideClientsRoot() {
        let inputs = [
            file("/Fixture/a.mp4"), file("/Volumes/SSD/b.mp4", volume: "ssd"),
            file("/Fixture/c.mp4", link: .linked), file("/Fixture/d.mp4", confidence: 0.1),
            file("/Fixture/e.mp4", location: OrganizedLocation(client: "../../etc", campaign: "x",
                                                                deliverable: "y", purpose: .audio)),
        ]
        for action in ActionPlanner.plan(inputs, context: context()) {
            switch action.kind {
            case .move(let dest, let cross):
                XCTAssertTrue(PathSafety.isContained(dest, in: root), dest)
                if cross { XCTAssertTrue(action.requiresApproval) }
            case .leaveInPlace, .skip:
                XCTAssertEqual(action.risk, .noChange)
                XCTAssertFalse(action.requiresApproval)
            }
        }
    }
}
