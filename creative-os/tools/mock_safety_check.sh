#!/usr/bin/env bash
# Creative OS — mock-phase safety check (Milestones 1–2).
# Fails if the app source contains any API that could read, change or upload
# real files, start a process, or touch the network. Read-only: it only greps.
set -u
cd "$(dirname "$0")/../app/Sources" || exit 2

patterns=(
  'FileManager' 'removeItem' 'moveItem' 'copyItem' 'trashItem' 'replaceItem'
  'createDirectory' 'contentsOfDirectory' 'enumerator(' 'write(to:' 'Data(contentsOf'
  'FileHandle' 'NSWorkspace' 'Process(' 'URLSession' 'NWConnection' 'fopen' 'unlink'
  'contentsOf:' 'NSOpenPanel' 'fileImporter'
)

found=0
for p in "${patterns[@]}"; do
  if grep -rnF -- "$p" . ; then found=1; fi
done

if [[ $found -ne 0 ]]; then
  echo "FAIL: file-system, process or network API found in mock-phase source." >&2
  exit 1
fi
echo "PASS: no file-system, process or network APIs in app source."
