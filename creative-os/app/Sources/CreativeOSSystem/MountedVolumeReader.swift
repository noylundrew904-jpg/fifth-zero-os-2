#if os(macOS)
import Foundation
import CreativeOSCore

/// Lists connected drives using macOS volume metadata.
///
/// Read-only: it asks macOS for each drive's name, ID, format and capacity.
/// It never lists folders, opens files, or changes anything.
public enum MountedVolumeReader {
    static let keys: Set<URLResourceKey> = [
        .volumeUUIDStringKey, .volumeNameKey, .volumeLocalizedNameKey,
        .volumeTotalCapacityKey, .volumeAvailableCapacityForImportantUsageKey, .volumeAvailableCapacityKey,
        .volumeLocalizedFormatDescriptionKey, .volumeIsInternalKey, .volumeIsRemovableKey,
        .volumeIsLocalKey, .volumeIsRootFileSystemKey, .volumeIsBrowsableKey, .volumeIsReadOnlyKey,
    ]

    public static func currentVolumes() -> [VolumeInfo] {
        let urls = FileManager.default.mountedVolumeURLs(
            includingResourceValuesForKeys: Array(keys), options: [.skipHiddenVolumes]) ?? []
        return urls.compactMap(info(for:))
    }

    static func info(for url: URL) -> VolumeInfo? {
        guard let values = try? url.resourceValues(forKeys: keys) else { return nil }
        let isRoot = values.volumeIsRootFileSystem ?? false

        // On modern macOS "/" is a sealed, read-only system volume. Your files live on the
        // matching Data volume, so for the startup disk we report the Data volume's ID,
        // capacity and writability (read from the volume that holds the home folder).
        var data = values
        if isRoot, let home = try? FileManager.default.homeDirectoryForCurrentUser.resourceValues(forKeys: keys) {
            data = home
        }

        let total = Int64(data.volumeTotalCapacity ?? 0)
        let available = data.volumeAvailableCapacityForImportantUsage
            ?? Int64(data.volumeAvailableCapacity ?? 0)
        return VolumeInfo(
            uuid: data.volumeUUIDString,
            name: values.volumeLocalizedName ?? values.volumeName ?? url.lastPathComponent,
            mountPath: url.path,
            totalBytes: total,
            availableBytes: available,
            format: data.volumeLocalizedFormatDescription,
            isInternal: data.volumeIsInternal ?? false,
            isRemovable: values.volumeIsRemovable ?? false,
            isLocal: data.volumeIsLocal ?? false,
            isRootFileSystem: isRoot,
            isBrowsable: values.volumeIsBrowsable ?? false,
            isReadOnly: data.volumeIsReadOnly ?? true
        )
    }
}
#endif
