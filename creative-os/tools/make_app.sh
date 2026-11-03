#!/usr/bin/env bash
# Builds a double-clickable CreativeOS.app (Apple silicon + Intel), signed ad-hoc (free, local).
# Writes only inside creative-os/app/.build and creative-os/app/dist. Touches nothing else.
set -euo pipefail
cd "$(dirname "$0")/../app"

VERSION="${CREATIVE_OS_VERSION:-0.2.0-preview}"
ARCHS=(--arch arm64 --arch x86_64)

swift build -c release "${ARCHS[@]}" --product CreativeOS
BIN_DIR="$(swift build -c release "${ARCHS[@]}" --show-bin-path)"

APP="dist/CreativeOS.app"
if [[ -d dist ]]; then rm -r dist; fi    # our own previous build output only
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN_DIR/CreativeOS" "$APP/Contents/MacOS/CreativeOS"

READ_NOTE="Creative OS reads file names, sizes and dates in folders you choose, to preview how they could be organized. It does not change anything."
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Creative OS</string>
  <key>CFBundleDisplayName</key><string>Creative OS</string>
  <key>CFBundleIdentifier</key><string>local.creativeos.app</string>
  <key>CFBundleExecutable</key><string>CreativeOS</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${VERSION}</string>
  <key>CFBundleVersion</key><string>${VERSION}</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSDesktopFolderUsageDescription</key><string>${READ_NOTE}</string>
  <key>NSDocumentsFolderUsageDescription</key><string>${READ_NOTE}</string>
  <key>NSDownloadsFolderUsageDescription</key><string>${READ_NOTE}</string>
  <key>NSRemovableVolumesUsageDescription</key><string>${READ_NOTE}</string>
</dict>
</plist>
PLIST

codesign --force --sign - "$APP"
codesign --verify --verbose "$APP"
lipo -info "$APP/Contents/MacOS/CreativeOS"
ditto -c -k --keepParent "$APP" dist/CreativeOS-preview.zip
echo "Built $(pwd)/dist/CreativeOS-preview.zip"
