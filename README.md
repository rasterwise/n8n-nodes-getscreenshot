# n8n-nodes-getscreenshot

This is an n8n community node for the [GetScreenshot API](https://getscreenshotapi.com). It lets you capture screenshots and PDFs of web pages directly in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

**npm package name:** `n8n-nodes-getscreenshot`

## Operations

| Operation | Description |
|-----------|-------------|
| **Take Screenshot** | Capture a screenshot or PDF of a webpage with customizable options |
| **Get Usage** | Check your current API quota and usage statistics |

## Credentials

You need a GetScreenshot API key to use this node. Get your API key at [getscreenshotapi.com](https://getscreenshotapi.com).

1. Create credentials of type "GetScreenshot API"
2. Enter your API key
3. The credentials will be tested automatically using the `/validate-key` endpoint

## Features

### Device Presets
Quickly capture screenshots using common device dimensions:
- **Mobile:** iPhone 12, iPhone X, iPhone 6/7/8, Pixel 2
- **Tablet:** iPad, iPad Pro
- **Desktop:** HD (1280×800), HD+ (1366×768), SXGA, WSXGA+

### Output Formats
- PNG (default)
- JPEG
- WebP
- PDF (with paper size options)

### Advanced Options

**Viewport:**
- Custom width and height
- Device scale factor (1x, 2x, 3x for Retina)

**Timing:**
- Wait until condition (network idle, DOM loaded, etc.)
- Additional wait time in milliseconds
- Scroll page to trigger lazy-loading

**Element Targeting:**
- Capture specific element by CSS selector
- Hide elements before capture
- Click element before capture

**Page Modifications:**
- Auto-hide cookie banners
- Highlight text
- Inject custom CSS
- Execute custom JavaScript

**Delivery:**
- Email screenshot to address
- POST to webhook URL

## Usage Example

### Basic Screenshot
1. Add a GetScreenshot node to your workflow
2. Select "Take Screenshot" operation
3. Enter the URL to capture
4. Choose a device preset or use custom dimensions
5. The node outputs both:
   - **JSON data:** URL, dimensions, status
   - **Binary data:** The actual screenshot image

### Full Page PDF
1. Set URL to capture
2. Set Output Format to "PDF"
3. Enable "Full Page"
4. Add option "PDF Paper Format" and select A4
5. Connect to a "Write File" node to save the PDF

### Screenshot with Modifications
1. Set URL to capture
2. Add options:
   - Hide Elements: `.ads, .popup`
   - Custom CSS: `body { background: white; }`
   - Additional Wait Time: `2000`

## Output

The Take Screenshot operation returns:

**JSON:**
```json
{
  "status": "ok",
  "url": "https://example.com",
  "screenshotUrl": "https://storage.googleapis.com/...",
  "width": 1280,
  "height": 800,
  "format": "png",
  "fullPage": false,
  "capturedAt": "2024-01-15T10:30:00.000Z"
}
```

**Binary:**
The screenshot image is attached as binary data named `data`, ready to be used with downstream nodes like:
- Write Binary File
- Send Email (with attachment)
- Upload to S3/GCS
- HTTP Request (multipart form)

## Resources

- [GetScreenshot Documentation](https://docs.rasterwise.com)
- [GetScreenshot Dashboard](https://getscreenshotapi.com)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
