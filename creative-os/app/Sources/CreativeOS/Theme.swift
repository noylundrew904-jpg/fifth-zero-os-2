import SwiftUI
import CreativeOSCore

/// Shared look: minimal, dark, Apple-inspired.
enum Theme {
    static let cardFill = Color.white.opacity(0.045)
    static let cardStroke = Color.white.opacity(0.08)
    static let mock = Color.orange
    static let corner: CGFloat = 12
}

struct Card<Content: View>: View {
    var title: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let title {
                Text(title).font(.headline)
            }
            content
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: Theme.corner, style: .continuous).fill(Theme.cardFill)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.corner, style: .continuous).strokeBorder(Theme.cardStroke)
        )
    }
}

struct PageHeader: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.largeTitle.weight(.semibold))
            Text(subtitle).foregroundStyle(.secondary)
        }
    }
}

/// Persistent banner so mock numbers are never mistaken for real ones.
struct MockBanner: View {
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "theatermasks.fill")
            Text("MOCK DATA").fontWeight(.bold)
            Text("Everything shown is fictional. No files on this Mac are read or changed.")
        }
        .font(.callout)
        .foregroundStyle(Theme.mock)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity)
        .background(Theme.mock.opacity(0.14))
        .accessibilityElement(children: .combine)
    }
}

struct Pill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .foregroundStyle(color)
            .background(Capsule().fill(color.opacity(0.16)))
    }
}

struct MockPill: View {
    var body: some View { Pill(text: "MOCK", color: Theme.mock) }
}

struct RiskBadge: View {
    let risk: Risk

    var body: some View {
        Pill(text: risk.title, color: color)
    }

    private var color: Color {
        switch risk {
        case .noChange: return .secondary
        case .low: return .green
        case .medium: return .yellow
        case .high: return .red
        }
    }
}

struct ConfidenceLabel: View {
    let value: Double

    var body: some View {
        Text("\(Format.percent(value)) confidence")
            .font(.caption.monospacedDigit())
            .foregroundStyle(value >= 0.8 ? Color.green : value >= 0.5 ? Color.yellow : Color.orange)
    }
}

struct PathText: View {
    let label: String
    let path: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(label).font(.caption).foregroundStyle(.secondary).frame(width: 44, alignment: .leading)
            Text(path)
                .font(.caption.monospaced())
                .textSelection(.enabled)
                .lineLimit(2)
                .truncationMode(.middle)
        }
    }
}

/// A disabled action button that explains when it becomes available.
struct FutureButton: View {
    let title: String
    let systemImage: String
    let milestone: Int

    var body: some View {
        Button {} label: { Label(title, systemImage: systemImage) }
            .disabled(true)
            .help("Not active in the mock. Arrives in Milestone \(milestone).")
    }
}

struct VolumeRow: View {
    let volume: StorageVolume

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: volume.kind == .external ? "externaldrive.fill" : "internaldrive.fill")
                    .foregroundStyle(.secondary)
                Text(volume.name).fontWeight(.medium)
                Text(volume.role).foregroundStyle(.secondary)
                Spacer()
                if StorageRules.isLowOnSpace(totalBytes: volume.totalBytes, freeBytes: volume.freeBytes) {
                    Pill(text: "Low space", color: .orange)
                        .help("Below the larger of 15% or 50 GB free.")
                }
                if volume.isOnline {
                    Pill(text: "Online", color: .green)
                } else {
                    Pill(text: "Offline: skipped", color: .red)
                }
            }
            ProgressView(value: volume.usedFraction)
                .tint(volume.usedFraction > 0.85 ? Color.orange : Color.accentColor)
            Text("\(Format.bytes(volume.freeBytes)) free of \(Format.bytes(volume.totalBytes))")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .opacity(volume.isOnline ? 1 : 0.6)
    }
}
