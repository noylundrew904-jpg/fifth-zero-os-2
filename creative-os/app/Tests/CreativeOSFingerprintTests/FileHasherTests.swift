#if canImport(CryptoKit)
import CryptoKit
import XCTest
import CreativeOSCore
@testable import CreativeOSFingerprint

/// Works only on practice files inside a throwaway folder in the system temp directory.
final class FileHasherTests: XCTestCase {
    private let fm = FileManager.default
    private var dir = ""

    override func setUpWithError() throws {
        dir = fm.temporaryDirectory.path + "/CreativeOSHashTest-\(UUID().uuidString)"
        try fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        if dir.hasPrefix(fm.temporaryDirectory.path + "/CreativeOSHashTest-") { try? fm.removeItem(atPath: dir) }
    }

    @discardableResult
    private func write(_ name: String, _ data: Data) -> String {
        let path = dir + "/" + name
        XCTAssertTrue(fm.createFile(atPath: path, contents: data))
        return path
    }

    /// Deterministic pseudo-random bytes (no randomness, so failures are reproducible).
    private func bytes(_ count: Int, seed: UInt8 = 7) -> Data {
        var data = Data(count: count)
        var x = seed
        for i in 0..<count {
            x = x &* 31 &+ 17
            data[i] = x ^ UInt8(truncatingIfNeeded: i >> 8)
        }
        return data
    }

    // MARK: Correctness

    func testKnownAnswers() throws {
        let empty = try FileHasher.fingerprint(ofFileAt: write("empty.bin", Data()))
        XCTAssertEqual(empty.sha256, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
        XCTAssertEqual(empty.sizeBytes, 0)

        let abc = try FileHasher.fingerprint(ofFileAt: write("abc.txt", Data("abc".utf8)))
        XCTAssertEqual(abc.sha256, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
    }

    func testLargeFileStreamedInPiecesMatchesOneShotHash() throws {
        let data = bytes(FileHasher.chunkSize * 3 + 12_345)
        var reports: [Int64] = []
        let result = try FileHasher.fingerprint(ofFileAt: write("footage.mov", data)) { reports.append($0) }
        let expected = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        XCTAssertEqual(result.sha256, expected)
        XCTAssertEqual(result.sizeBytes, Int64(data.count))
        XCTAssertEqual(reports.count, 4, "should read in four pieces")
        XCTAssertEqual(reports.last, Int64(data.count))
    }

    // MARK: Duplicates: no false positives, no false negatives

    func testSameNameDifferentContentIsNotADuplicate() throws {
        try fm.createDirectory(atPath: dir + "/a", withIntermediateDirectories: true)
        try fm.createDirectory(atPath: dir + "/b", withIntermediateDirectories: true)
        let one = try FileHasher.fingerprint(ofFileAt: write("a/Reel_final.mp4", bytes(5_000, seed: 1)))
        let two = try FileHasher.fingerprint(ofFileAt: write("b/Reel_final.mp4", bytes(5_000, seed: 2)))
        XCTAssertFalse(DuplicateRules.areByteIdentical(one, two))
    }

    func testOneByteDifferenceIsNotADuplicate() throws {
        var changed = bytes(FileHasher.chunkSize + 10)
        let original = changed
        changed[changed.count - 1] ^= 0x01
        let a = try FileHasher.fingerprint(ofFileAt: write("a.wav", original))
        let b = try FileHasher.fingerprint(ofFileAt: write("b.wav", changed))
        XCTAssertEqual(a.sizeBytes, b.sizeBytes)
        XCTAssertFalse(DuplicateRules.areByteIdentical(a, b))
    }

    func testDifferentNamesSameContentIsADuplicate() throws {
        let data = bytes(70_000)
        let a = try FileHasher.fingerprint(ofFileAt: write("beat.wav", data))
        let b = try FileHasher.fingerprint(ofFileAt: write("beat copy (1).wav", data))
        XCTAssertTrue(DuplicateRules.areByteIdentical(a, b))
    }

    // MARK: Refusals and safety

    func testSymbolicLinkIsRefused() throws {
        let target = write("real.mov", bytes(100))
        try fm.createSymbolicLink(atPath: dir + "/link.mov", withDestinationPath: target)
        XCTAssertThrowsError(try FileHasher.fingerprint(ofFileAt: dir + "/link.mov")) { error in
            XCTAssertEqual(error as? FileHasher.HashError, .notARegularFile)
        }
    }

    func testFolderIsRefused() throws {
        try fm.createDirectory(atPath: dir + "/Project.fcpbundle", withIntermediateDirectories: true)
        XCTAssertThrowsError(try FileHasher.fingerprint(ofFileAt: dir + "/Project.fcpbundle")) { error in
            XCTAssertEqual(error as? FileHasher.HashError, .notARegularFile)
        }
    }

    func testMissingFileIsReported() {
        XCTAssertThrowsError(try FileHasher.fingerprint(ofFileAt: dir + "/nope.mov")) { error in
            guard case .unreadable = error as? FileHasher.HashError else { return XCTFail("\(error)") }
        }
    }

    func testFileChangingWhileReadingIsDiscarded() throws {
        let path = write("still_downloading.mov", bytes(FileHasher.chunkSize * 2 + 5))
        var appended = false
        XCTAssertThrowsError(try FileHasher.fingerprint(ofFileAt: path) { _ in
            guard !appended else { return }
            appended = true
            // Simulate a download still in progress: more bytes arrive after the first piece.
            if let h = FileHandle(forUpdatingAtPath: path) {
                h.seekToEndOfFile()
                h.write(Data(repeating: 0xAB, count: 1_000))
                h.closeFile()
            }
        }) { error in
            XCTAssertEqual(error as? FileHasher.HashError, .changedWhileReading)
        }
    }

    func testCancellationStopsEarly() throws {
        let path = write("huge.mov", bytes(FileHasher.chunkSize * 4))
        var pieces = 0
        XCTAssertThrowsError(try FileHasher.fingerprint(ofFileAt: path,
                                                        progress: { _ in pieces += 1 },
                                                        shouldCancel: { pieces >= 2 })) { error in
            XCTAssertEqual(error as? FileHasher.HashError, .cancelled)
        }
        XCTAssertEqual(pieces, 2)
    }

    func testHashingNeverChangesTheFile() throws {
        let data = bytes(300_000)
        let path = write("untouched.psd", data)
        let before = try fm.attributesOfItem(atPath: path)[.modificationDate] as? Date
        _ = try FileHasher.fingerprint(ofFileAt: path)
        XCTAssertEqual(fm.contents(atPath: path), data)
        XCTAssertEqual(try fm.attributesOfItem(atPath: path)[.modificationDate] as? Date, before)
    }
}
#endif
