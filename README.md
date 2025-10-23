# 💝 Wishlist Notifier

Send subtle hints to loved ones when browsing products online!

## Quick Start

### 1. Setup Backend (5 minutes)

```bash
cd backend

# Create .env file from template
cp .env.example .env

# Edit .env with your Gmail credentials
# Get app password from: https://myaccount.google.com/apppasswords

# Install and run
go mod download
./start-server.sh
```

### 2. Setup Extension (3 minutes)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. Configure settings (click extension icon)

### 3. Create Icons

The extension needs three icon files in `extension/icons/`:
- icon16.png (16x16px)
- icon48.png (48x48px)
- icon128.png (128x128px)

Quick method: https://favicon.io/emoji-favicons/heart-with-ribbon/

## Usage

1. Browse Amazon, Micro Center, Steam, Newegg, or Best Buy
2. Click the "💝 Send Hint" button on product pages
3. Your loved one receives a beautiful email!

## Important Files to Copy

⚠️ Some files were created as placeholders due to length limits.
Copy the FULL versions from the artifacts above for:

- `extension/content.js` - Product detection logic
- `extension/content.css` - Complete styling

## Documentation

See the artifacts above for:
- QUICKSTART.md - Detailed 10-minute setup guide
- PROJECT-SUMMARY.md - Technical overview
- FOLDER-STRUCTURE.md - Organization guide

## Supported Websites

✅ Amazon
✅ Micro Center
✅ Steam
✅ Newegg
✅ Best Buy

## Support

For detailed help, see QUICKSTART.md in the artifacts above.

## License

Free to use for personal projects! 💝
