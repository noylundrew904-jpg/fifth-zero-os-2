# Creative OS

Local-first, one-click creative file organizer for macOS.
Free and offline: see [docs/ZERO_COST.md](docs/ZERO_COST.md).
Status, gap analysis and next steps: see [docs/ROADMAP.md](docs/ROADMAP.md).

**Current state:** the app has a live, read-only **Organize Now** preview: you pick a
folder and it shows what it *would* organize, what stays put for review, and why.
It reads only file names, sizes and dates, and changes nothing. All other pages are
clearly labelled sample screens with fictional data. Moving files from the app is not
switched on yet. Every change is built and tested automatically on a free GitHub-hosted Mac.

## Run it (on your Mac)

Needs macOS 13+ and Apple's free Command Line Tools (`xcode-select --install`) or Xcode.

1. Environment report (read-only):
   ```bash
   bash creative-os/tools/env_check.sh
   ```
2. Safety check (confirms no file, process or network code in the app):
   ```bash
   bash creative-os/tools/mock_safety_check.sh
   ```
3. Tests (needs XCTest; if missing, install Xcode):
   ```bash
   cd creative-os/app && swift test
   ```
4. Launch the mock dashboard:
   ```bash
   cd creative-os/app && swift run CreativeOS
   ```

## Layout
```
app/Sources/CreativeOSCore/          Foundation-only logic (no file access)
  Models.swift, MockData.swift, Search.swift   dashboard mock data
  Safety/                            A1 safety rules engine
    Hierarchy.swift                  Client → Campaign → Deliverable → Purpose
    PathSafety.swift                 sanitizing, normalization, containment
    Naming.swift                     versions, suggested names, collision-safe names
    Approvals.swift                  final-approval and campaign-status gates
    StorageAndDuplicates.swift       15%/50 GB rule, byte-identical rule, quarantine policy
    ActionPlanner.swift              dry-run planner (move / leave in place / skip; no delete)
  Organize/                          B1 suggester (Client/Campaign/Deliverable/Purpose) + dry-run report
app/Sources/CreativeOSStore/         A2 local SQLite notebook (GRDB): volumes, assets, rules,
                                     operation journal, append-only audit log, quarantine manifest
app/Sources/CreativeOSSystem/        A3 read-only drive reader (names, IDs, capacity only)
app/Sources/CreativeOSExecutor/      A4 the only code that moves files: approved, journaled,
                                     same-drive moves + undo + crash recovery. No delete code.
app/Sources/CreativeOSFingerprint/   A5 read-only SHA-256 fingerprints, streamed in 1 MB pieces
app/Sources/CreativeOSScanner/       B1 read-only folder scanner (names, sizes, dates; never opens files)
app/Sources/CreativeOS/              SwiftUI app: Live/ = read-only Organize Now preview; Views/ = sample screens
app/Tests/CreativeOSCoreTests/       Tests for mock data and every safety rule
app/Tests/CreativeOSStoreTests/      Database tests (in-memory or disposable temp folder)
app/Tests/CreativeOSSystemTests/     Drive reader tests (run on the test machine)
app/Tests/CreativeOSExecutorTests/   Mover tests (throwaway temp folders only)
app/Tests/CreativeOSFingerprintTests/ Fingerprint tests (throwaway temp folders only)
app/Tests/CreativeOSScannerTests/    Scanner + end-to-end dry-run tests (throwaway temp folders only)
tools/                               Read-only helper scripts
docs/                                Zero-cost policy, roadmap
```
