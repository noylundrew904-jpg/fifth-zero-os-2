#!/usr/bin/env bash
# Creative OS — safety check. Read-only: it only searches the source code.
#
# Fails if:
#  1. any source can delete, copy, overwrite or upload files, start programs, or use the network;
#  2. anything other than CreativeOSExecutor can move files or create folders;
#  3. anything other than CreativeOSSystem / CreativeOSExecutor uses the file system at all;
#  4. those two layers read file contents or list folders;
#  5. the dashboard app is connected to the real layers before scanning is approved.
set -u
cd "$(dirname "$0")/../app/Sources" || exit 2
found=0

check() { # $1 = description, $2 = directories, rest = patterns
  local what="$1"; shift
  local where="$1"; shift
  for p in "$@"; do
    if grep -rnF -- "$p" $where ; then
      echo "FAIL ($what): found \"$p\"" >&2
      found=1
    fi
  done
}

all_except() { ls -d */ | grep -vE "^($1)/$" | tr '\n' ' '; }

# 1. Never allowed anywhere.
check "delete / copy / overwrite / programs / network" "." \
  'removeItem' 'trashItem' 'copyItem' 'replaceItem' 'replaceItemAt' 'createFile' 'write(to:' \
  'setAttributes' 'linkItem' 'createSymbolicLink' 'FileHandle' 'fopen' 'unlink' 'rmdir' \
  'Process(' 'NSTask' 'URLSession' 'NWConnection' 'NSWorkspace'

# 2. Moving files and creating folders: executor only.
check "moves outside CreativeOSExecutor" "$(all_except CreativeOSExecutor)" 'moveItem' 'createDirectory' 'rename('

# 3. File-system access: system reader and executor only.
check "file-system access outside allowed layers" "$(all_except 'CreativeOSSystem|CreativeOSExecutor')" \
  'FileManager' 'attributesOfItem' 'NSOpenPanel' 'fileImporter'

# 4. Neither layer reads contents or lists folders.
check "reads file contents or lists folders" "." \
  'contentsOfDirectory' 'enumerator(' 'Data(contentsOf' 'contentsOf:' 'subpaths' 'contents(atPath'

# 5. The dashboard stays on mock data for now.
check "app connected too early" "CreativeOS" \
  'import CreativeOSStore' 'import CreativeOSSystem' 'import CreativeOSExecutor'

if [[ $found -ne 0 ]]; then
  echo "SAFETY CHECK FAILED" >&2
  exit 1
fi
echo "PASS: nothing can delete files; only the executor can move them; the app still uses mock data."
