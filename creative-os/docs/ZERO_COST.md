# Creative OS — Zero-Cost Policy and Feature Map

**Rule:** Creative OS must be free to build, install, run and maintain.
No paid APIs (including the Claude API and OpenAI), no cloud inference, no subscriptions,
no paid licenses, no paid third-party services, no recurring costs.
All essential features work offline. The finished app does not need Claude Code.

The 26 decisions and safety requirements in the build spec are unchanged.
Where the spec mentioned something that cannot be done for free, the free
replacement is listed below.

## Dependency license policy

| Allowed | How |
|---|---|
| Apple system frameworks (SwiftUI, Vision, Core ML, NaturalLanguage, AVFoundation, QuickLookThumbnailing, CryptoKit, SQLite) | Linked directly. Ship with macOS. |
| MIT, BSD, Apache-2.0, ISC, zlib libraries | Linked directly (e.g. GRDB.swift, MIT). |
| LGPL / GPL command-line tools (e.g. FFmpeg) | **Optional only**, installed by you, run as a separate program, never bundled or linked. |
| Anything paid, account-gated or with usage fees | Not allowed. |

Current third-party dependencies: **GRDB.swift 6.29.3 (MIT)**, pinned exactly. (7.x needs a newer Xcode than macOS 13/14 can run.)

## Feature map

| Feature | Free implementation | Limitations / notes |
|---|---|---|
| Build the app | Xcode or the Command Line Tools: both free from Apple | Needs macOS 13 or later. The Command Line Tools (~1–2 GB) are enough for `swift build`; full Xcode (~10+ GB) is optional. |
| Install / distribute | Build on your own Mac, sign "ad-hoc" (`codesign --sign -`) | **Notarization and Developer ID signing need the paid Apple Developer Program, so they are not used.** A locally built app runs normally on the Mac that built it. Copying it to another Mac makes Gatekeeper warn on first open (right-click → Open, or allow it in System Settings → Privacy & Security). |
| Index, rules, settings, journal | SQLite (built into macOS) via GRDB.swift (MIT) | — |
| Full-text search | SQLite FTS5 | — |
| "AI" natural-language search (decision 20) | Rule-based query parser (dates, file types, client aliases, status words) + FTS5 + Apple NaturalLanguage (built-in tokenizing and word embeddings for synonyms) | Not a chatbot. Unusual phrasing may be misread, so the app always shows the filters it understood and lets you edit them. |
| Visual understanding (decision 21) | Apple Vision, built in: image labels (`VNClassifyImageRequest`), on-image text/OCR, image similarity (feature prints), face *detection*. Video uses sampled frames via AVFoundation. | Generic labels only (e.g. "outdoor", "guitar"). It cannot tell which client a logo belongs to and does not write captions. No download needed. |
| Thumbnails | QuickLookThumbnailing (built in) | Some pro formats (BRAW, R3D) have no system thumbnail without their vendors' free plug-ins. |
| Media metadata | AVFoundation (built in) | Optional FFmpeg/ffprobe (free, you install it via Homebrew) for formats AVFoundation can't read. |
| Duplicate detection | Size, then SHA-256 via CryptoKit (built in), streamed in chunks | Large footage takes time to hash; progress is shown. |
| Drive identity | Volume UUID from macOS file-system APIs (built in) | Some exFAT/FAT drives have no stable UUID; those fall back to name + size, and you confirm them. |
| Project dependency checks (decision 23) | `.prproj` is gzipped XML and can be parsed for free. Other formats are treated conservatively. | `.aep`, `.psd`/`.psb` and `.ai` links can only be partly detected. Anything not fully resolved is **never moved or renamed**. |
| Cloud AI (decision 22, spec Milestone 8 "Claude integration") | **Not built.** Cloud upload stays permanently off. | Decision 22 already said local by default; the optional cloud path is simply never added. |
| Optional local language model (later, opt-in) | 1) Apple's on-device Foundation Models framework, if your Mac supports it (macOS 26+, Apple silicon, Apple Intelligence on). Managed by macOS, nothing for us to download. 2) Or llama.cpp (MIT) with a small open-license model. | **Never downloaded without asking first.** Before any download I will state the model, its license, disk size (typically 2–5 GB) and RAM needs (typically 8 GB+, Apple silicon recommended). Every feature keeps a non-AI fallback. |
| Semantic image search (beyond Vision labels) | Optional Core ML image-embedding model | Same rule: ask first, state size (~150–600 MB) and hardware. Vision similarity works without it. |
| Updates and maintenance | Free source code in Git; rebuild locally | No auto-update service, no server. |
| Background service | None; it runs only when you click | Same as decision 7. |

## What changed in the build plan

- **Milestone 8:** "consent-gated Claude integration" is replaced by optional on-device models, with non-AI fallbacks.
- **Milestone 9:** "signed/notarized if feasible" becomes an ad-hoc signed local build plus documented install steps. Notarization is not possible at zero cost.
- **Runtime:** the app never calls Claude Code or any network service.
