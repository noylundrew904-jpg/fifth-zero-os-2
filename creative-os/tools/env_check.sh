#!/usr/bin/env bash
# Creative OS — Milestone 1 environment check (READ-ONLY)
#
# What this does:  prints macOS version, chip, dev tools, Claude Code
#                  availability, mounted volumes and free space.
# What it NEVER does: list, open, hash, move, rename, delete or upload any
#                  of your files. It writes nothing to disk. It does not
#                  need sudo. Output goes to the terminal only.
#
# Usage:  bash env_check.sh            (or: bash env_check.sh | pbcopy)

set -u

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This check is for macOS only (detected: $(uname -s))." >&2
  exit 1
fi

section() { printf '\n## %s\n' "$1"; }

# Print "name: version" or "name: not installed" for a command.
tool() {
  local name="$1"; shift
  if command -v "$name" >/dev/null 2>&1; then
    local v
    v="$("$@" 2>&1 | head -n 1)"
    printf '  %-14s %s\n' "$name" "${v:-installed}"
  else
    printf '  %-14s not installed\n' "$name"
  fi
}

echo "# Creative OS environment report"
echo "Generated: $(date '+%Y-%m-%d %H:%M %Z')"

section "System"
echo "  macOS:        $(sw_vers -productVersion) (build $(sw_vers -buildVersion))"
echo "  Architecture: $(uname -m)"
echo "  Chip:         $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo unknown)"
echo "  Memory:       $(( $(sysctl -n hw.memsize) / 1073741824 )) GB"
echo "  CPU cores:    $(sysctl -n hw.ncpu)"

section "Claude Code"
tool claude claude --version

section "Apple toolchain"
if xcode-select -p >/dev/null 2>&1; then
  echo "  Developer dir: $(xcode-select -p)"
else
  echo "  Developer dir: none (Command Line Tools not installed)"
fi
if [[ -d /Applications/Xcode.app ]]; then
  echo "  Xcode.app:     $(xcodebuild -version 2>/dev/null | tr '\n' ' ')"
else
  echo "  Xcode.app:     not installed"
fi
tool swift swift --version

section "Other dev tools"
tool brew    brew --version
tool git     git --version
tool node    node --version
tool npm     npm --version
tool pnpm    pnpm --version
tool rustc   rustc --version
tool cargo   cargo --version
tool python3 python3 --version
tool sqlite3 sqlite3 --version
tool ffmpeg  ffmpeg -version
tool ffprobe ffprobe -version
tool exiftool exiftool -ver
if command -v qlmanage >/dev/null 2>&1; then
  echo "  qlmanage       available (built-in thumbnails)"
fi

section "Volumes and free space"
# df only reads filesystem totals; it does not look inside folders.
df -H -T apfs,hfs,exfat,msdos,ntfs 2>/dev/null | awk 'NR==1 || $NF=="/" || $NF ~ /^\/Volumes\//'

section "External / removable disks"
if diskutil list external physical 2>/dev/null | grep -q .; then
  diskutil list external physical
else
  echo "  none connected"
fi

section "Volume identity (for registering drives later)"
for vol in /Volumes/*; do
  [[ -d "$vol" ]] || continue
  info="$(diskutil info "$vol" 2>/dev/null)" || continue
  uuid="$(awk -F': *' '/Volume UUID/{print $2}' <<<"$info")"
  fs="$(awk -F': *' '/Type \(Bundle\)/{print $2}' <<<"$info")"
  loc="$(awk -F': *' '/Device Location/{print $2}' <<<"$info")"
  removable="$(awk -F': *' '/Removable Media/{print $2}' <<<"$info")"
  printf '  %s\n    fs=%s location=%s removable=%s uuid=%s\n' \
    "$vol" "${fs:-?}" "${loc:-?}" "${removable:-?}" "${uuid:-?}"
done

section "Done"
echo "  No files were read, changed or uploaded."
