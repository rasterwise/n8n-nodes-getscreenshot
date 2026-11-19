import type { INodeProperties } from 'n8n-workflow';

// Descriptions are written for two readers: a person in the n8n editor and an LLM
// that fills the parameters when the node is used as an AI Agent tool. Each one says
// what the value is, its format, an example and when to leave it empty.
// Parameter names, option values and defaults are part of the saved-workflow contract
// and must not change.

export const screenshotProperties: INodeProperties[] = [
	// Essential Fields (Always Visible)
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com',
		description:
			'Full address of the public web page to capture, including the protocol, e.g. https://example.com/pricing. Must start with http:// or https://. Shortened links (bit.ly and similar) are rejected, and pages on localhost or a private network cannot be reached.',
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
	},
	{
		displayName: 'Device Preset',
		name: 'preset',
		type: 'options',
		default: 'none',
		description:
			'Device to emulate. A preset sets the viewport size and, for phones, a mobile user agent. Keep Custom Dimensions (value: none) for the default 1280x800 desktop viewport or to set Width and Height under Options. Other values: iphone12, iphonex, iphone678, iphone678_plus, pixel2, pixel2_xl, ipad, ipadpro, wxga_s, wxga_l, sxga, wsxga_plus.',
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
		options: [
			{
				name: 'Custom Dimensions',
				value: 'none',
			},
			{
				name: 'iPhone 12 (390×844)',
				value: 'iphone12',
			},
			{
				name: 'iPhone X (375×812)',
				value: 'iphonex',
			},
			{
				name: 'iPhone 6/7/8 (375×667)',
				value: 'iphone678',
			},
			{
				name: 'iPhone 6/7/8 Plus (414×736)',
				value: 'iphone678_plus',
			},
			{
				name: 'Pixel 2 (411×731)',
				value: 'pixel2',
			},
			{
				name: 'Pixel 2 XL (411×823)',
				value: 'pixel2_xl',
			},
			{
				name: 'iPad (768×1024)',
				value: 'ipad',
			},
			{
				name: 'iPad Pro (1024×1366)',
				value: 'ipadpro',
			},
			{
				name: 'HD (1280×800)',
				value: 'wxga_s',
			},
			{
				name: 'HD+ (1366×768)',
				value: 'wxga_l',
			},
			{
				name: 'SXGA (1280×1024)',
				value: 'sxga',
			},
			{
				name: 'WSXGA+ (1680×1050)',
				value: 'wsxga_plus',
			},
		],
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		default: 'png',
		description:
			'File type to produce: png (default, lossless image), jpeg (smaller image file) or pdf (an A4 PDF of the page instead of an image). The webp value is not officially supported by the API; use png or jpeg.',
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
		options: [
			{
				name: 'PNG',
				value: 'png',
			},
			{
				name: 'JPEG',
				value: 'jpeg',
			},
			{
				name: 'WebP',
				value: 'webp',
			},
			{
				name: 'PDF',
				value: 'pdf',
			},
		],
	},
	{
		displayName: 'Full Page',
		name: 'fullPage',
		type: 'boolean',
		default: false,
		description:
			'Whether to capture the full scrollable height of the page instead of only the visible viewport. Use true for a whole-page capture, false for the top of the page. Has no effect when a Device Preset other than Custom Dimensions is selected.',
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
	},
	{
		displayName: 'Download File',
		name: 'downloadBinary',
		type: 'boolean',
		default: true,
		description:
			'Whether to download the captured file and attach it to the output item as binary data in the "data" property. Turn off to return only JSON with screenshotUrl, a public link to the stored file that works for 30 days. Off is faster and is the right setting when the node is used as an AI Agent tool, because agents receive the JSON output only.',
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
	},

	// Options Collection (Advanced Settings)
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
		options: [
			// Viewport Options
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 1280,
				description:
					'Viewport width in CSS pixels, e.g. 1280 or 1920. Only applied when Device Preset is Custom Dimensions. Leave unset for the API default of 1280.',
				typeOptions: {
					minValue: 100,
					maxValue: 3840,
				},
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 800,
				description:
					'Viewport height in CSS pixels, e.g. 800 or 1080. Only applied when Device Preset is Custom Dimensions. Leave unset for the API default of 800.',
				typeOptions: {
					minValue: 100,
					maxValue: 16384,
				},
			},
			{
				displayName: 'Device Scale Factor',
				name: 'deviceFactor',
				type: 'options',
				default: '1',
				description:
					'Device pixel ratio: 1 (standard), 2 (retina, twice the pixel dimensions) or 3. Keep 1 unless a sharper image is needed; higher values produce larger files.',
				options: [
					{
						name: '1x (Standard)',
						value: '1',
					},
					{
						name: '2x (Retina)',
						value: '2',
					},
					{
						name: '3x (High DPI)',
						value: '3',
					},
				],
			},

			// Timing Options
			{
				displayName: 'Wait Until',
				name: 'waitUntil',
				type: 'options',
				default: 'networkidle2',
				description:
					'Page load event to wait for before capturing: networkidle2 (default), networkidle0, domcontentloaded or load. If a capture times out on a heavy page, use domcontentloaded, which is the fastest.',
				options: [
					{
						name: 'Network Idle (Recommended)',
						value: 'networkidle2',
						description: 'Default. Waits until there are at most 2 open network connections for 500 ms.',
					},
					{
						name: 'Network Idle (Strict)',
						value: 'networkidle0',
						description: 'Waits until there are no open network connections for 500 ms',
					},
					{
						name: 'DOM Content Loaded',
						value: 'domcontentloaded',
						description:
							'Waits until the HTML is parsed; images and other resources may still be loading. Fastest and most reliable on heavy sites.',
					},
					{
						name: 'Load',
						value: 'load',
						description: 'Waits until the page and its resources have loaded',
					},
				],
			},
			{
				displayName: 'Additional Wait Time (ms)',
				name: 'timeWait',
				type: 'number',
				default: 0,
				description:
					'Extra time to wait after the page has loaded and before capturing, in milliseconds, e.g. 5000 for pages with animations or late-loading content. Leave at 0 to use the API default of 2000 ms.',
				typeOptions: {
					minValue: 0,
					maxValue: 30000,
				},
			},
			{
				displayName: 'Scroll Page First',
				name: 'scrollMotion',
				type: 'boolean',
				default: false,
				description:
					'Whether to scroll through the page before capturing so lazy-loaded content appears. The API already does this by default, so this toggle currently makes no difference whether it is on or off. Leave it unset.',
			},

			// Element Targeting
			{
				displayName: 'Capture Specific Element',
				name: 'element',
				type: 'string',
				default: '',
				placeholder: '#main-content, .hero-section',
				description:
					'CSS selector of the single element to capture, e.g. #pricing or .hero. Leave empty to capture the viewport or full page. The capture fails if the selector matches nothing on the page.',
			},
			{
				displayName: 'Hide Elements',
				name: 'hideElement',
				type: 'string',
				default: '',
				placeholder: '.ads, #popup, .cookie-banner',
				description:
					'CSS selector of elements to hide (display: none) before capturing, e.g. .ads or #popup. Separate several selectors with commas, e.g. .ads, #popup. Leave empty to hide nothing.',
			},
			{
				displayName: 'Click Before Capture',
				name: 'clickBefore',
				type: 'string',
				default: '',
				placeholder: '#accept-cookies, .close-modal',
				description:
					'CSS selector of one element to click before capturing, e.g. #accept-cookies or button.close-modal. Leave empty to click nothing. The capture can fail if the selector matches nothing on the page.',
			},

			// Page Modifications
			{
				displayName: 'Hide Cookie Banners',
				name: 'hideCookie',
				type: 'boolean',
				default: true,
				description:
					'Whether to hide common cookie consent banners before capturing. The API does this by default; set to false only to keep the banners visible in the capture.',
			},
			{
				displayName: 'Highlight Text',
				name: 'highlight',
				type: 'string',
				default: '',
				placeholder: 'important keyword',
				description:
					'Keyword or phrase to highlight wherever it appears on the page before capturing, e.g. pricing. Leave empty for no highlighting.',
			},
			{
				displayName: 'Custom CSS',
				name: 'customCss',
				type: 'string',
				default: '',
				placeholder: 'body { background: white; }',
				description:
					'CSS rules injected into the page before capturing, e.g. body { background: white; } or .banner { display: none; }. Leave empty to inject nothing.',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName: 'Custom JavaScript',
				name: 'customJs',
				type: 'string',
				default: '',
				placeholder: "document.querySelector('.popup').remove();",
				description:
					'JavaScript run in the page before capturing. Example: document.querySelector(".popup").remove(). Leave empty to run nothing.',
				typeOptions: {
					rows: 3,
				},
			},

			// PDF Options
			{
				displayName: 'PDF Paper Format',
				name: 'pdfPaper',
				type: 'options',
				default: 'a4',
				description:
					'Not currently supported by the API; has no effect. PDFs are always A4. The field is kept so saved workflows stay valid.',
				options: [
					{
						name: 'Letter',
						value: 'letter',
					},
					{
						name: 'Legal',
						value: 'legal',
					},
					{
						name: 'Tabloid',
						value: 'tabloid',
					},
					{
						name: 'A4',
						value: 'a4',
					},
					{
						name: 'A3',
						value: 'a3',
					},
				],
			},

			// Delivery Options
			{
				displayName: 'Email Screenshot To',
				name: 'emailTo',
				type: 'string',
				default: '',
				placeholder: 'user@example.com',
				description:
					'Email address the API sends the capture to, e.g. user@example.com. Leave empty to send no email.',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhook',
				type: 'string',
				default: '',
				placeholder: 'https://your-server.com/webhook',
				description:
					'Address that receives an HTTP POST with the capture result once the capture is done, e.g. https://example.com/hooks/screenshot. The node still waits for the capture and returns the result itself. Leave empty to call no webhook.',
			},

			// Filename Options
			{
				displayName: 'Use URL as Filename',
				name: 'urlFilename',
				type: 'boolean',
				default: false,
				description:
					'Whether to name the stored image file after the captured page address instead of a random string. This only changes the file name inside screenshotUrl. Does not apply to PDF output.',
			},
			{
				displayName: 'Filename Prefix',
				name: 'filenamePrefix',
				type: 'string',
				default: '',
				placeholder: 'project-screenshots',
				description: 'Custom prefix path for the stored screenshot file',
			},

			// Authentication
			{
				displayName: 'HTTP Basic Auth Username',
				name: 'authUser',
				type: 'string',
				default: '',
				description:
					'Not currently supported by the API; has no effect. The value is not sent. The field is kept so saved workflows stay valid.',
			},
			{
				displayName: 'HTTP Basic Auth Password',
				name: 'authPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description:
					'Not currently supported by the API; has no effect. The value is not sent. The field is kept so saved workflows stay valid.',
			},
		],
	},
];

export const screenshotDescription = {
	name: 'screenshot',
	value: 'screenshot',
	description:
		'Capture a public web page as a PNG or JPEG screenshot or an A4 PDF. Returns screenshotUrl, a public link to the stored file that works for 30 days, plus the file itself as binary data unless Download File is off. Each call uses 1 screenshot of the monthly quota, including failed captures.',
	action: 'Capture a screenshot or PDF of a web page',
};
