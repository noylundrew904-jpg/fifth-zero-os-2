#!/usr/bin/env bash
# Creative OS — safety check. Read-only: it only searches the source code.
#
# Fails if:
#  1. any source can change, delete, copy or upload files, start programs, or use the network;
#  2. any source other than CreativeOSSystem uses the file system at all;
#  3. CreativeOSSystem reads anything beyond drive metadata (folder listings, file contents);
#  4. the dashboard app is connected to the database or system layers before scanning is approved.
set -u
cd "$(dirname "$0")/../app/Sources" || exit 2
found=0

check() { # $1 = description, $2 = directory or file list, rest = patterns
  local what="$1"; shift
  local where="$1"; shift
  for p in "$@"; do
    if grep -rnF -- "$p" $where ; then
      echo "FAIL ($what): found \"$p\"" >&2
      found=1
    fi
  done
}

# 1. Never allowed anywhere.
check "changes files / programs / network" "." \
  'removeItem' 'moveItem' 'copyItem' 'trashItem' 'replaceItem' 'createDirectory' 'createFile' \
  'write(to:' 'setAttributes' 'linkItem' 'createSymbolicLink' 'FileHandle' 'fopen' 'unlink' \
  'Process(' 'NSTask' 'URLSession' 'NWConnection' 'NSWorkspace'

# 2. File-system access only in the read-only system layer.
others=$(ls -d */ | grep -v '^CreativeOSSystem/$')
check "file-system access outside CreativeOSSystem" "$others" \
  'FileManager' 'contentsOfDirectory' 'enumerator(' 'Data(contentsOf' 'contentsOf:' 'NSOpenPanel' 'fileImporter'

# 3. The system layer may read drive metadata only.
check "reads beyond drive metadata" "CreativeOSSystem" \
  'contentsOfDirectory' 'enumerator(' 'Data(contentsOf' 'contentsOf:' 'subpaths' 'NSOpenPanel'

# 4. The dashboard stays on mock data for now.
check "app connected too early" "CreativeOS" 'import CreativeOSStore' 'import CreativeOSSystem'

if [[ $found -ne 0 ]]; then
  echo "SAFETY CHECK FAILED" >&2
  exit 1
fi
echo "PASS: nothing can change files; only drive metadata is readable; the app still uses mock data."
