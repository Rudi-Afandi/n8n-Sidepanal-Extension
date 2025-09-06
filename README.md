# N8N Side Panel Extension

Extension built with XWT side panel for sending text and files to n8n webhooks.

## Features

### 🚀 Core Features
- **Side Panel Interface** - Clean, responsive chat-like interface
- **Text Messaging** - Send text messages to n8n webhook
- **File Upload** - Support for multiple file types:
  - Images (JPG, PNG, GIF, WebP, SVG, etc.)
  - PDF documents
  - Word documents (.doc, .docx)
  - Text files (.txt)
- **Image Paste** - Copy and paste images directly into the message input
- **Dark Mode** - Toggle between light, dark, and system themes
- **Toast Notifications** - User-friendly feedback messages
- **Persistent Storage** - Webhook URL and chat history saved locally

### 🎨 UI Features
- **Responsive Design** - Works on different screen sizes
- **Centered Layout** - Clean, organized interface
- **File Preview** - Image preview before sending
- **Real-time Chat** - Chat history with automatic scrolling
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line

## Installation

### Development
```bash
# Clone the repository
git clone <repository-url>
cd n8n-sidepanel

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build for Chrome
npm run build

# Build for Firefox
npm run build:firefox

# Create extension package
npm run zip
```

### Load Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3-dev` folder

## Usage

### 1. Setup Webhook
1. Enter your n8n webhook URL in the input field
2. Click "Save" - the URL will be stored locally
3. A toast notification will confirm successful save

### 2. Send Messages
- **Text Only**: Type your message and press Enter or click Send
- **Files Only**: Click the paperclip icon to select a file
- **Text + Files**: Type a message and attach a file

### 3. Image Paste
1. Copy an image from any source (screenshot, web, etc.)
2. Paste it into the message input field (Ctrl+V or Cmd+V)
3. The image will be automatically attached and previewed

### 4. Theme Toggle
- Click the theme toggle button in the top-right corner
- Choose between Light, Dark, or System theme

## API Reference

### Request Format

The extension sends data to your n8n webhook as JSON with `Content-Type: application/json`:

```json
{
  "message": "Your text message (optional)",
  "files": "true",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": "12345",
  "fileData": "base64-encoded-file-data",
  "fileMime": "application/pdf",
  "source": "wxt-sidepanel",
  "ts": "2024-01-01T12:00:00.000Z"
}
```

### Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `message` | String | User's text message (optional) |
| `files` | String | Always "true" when file is attached |
| `fileName` | String | Original filename with extension |
| `fileType` | String | MIME type of the file |
| `fileSize` | String | File size in bytes |
| `fileData` | String | Base64 encoded file content |
| `fileMime` | String | MIME type (duplicate for convenience) |
| `source` | String | Always "wxt-sidepanel" |
| `ts` | String | ISO timestamp of the request |

### Text-Only Request
```json
{
  "message": "Hello from N8N Side Panel!",
  "source": "wxt-sidepanel",
  "ts": "2024-01-01T12:00:00.000Z"
}
```

### File-Only Request
```json
{
  "files": "true",
  "fileName": "screenshot.png",
  "fileType": "image/png",
  "fileSize": "45678",
  "fileData": "iVBORw0KGgoAAAANSUhEUgAA...",
  "fileMime": "image/png",
  "source": "wxt-sidepanel",
  "ts": "2024-01-01T12:00:00.000Z"
}
```

### Combined Request
```json
{
  "message": "Please process this document",
  "files": "true",
  "fileName": "report.pdf",
  "fileType": "application/pdf",
  "fileSize": "987654",
  "fileData": "JVBERi0xLjQKJeLjz9M...",
  "fileMime": "application/pdf",
  "source": "wxt-sidepanel",
  "ts": "2024-01-01T12:00:00.000Z"
}
```

## N8N Workflow Examples

### Basic Text Processing
1. **Webhook Trigger** - Receive the request
2. **Set Node** - Extract message text
3. **OpenAI Node** - Process the text
4. **Respond to Webhook** - Return response

### File Processing
1. **Webhook Trigger** - Receive the request
2. **Read Binary Data Node** - Convert base64 to binary
3. **OCR Node** - Extract text from images/PDFs
4. **AI Processing Node** - Process the content
5. **Google Drive Node** - Save file to cloud
6. **Respond to Webhook** - Return results

### Response Format

Your n8n workflow should respond with JSON. The extension will display:

```json
{
  "message": "Processing complete!",
  "result": "File uploaded and processed successfully",
  "fileUrl": "https://drive.google.com/..."
}
```

Or simple text response:
```
File received and saved to Google Drive!
```

## File Processing in N8N

### Convert Base64 to Binary
Use n8n's "Read Binary Data" node:
- Input: `{{ $json.fileData }}`
- MIME Type: `{{ $json.fileMime }}`
- Property Name: `binaryData`

### Example OCR Workflow
1. **Webhook** → Receive base64 file
2. **Read Binary Data** → Convert to binary
3. **Google Vision OCR** → Extract text
4. **OpenAI** → Process extracted text
5. **Google Drive** → Save original file
6. **Respond to Webhook** → Return results

## Configuration

### Environment Variables
Create a `.env` file for development:
```
# Optional: Default webhook URL
VITE_DEFAULT_WEBHOOK=https://n8n.example.com/webhook/example

# Optional: API keys for services
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Extension Permissions
The extension requires:
- `storage` - Save webhook URL and chat history
- `*://*/*` - Send requests to any domain (your n8n instance)

## Troubleshooting

### Common Issues

**File upload not working**
- Check that the file type is supported
- Verify file size limits
- Ensure n8n webhook can handle base64 data

**Webhook not saving**
- Check browser console for errors
- Verify storage permissions
- Try re-saving the webhook URL

**Paste not working**
- Ensure you're copying an image (not text)
- Check browser clipboard permissions
- Try using the upload button instead

**Theme not applying**
- Refresh the extension
- Check browser theme settings
- Verify CSS is loading correctly

### Debug Mode
Enable debug logging in browser console:
```javascript
// In extension console
localStorage.setItem('debug', 'wxt:*')
```

## Development

### Project Structure
```
n8n-sidepanel/
├── entrypoints/
│   ├── sidepanel/
│   │   ├── main.tsx          # Main React component
│   │   └── style.css         # Custom styles
│   ├── background.ts         # Background script
│   └── content.ts           # Content script
├── components/
│   ├── ui/                   # Shadcn/ui components
│   ├── theme-provider.tsx   # Theme management
│   └── mode-toggle.tsx       # Theme toggle
├── lib/
│   └── utils.ts             # Utility functions
├── assets/
│   └── tailwind.css          # Tailwind styles
└── wxt.config.ts            # WXT configuration
```

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:firefox # Build for Firefox
npm run zip          # Create extension package
npm run compile      # TypeScript compilation check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API reference

## Changelog

### v1.0.0
- Initial release
- Text and file messaging
- Image paste functionality
- Dark mode support
- Base64 file encoding
- Toast notifications
