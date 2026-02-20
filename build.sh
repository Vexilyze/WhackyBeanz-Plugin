#!/bin/bash

# Build script for WhackyBeanz Extension
# Creates zip files for Chrome Web Store and Firefox Add-ons

set -e

VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
DIST_DIR="dist"
CHROME_ZIP="whackybeanz-chrome-v${VERSION}.zip"
FIREFOX_ZIP="whackybeanz-firefox-v${VERSION}.zip"

# Shared extension files (excluding manifest)
FILES=(
    "contentScript.js"
    "popup.html"
    "popup.js"
    "tailwind.css"
    "webextension-polyfill.js"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

copy_shared_files() {
    local dest="$1"
    for f in "${FILES[@]}"; do
        mkdir -p "$dest/$(dirname "$f")"
        cp "$f" "$dest/$f"
    done
}

echo "Building WhackyBeanz Extension v${VERSION}"
echo "==========================================="

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Chrome zip (manifest.json = Manifest V3)
echo ""
echo "Building Chrome zip..."
TEMP_DIR=$(mktemp -d)
cp manifest.json "$TEMP_DIR/manifest.json"
copy_shared_files "$TEMP_DIR"
(cd "$TEMP_DIR" && zip -r - .) > "$DIST_DIR/$CHROME_ZIP"
rm -rf "$TEMP_DIR"
echo "  -> $DIST_DIR/$CHROME_ZIP"

# Firefox zip (manifest-firefox.json renamed to manifest.json = Manifest V2)
echo ""
echo "Building Firefox zip..."
TEMP_DIR=$(mktemp -d)
cp manifest-firefox.json "$TEMP_DIR/manifest.json"
copy_shared_files "$TEMP_DIR"
(cd "$TEMP_DIR" && zip -r - .) > "$DIST_DIR/$FIREFOX_ZIP"
rm -rf "$TEMP_DIR"
echo "  -> $DIST_DIR/$FIREFOX_ZIP"

echo ""
echo "Done! Zip files are in the $DIST_DIR/ directory."
