# WhackyBeanz Character Manager

A **cross-browser** extension for **Chrome** and **Firefox** that allows you to:

- **Save** WhackyBeanz localStorage snapshots under custom character names
- **Load** or **Update** those snapshots
- **Delete** characters (with inline confirmation)
- **Reset All** extension data (with inline confirmation)
- **Export** and **Import** backups to JSON files
- **Auto-refresh** the WhackyBeanz page after loading a snapshot

This extension works on both **Chrome** and **Firefox** and is intended for **manual installation** (unpacked).

---

## Features

- **🌐 Cross-Browser**: Works on Chrome and Firefox
- **🎨 Dark UI** styled via Tailwind (precompiled)
- **✅ Inline confirmations** for Delete and Reset All
- **💾 Backup/Restore** entire extension data
- **📄 Raw localStorage** copying (no JSON parse errors)
- **🔧 Uniform APIs** using `chrome.*` namespace on both browsers
- **🔄 Auto-refresh** WhackyBeanz when loading a saved snapshot
- **🔧 Character Management** integrated directly into WhackyBeanz pages
- **🔥 Flame Solver** with automatic flame line selection
- **📊 Symbols Calculator** support

---

## Installation

1. **Download or Clone** this repository (or the `.zip` containing the final extension files).
2. **Extract** the folder if it’s zipped. Ensure you have a folder with `manifest.json` at the root.
3. **Open Chrome** and navigate to `chrome://extensions`.
4. **Enable Developer Mode** (toggle in the top right).
5. **Click “Load unpacked”** and select the folder with `manifest.json`.
6. The extension will appear in your list. You can **pin** it to the toolbar for quick access.

### Firefox Installation
1. Go to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select any file in this folder (e.g., `manifest-firefox.json`)

**📖 For detailed cross-browser installation and build instructions, see [BUILD.md](BUILD.md)**

---

## Usage

1. **Go to WhackyBeanz** (e.g. <https://www.whackybeanz.com/calc/equips/setup>).
2. **Open** the extension popup (by clicking the extension icon).
3. **Create New Character**
    - Type a name in “Enter character name.”
    - Click **“Save New”** – this snapshots the current page’s localStorage.
4. **Load / Update / Delete**
    - **Load**: Overwrites the page’s localStorage with your saved snapshot, then refreshes.
    - **Update**: Overwrites the saved snapshot with the current localStorage.
    - **Delete**: Removes the snapshot (with an inline confirmation).
5. **Reset All Saved Data**
    - Clears all snapshots from the extension (with inline confirmation).
6. **Export / Import**
    - **Export Backup**: Saves a `.json` file of all extension data.
    - **Import Backup**: Restores the extension’s saved data from a `.json` file.

---

## Building Tailwind (If Needed)

If you wish to **modify** or **rebuild** the Tailwind styles:

1. Install [Node.js](https://nodejs.org/) & NPM.
2. From the extension folder, run:

   ```bash
   npm install
   npm run tw:build
