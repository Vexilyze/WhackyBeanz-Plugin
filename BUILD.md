# WhackyBeanz Extension - Cross-Browser Build Guide

This extension works on both **Chrome** and **Firefox**. Follow the instructions below for your target browser.

## 🔧 Prerequisites

- Node.js and npm (for any optional build tools)
- Chrome or Firefox browser for testing

## 📦 Building for Chrome

### Method 1: Direct Installation (Development)
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" 
4. Select the extension folder (the one with `manifest.json`)
5. The extension should now be loaded and ready to use

## 🦊 Building for Firefox

### Method 1: Temporary Installation (Development)
1. Replace `manifest.json` with `manifest-firefox.json`:
   ```bash
   # Backup the Chrome manifest
   mv manifest.json manifest-chrome.json
   
   # Use Firefox manifest
   mv manifest-firefox.json manifest.json
   ```

2. Open Firefox and go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select any file in the extension folder (e.g., `manifest.json`)
6. The extension will be loaded temporarily

### Method 2: Package as .xpi (Distribution)
1. Ensure you're using the Firefox manifest (see Method 1, step 1)
2. Zip all extension files:
   ```bash
   zip -r whackybeanz-extension-firefox.xpi . -x "*.git*" "BUILD.md" "manifest-chrome.json"
   ```
3. The `.xpi` file can be installed in Firefox

## 🔄 Cross-Browser Compatibility Features

This extension includes several features to ensure compatibility:

### WebExtension Polyfill
- **File**: `webextension-polyfill.js`
- **Purpose**: Makes Firefox's `browser.*` APIs work as `chrome.*` APIs
- **Result**: Uniform `chrome.*` API usage across both browsers

### API Standardization
- All storage operations use `chrome.storage.local.*`
- Callback-based APIs with Promise wrappers for async handling
- Cross-browser event handling with uniform `chrome.*` namespace

### Manifest Differences
| Feature | Chrome (V3) | Firefox (V2) |
|---------|-------------|--------------|
| Action | `action` | `browser_action` |
| Background | `service_worker` | `background.scripts` |
| Host Permissions | `host_permissions` | `permissions` |

## 🧪 Testing

### Chrome Testing
1. Load extension in developer mode
2. Visit `whackybeanz.com/calc/equips/flames`
3. Test character management features
4. Test flame solver functionality
5. Test import/export via popup

### Firefox Testing  
1. Load extension temporarily
2. Follow the same testing steps as Chrome
3. Check browser console for any Firefox-specific errors

## 📁 Project Structure

```
WhackyBeanz-Extension/
├── manifest.json              # Chrome Manifest V3
├── manifest-firefox.json      # Firefox Manifest V2  
├── webextension-polyfill.js   # Cross-browser compatibility
├── contentScript.js           # Main functionality
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup functionality
├── options.html               # Options page
├── options.js                 # Options functionality
├── tailwind.css              # Styling
├── icons/                    # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── BUILD.md                  # This file
```

## ⚠️ Important Notes

1. **Manifest Files**: Remember to use the correct manifest for each browser
2. **Testing**: Always test on both browsers before release
3. **APIs**: The polyfill handles most API differences automatically
4. **Permissions**: Both browsers use the same permission model for this extension

## 🐛 Troubleshooting

### Common Issues
- **API Errors**: Make sure `webextension-polyfill.js` is loaded first
- **Storage Issues**: Check that storage permissions are granted
- **Manifest Errors**: Verify you're using the correct manifest for your browser

### Debug Mode
- Chrome: Check `chrome://extensions/` and click "Inspect views: popup"
- Firefox: Check `about:debugging` and click "Inspect" on the extension 