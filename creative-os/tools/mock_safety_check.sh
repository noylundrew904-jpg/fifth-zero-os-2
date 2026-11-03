#!/usr/bin/env bash
# Creative OS — safety check. Read-only: it only searches the source code.
#
# Fails if:
#  1. any source can delete, copy, overwrite or upload files, start programs, or use the network;
#  2. anything other than CreativeOSExecutor can move files or create folders;
#  3. anything other than CreativeOSSystem / CreativeOSExecutor uses the file system at all;
#  4. anything reads file contents except CreativeOSFingerprint (read-only, streamed),
#     or anything lists folders except CreativeOSScanner (names, sizes and dates only);
#  5. the dashboard app can reach anything beyond the read-only scanner and drive reader
#     (no executor, store or fingerprint reader yet), or anything but the app shows a folder picker.
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
  'setAttributes' 'linkItem' 'createSymbolicLink' 'forWriting' 'forUpdating' 'fopen' 'unlink' 'rmdir' \
  'Process(' 'NSTask' 'URLSession' 'NWConnection' 'NSWorkspace'

# 2. Moving files and creating folders: executor only.
check "moves outside CreativeOSExecutor" "$(all_except CreativeOSExecutor)" 'moveItem' 'createDirectory' 'rename('

# 3. File-system access: system reader, executor and fingerprint reader only.
check "file-system access outside allowed layers" "$(all_except 'CreativeOSSystem|CreativeOSExecutor|CreativeOSFingerprint|CreativeOSScanner')" \
  'FileManager' 'attributesOfItem'

# 3b. Only the app may show the folder picker (that is how the user grants access).
check "folder picker outside the app" "$(all_except CreativeOS)" 'NSOpenPanel' 'fileImporter'

# 4a. Only the fingerprint reader may open files, and only for reading.
check "opens files outside CreativeOSFingerprint" "$(all_except CreativeOSFingerprint)" 'FileHandle' 'read(upToCount'

# 4b. Only the scanner may list folders.
check "lists folders outside CreativeOSScanner" "$(all_except CreativeOSScanner)" 'enumerator(' 'contentsOfDirectory' 'subpaths'

# 4c. Nobody loads whole files into memory.
check "loads whole files" "." 'Data(contentsOf' 'contentsOf:' 'contents(atPath'

# 5. The app may only use the read-only scanner and drive reader for now.
check "app connected to write-capable layers too early" "CreativeOS" \
  'import CreativeOSStore' 'import CreativeOSExecutor' 'import CreativeOSFingerprint' 'SafeMover' 'GRDB'

if [[ $found -ne 0 ]]; then
  echo "SAFETY CHECK FAILED" >&2
  exit 1
fi
echo "PASS: nothing can delete files; only the executor can move them; only the fingerprint reader reads contents; only the scanner lists folders; the app can only read (preview), never move."
