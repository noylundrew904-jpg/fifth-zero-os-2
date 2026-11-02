# Creative OS

Local-first, one-click creative file organizer for macOS.
Built in approval-gated milestones (see the build spec).

## Status: Milestone 1 — Environment check

Nothing in this folder reads, moves, renames, deletes or uploads your files.

### Run the environment check on your Mac
```bash
bash creative-os/tools/env_check.sh
```
It prints macOS version, chip, dev tools, Claude Code version, mounted
volumes, free space and volume UUIDs. It writes nothing and needs no sudo.
Paste the output back into the Claude Code session.

### Still needed from you before Milestone 3 (scanning)
- Exact folders Creative OS may **read** (e.g. a projects folder, an exports folder).
- Which external drive(s) to register, and the archive folder on that drive.
- Where `Creative_Master/` should live.

No paths are assumed.
