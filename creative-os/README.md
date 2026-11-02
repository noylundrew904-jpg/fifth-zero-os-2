# Creative OS

Local-first, one-click creative file organizer for macOS.
Free and offline: see [docs/ZERO_COST.md](docs/ZERO_COST.md).
Built in approval-gated milestones.

| Milestone | Status |
|---|---|
| 1. Environment check | Script ready; waiting for your Mac's output |
| 2. Mock dashboard | **Done, waiting for your approval** |
| 3–9 | Not started |

Nothing in this folder reads, moves, renames, deletes or uploads your files.

## Milestone 1: environment check (read-only)
```bash
bash creative-os/tools/env_check.sh
```
Prints macOS version, chip, dev tools, volumes, free space and volume UUIDs.
Writes nothing and needs no admin password.

## Milestone 2: mock dashboard

A SwiftUI app with fictional data only. All paths start with `/MOCK/`, and an
orange **MOCK DATA** banner sits on every page. "Organize Now" runs a pretend
dry-run plan and a simulated execution. No action buttons do anything yet.

**Requirements (all free):** macOS 13+ and Apple's Command Line Tools
(`xcode-select --install`) or Xcode.

Check the mock has no file, process or network calls:
```bash
bash creative-os/tools/mock_safety_check.sh
```

Build and launch:
```bash
cd creative-os/app && swift run CreativeOS
```

Run the logic tests (they need XCTest; if it reports XCTest missing, install Xcode, and the app itself still runs):
```bash
cd creative-os/app && swift test
```

You can also open `creative-os/app/Package.swift` in Xcode and press Run.

### Pages
Overview (Organize Now) · Active Projects · Drives & Storage · Review Inbox ·
Duplicate Quarantine · Archive Suggestions · Activity & Undo · Search · Settings

### Layout
```
app/Sources/CreativeOSCore/   Foundation-only models, mock data, local search (testable)
app/Sources/CreativeOS/       SwiftUI app and views
app/Tests/                    Safety-rule tests on the mock data
tools/                        Read-only helper scripts
docs/ZERO_COST.md             Free/offline implementation plan and limitations
```
