# Creative OS — Roadmap and Gap Analysis

Sources: original build spec (26 decisions), zero-cost requirement, and the
*Existing Project Update* (takes priority where they conflict).

## Honest status

Nothing in Creative OS scans, organizes, packages, backs up or analyzes real files yet.
**No Swift code has been compiled.** The build environment so far had no Swift toolchain.
The first compile happens on your Mac.

| Area | State |
|---|---|
| Environment check script (M1) | Written; not yet run on your Mac |
| Mock dashboard (M2) | Written; not yet compiled. Fictional data only |
| Safety rules engine (A1) | Written with tests; not yet compiled. Pure logic, no file access |
| SQLite index, journal, audit log | Missing |
| Registered volumes (real UUIDs) | Missing |
| Scanner, hashing, classification | Missing |
| Executing moves, undo, quarantine | Missing |
| Collect & Package, backups, restore | Missing |
| Storage recommendations (real data) | Missing; threshold rule exists |
| Local search index, Vision analysis | Missing; mock keyword search exists |
| macOS packaging | Missing |

## Conflicts resolved (update document wins)

| Earlier spec | Now |
|---|---|
| Client / Project / File Type; `01_ACTIVE_PROJECTS/…/01_BRIEF_REFERENCES…` | **Client → Campaign → Deliverable → Purpose**. Root folders: `01_CLIENTS`, `02_SHARED_ASSETS`, `03_REVIEW_INBOX` (virtual), `04_QUARANTINE`, `05_SYSTEM`, `06_PACKAGES`. |
| Raw footage per project | **One `Source_Footage` per campaign**, shared by all deliverables. |
| Exports in one folder | `Exports/<Format>/<Drafts|Revisions|Finals>/`. Formats: Masters, Instagram_Reels, Stories, WhatsApp, Other_Formats. |
| Archive after 30 days inactive | 30 days inactive now only **suggests "On hold"**. Packaging happens only after you **confirm Completed** (Collect & Package to Mac + registered drive). |
| Quarantine with no time limit | 30-day default retention, then a **suggestion** to delete. Deletion always needs your approval. |
| No storage threshold | Warn below the larger of **15% or 50 GB** free, per drive. |
| `CLIENT_Project_Content_vNN` | `CLIENT_Campaign_Deliverable_vNN.ext`, as a suggestion only. |

## Revised checklist

- [x] M1: Environment check script
- [x] M2: Mock dashboard (mock only)
- **A. Foundation and safety**
  - [x] **A1: Safety rules engine** (pure logic + tests): hierarchy, path safety, collision-safe names, camera-name protection, final-approval and status gates, storage threshold, duplicate and quarantine eligibility, dry-run planner with no delete operation
  - [ ] **A2: Local database and journal** (next): GRDB.swift (MIT) migrations for volumes, assets (stable IDs), rules, operation journal, append-only audit log, quarantine manifest
  - [ ] A3: Registered volumes: read volume UUID/capacity (read-only), register, offline detection
  - [ ] A4: File-operation state machine: same-volume move + journal + undo, tested **only in disposable temp fixture folders**
  - [ ] A5: Streaming SHA-256 hasher + interrupted-copy tests (fixtures)
- **B. Organize Now:** scoped read-only scan of approved folders → index → suggestions → virtual Review Inbox → preview → approved execution
- **C. Creative workflows:** shared footage, library references, export grouping, version retention, final confirmation, status suggestions in the UI
- **D. Packaging:** manifest + dependency report, complete/partial, dual destination, copy → verify → commit, resume on next Organize Now, incremental versions, Smart Reopen & Restore
- **E. Storage and duplicates:** per-drive recommendations, protected duplicate classification, quarantine/restore UI, 30-day review
- **F. Polish:** local search (FTS5), Vision analysis, performance, accessibility, ad-hoc signed app, user and recovery guide

## Known limitations (stated up front)

- Adobe link detection is best effort. Only `.prproj` (gzipped XML) can be parsed reliably for free. Anything uncertain is never moved.
- Two package copies are not full disaster recovery if both sit in the same place or on the same device.
- Quarantine on the same drive does not free space until you approve deletion.
- APFS clones share storage; "duplicates" that are clones free little or no space. Hard links are excluded.
