# n8n-nodes-getscreenshot

An n8n community node for the [GetScreenshot API](https://www.getscreenshotapi.com). It captures screenshots and PDFs of web pages inside n8n workflows, and it can be attached to an n8n AI Agent as a tool.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

**npm package name:** `n8n-nodes-getscreenshot`

## Operations

The Operation dropdown has two values:

| Operation | What it does |
|-----------|--------------|
| `screenshot` | Captures a web page as a PNG or JPEG image or an A4 PDF. Returns a link to the stored file and, by default, the file itself as binary data. |
| `usage` | Returns how many screenshots the API key has used, the monthly limit, how many are left and the reset date. |

Each call to either operation uses 1 screenshot of the monthly quota. Failed captures count too.

## Credentials

You need a GetScreenshot API key. Plans and checkout are at [getscreenshotapi.com/#pricing](https://www.getscreenshotapi.com/#pricing). The key is emailed after checkout. The n8n integration needs the Hamilton plan or higher. To look up an existing key or your usage, go to [getscreenshotapi.com/account](https://www.getscreenshotapi.com/account).

1. Create credentials of type "GetScreenshot API".
2. Paste your API key.
3. n8n tests the key against the `/v1/get-screenshot/validate-key` endpoint.

## Take a screenshot

1. Add a GetScreenshot node and keep the `screenshot` operation.
2. Enter the URL. It must start with `http://` or `https://`.
3. Optionally pick a Device Preset, an Output Format, and Full Page.
4. Run the node.

### Fields

| Field | Notes |
|-------|-------|
| URL | Public page to capture. Shortened links (bit.ly and similar) are rejected. Pages on localhost or a private network cannot be reached. |
| Device Preset | iPhone, Pixel, iPad and desktop sizes. Custom Dimensions uses 1280×800 unless you set Width and Height under Options. |
| Output Format | PNG (default), JPEG or PDF. PDFs are A4. WebP is listed for older workflows but is not officially supported by the API. |
| Full Page | Captures the whole scrollable page. Has no effect when a Device Preset other than Custom Dimensions is selected. |
| Download File | On by default: the file is downloaded and attached as binary data. Turn it off to get only the JSON with the link. |

### Options

- **Viewport:** Width, Height, Device Scale Factor (1x, 2x, 3x).
- **Timing:** Wait Until (`networkidle2` by default; `domcontentloaded` is the fastest on heavy pages), Additional Wait Time in ms (0 means the API default of 2000 ms).
- **Element targeting:** Capture Specific Element, Hide Elements, Click Before Capture. All take CSS selectors. A selector that matches nothing makes the capture fail.
- **Page changes:** Hide Cookie Banners (on by default), Highlight Text, Custom CSS, Custom JavaScript.
- **Delivery:** Email Screenshot To, Webhook URL.
- **File name:** Use URL as Filename.

These fields are kept so saved workflows stay valid, but they do nothing:

- **PDF Paper Format**, **HTTP Basic Auth Username**, **HTTP Basic Auth Password**: the API has no matching parameters. Since 1.1.0 the node no longer sends them.
- **Scroll Page First**: the API already scrolls the page by default to load lazy content, so the toggle makes no difference in either position.

### Output

JSON for an image capture:

```json
{
  "status": "success",
  "url": "https://example.com",
  "screenshotUrl": "https://storage.googleapis.com/getscreenshot-storage/imageAbC123xYz9.png",
  "format": "png",
  "fullPage": false,
  "capturedAt": "2026-11-18T14:03:24.512Z",
  "originUrl": "https://example.com",
  "pageStatus": 200,
  "captureDate": "2026/11/18",
  "captureHour": "14:03:22"
}
```

| Key | Meaning |
|-----|---------|
| `status` | `success` when the capture worked. |
| `screenshotUrl` | Link to the stored image or PDF. The file is kept for 30 days. The link is public: anyone who has it can open the file. |
| `originUrl`, `url` | The page that was captured. |
| `pageStatus` | HTTP status code the page returned. |
| `captureDate`, `captureHour` | When the API captured the page, in UTC. |
| `capturedAt` | When the node received the result, as an ISO 8601 timestamp. |
| `format`, `fullPage`, `preset` | The settings the node used. `preset` is only present when a Device Preset is selected. |

With Output Format set to PDF, `screenshotUrl` points to a `.pdf` file and `format` is `pdf`.

The item also has `width` and `height` keys from earlier versions. The API does not return image dimensions, so they are empty.

**Binary data:** when Download File is on, the file is attached under the binary property `data` as `screenshot.png`, `screenshot.jpg` or `screenshot.pdf`. Use it with nodes such as Read/Write Files from Disk, Send Email, S3, Google Drive or HTTP Request.

## Get usage

Select the `usage` operation. Account Email is optional: the result depends on the API key alone.

```json
{
  "usedQuota": 123,
  "remainingQuota": { "limit": 6000, "offset": 0, "period": "MONTH" },
  "limit": 6000,
  "remaining": 5877,
  "quotaRestartDate": "2026-12-01",
  "totalQuota": 6000,
  "resetDate": "2026-12-01"
}
```

| Key | Meaning |
|-----|---------|
| `usedQuota` | Screenshots used in the current period. |
| `limit` | Monthly allowance of the plan. |
| `remaining` | `limit` minus `usedQuota`. |
| `quotaRestartDate` | Date the count resets. |
| `remainingQuota` | The plan quota object exactly as the API returns it. Despite the name it is not a remaining count; use `remaining`. |
| `totalQuota`, `resetDate` | Same values as `limit` and `quotaRestartDate`, under the key names earlier versions used. |

## Use as an AI Agent tool

Since 1.1.0 the node can be connected to the Tools input of an n8n AI Agent node. The agent can then take a screenshot of a page it is asked about and work with the returned link.

1. Open your AI Agent node and click the **+** on its **Tool** connector.
2. Search for "GetScreenshot" and pick **GetScreenshot Tool**.
3. Select your GetScreenshot API credentials.
4. For **URL**, click the "Let the model define this parameter" button, or enter an expression such as:

   ```
   {{ $fromAI('url', 'Full address of the page to capture, starting with https://', 'string') }}
   ```

5. Turn **Download File** off. n8n passes only the JSON output of a tool back to the agent and drops binary data, so the download is wasted time. The agent gets `screenshotUrl` and the other JSON fields.
6. **Tool Description** on "Set Automatically" gives the agent the node's general description, which covers both operations. For more reliable tool calls switch to "Set Manually" and describe the one job you configured, for example: "Capture a screenshot of a public web page. Input: the full page URL. Returns screenshotUrl, a link to the image."

Any other field can be handed to the model the same way. Each field's description in the node says what value it expects.

What to know:

- The agent receives a link to the image, not the image itself. If the model needs to look at the pixels, fetch `screenshotUrl` in a later step and pass the image to a vision-capable model.
- Every tool call uses 1 screenshot of your quota.
- The API captures public pages only. It cannot reach localhost or private networks, and it takes single captures rather than driving a logged-in browser session.

### n8n version requirements

- **n8n 1.85.0 and later:** nothing to configure. Community nodes that declare tool support appear as tools.
- **n8n 1.79.0 to 1.84.x (self-hosted):** set the environment variable `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true` and restart n8n.
- **Earlier versions:** community nodes cannot be used as tools. The node still works as a regular workflow node.

## Upgrading from 1.0.x

Existing workflows keep working without edits. No parameter, option value, credential or output key was renamed or removed, and defaults are unchanged. See the changelog for the behaviour fixes.

## Changelog

### 1.1.0

Added

- AI Agent tool support (`usableAsTool`). The node appears as "GetScreenshot Tool" on the Tools connector of an AI Agent.
- **Download File** toggle on the screenshot operation. On by default, which is the previous behaviour. Off returns the JSON with `screenshotUrl` and skips the download.
- Screenshot output now includes the fields the API returns: `originUrl`, `pageStatus`, `captureDate`, `captureHour`. The existing `url` key is now filled with the captured page address.
- Usage output now includes `limit`, `remaining` and `quotaRestartDate`.
- Optional **Account Email** field on the usage operation.
- Field and operation descriptions rewritten with formats and examples, for people and for models filling the fields.

Fixed

- PDF output always failed with "No screenshot URL returned from API". The node now reads the `pdfFile` field the API returns.
- **Use URL as Filename** had no effect because the node sent `urlfilename` instead of `urlasfilename`. Workflows with this option on now get files named after the URL.
- **Get Usage** always failed because the API requires an `email` query parameter. The node now sends one.
- Usage keys `totalQuota` and `resetDate` were always empty. They now carry the monthly limit and the reset date.

Changed

- The node no longer sends `pdfpaper`, `authuser` and `authpassword`. The API ignored them, so results are the same. The fields remain in the node and are marked as having no effect.
- The codex file (`GetScreenshot.node.json`) is now included in the build, with the node identifier corrected and more search aliases.

### 1.0.2

- Corrected the author email.

### 1.0.1

- Replaced deprecated n8n API methods.

### 1.0.0

- Initial release.

## Development

```bash
npm install
npm run build   # compile to dist/ and copy icons and codex files
npm run lint
npm test        # builds, then runs the node:test suite against dist/ (no network calls)
```

## Resources

- [GetScreenshot documentation](https://docs.rasterwise.com)
- [GetScreenshot website](https://www.getscreenshotapi.com)
- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)
- Support: support@rasterwise.com

## License

[MIT](LICENSE)
