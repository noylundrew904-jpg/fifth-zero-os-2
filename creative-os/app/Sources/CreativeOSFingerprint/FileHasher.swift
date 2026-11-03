#if canImport(CryptoKit)
import CryptoKit
import Foundation
import CreativeOSCore

/// Computes a file's SHA-256 "fingerprint" so two files can be proven byte-for-byte identical.
///
/// Read-only. The file is read in 1 MB pieces, so memory use stays small even for huge footage.
/// If the file changes while being read (still downloading, rendering or copying), the result is
/// thrown away. Links, folders and anything that isn't a regular file are refused.
public enum FileHasher {
    public static let chunkSize = 1 << 20   // 1 MiB

    public enum HashError: Error, Equatable {
        case notARegularFile
        case unreadable(String)
        case changedWhileReading
        case cancelled
    }

    /// - Parameters:
    ///   - progress: called after each piece with the total bytes read so far.
    ///   - shouldCancel: checked between pieces; return true to stop early.
    public static func fingerprint(ofFileAt path: String,
                                   progress: ((Int64) -> Void)? = nil,
                                   shouldCancel: (() -> Bool)? = nil) throws -> FileFingerprint {
        let before = try snapshot(path)

        let handle: FileHandle
        do {
            handle = try FileHandle(forReadingFrom: URL(fileURLWithPath: path))
        } catch {
            throw HashError.unreadable(error.localizedDescription)
        }
        defer { try? handle.close() }

        var hasher = SHA256()
        var bytesRead: Int64 = 0
        while true {
            if shouldCancel?() == true { throw HashError.cancelled }
            let piece: Data?
            do {
                piece = try handle.read(upToCount: chunkSize)
            } catch {
                throw HashError.unreadable(error.localizedDescription)
            }
            guard let piece, !piece.isEmpty else { break }
            hasher.update(data: piece)
            bytesRead += Int64(piece.count)
            progress?(bytesRead)
        }

        let after = try snapshot(path)
        guard after == before, bytesRead == before.size else { throw HashError.changedWhileReading }

        let hex = hasher.finalize().map { String(format: "%02x", $0) }.joined()
        return FileFingerprint(sizeBytes: bytesRead, sha256: hex)
    }

    private struct Snapshot: Equatable {
        let size: Int64
        let modified: Date
        let fileNumber: Int
    }

    /// Size, modification date and file identity. Doesn't follow links.
    private static func snapshot(_ path: String) throws -> Snapshot {
        let attributes: [FileAttributeKey: Any]
        do {
            attributes = try FileManager.default.attributesOfItem(atPath: path)
        } catch {
            throw HashError.unreadable(error.localizedDescription)
        }
        guard attributes[.type] as? FileAttributeType == .typeRegular else { throw HashError.notARegularFile }
        guard let size = (attributes[.size] as? NSNumber)?.int64Value,
              let modified = attributes[.modificationDate] as? Date else {
            throw HashError.unreadable("macOS did not report the file's size or date.")
        }
        let fileNumber = (attributes[.systemFileNumber] as? NSNumber)?.intValue ?? -1
        return Snapshot(size: size, modified: modified, fileNumber: fileNumber)
    }
}
#endif
