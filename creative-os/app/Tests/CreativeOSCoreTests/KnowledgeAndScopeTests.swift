import XCTest
@testable import CreativeOSCore

final class KnowledgeTextTests: XCTestCase {
    func testExampleParses() {
        let parsed = KnowledgeText.parse(KnowledgeText.example)
        XCTAssertTrue(parsed.problems.isEmpty, "\(parsed.problems)")
        XCTAssertEqual(parsed.clientCount, 2)
        XCTAssertEqual(parsed.campaignCount, 3)
        let amintiri = parsed.knowledge.clients.first { $0.name == "AMINTIRI" }
        XCTAssertEqual(amintiri?.aliases, ["Amintiri Cafe"])
        XCTAssertEqual(Set(amintiri?.campaigns.keys.map { $0 } ?? []), ["Coffee_Campaign", "Winter_Menu"])
    }

    func testProblemsAreExplainedPerLine() {
        let parsed = KnowledgeText.parse("""
            ACME Spring_Launch
            : Lonely_Campaign
            GLOBEX:
            ACME: A
            acme: B
            """)
        XCTAssertEqual(parsed.clientCount, 1)
        XCTAssertEqual(parsed.problems.count, 4)
        XCTAssertTrue(parsed.problems[0].hasPrefix("Line 1"))
        XCTAssertTrue(parsed.problems[3].contains("twice"))
    }

    func testParsedKnowledgeDrivesTheClassifier() {
        let knowledge = KnowledgeText.parse("AMINTIRI (AMT): Coffee_Campaign").knowledge
        let r = Classifier.classify(path: "/P/AMT/Coffee_Campaign/Reel_01_v01.mp4", root: "/P", knowledge: knowledge)
        XCTAssertEqual(r.classification?.location.client, "AMINTIRI")
    }
}

final class ScopeRulesTests: XCTestCase {
    private let home = "/Users/maya"

    func testTooBroadOrSystemFoldersAreRefused() {
        for folder in ["/", "/Users", "/Volumes", "/Users/maya", "/Users/maya/Library/Caches", "/System/Library",
                       "/Applications/Premiere.app", "/Users/maya/.Trash"] {
            XCTAssertNotNil(ScopeRules.problem(with: folder, home: home), folder)
        }
    }

    func testCreativeFoldersAreAllowed() {
        for folder in ["/Users/maya/Desktop", "/Users/maya/Movies/Clients", "/Volumes/Footage SSD/Projects"] {
            XCTAssertNil(ScopeRules.problem(with: folder, home: home), folder)
        }
    }

    func testSourceAndMasterMustNotOverlap() {
        XCTAssertNotNil(ScopeRules.overlapProblem(source: "/U/m/Creative_Master", master: "/U/m/Creative_Master"))
        XCTAssertNotNil(ScopeRules.overlapProblem(source: "/U/m/Creative_Master/01_CLIENTS", master: "/U/m/Creative_Master"))
        XCTAssertNil(ScopeRules.overlapProblem(source: "/U/m/Desktop", master: "/U/m/Creative_Master"))
    }
}
