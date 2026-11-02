# Creative OS

Local-first, one-click creative file organizer for macOS.
Free and offline: see [docs/ZERO_COST.md](docs/ZERO_COST.md).
Status, gap analysis and next steps: see [docs/ROADMAP.md](docs/ROADMAP.md).

**Current state:** mock dashboard plus a tested safety rules engine.
Nothing reads, moves, renames, deletes or uploads real files yet, and the code
has not been compiled yet (first build happens on your Mac).

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
app/Sources/CreativeOS/              SwiftUI dashboard (mock data)
app/Tests/CreativeOSCoreTests/       Tests for mock data and every safety rule
tools/                               Read-only helper scripts
docs/                                Zero-cost policy, roadmap
```
