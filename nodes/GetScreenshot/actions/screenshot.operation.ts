import type { INodeProperties } from 'n8n-workflow';

export const screenshotProperties: INodeProperties[] = [
	// Essential Fields (Always Visible)
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com',
		description: 'The URL of the webpage to capture',
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
		description: 'Select a device preset or use custom dimensions',
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
		description: 'The format of the captured image',
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
		description: 'Whether to capture the full scrollable page instead of just the viewport',
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
				description: 'Viewport width in pixels (used when preset is "Custom Dimensions")',
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
				description: 'Viewport height in pixels (used when preset is "Custom Dimensions")',
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
				description: 'Device pixel ratio (Retina displays use 2x or 3x)',
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
				description: 'When to consider the page loaded',
				options: [
					{
						name: 'Network Idle (Recommended)',
						value: 'networkidle2',
						description: 'No more than 2 network connections for 500ms',
					},
					{
						name: 'Network Idle (Strict)',
						value: 'networkidle0',
						description: 'No network connections for 500ms',
					},
					{
						name: 'DOM Content Loaded',
						value: 'domcontentloaded',
						description: 'HTML fully parsed, resources may still load',
					},
					{
						name: 'Load',
						value: 'load',
						description: 'Page and all resources loaded',
					},
				],
			},
			{
				displayName: 'Additional Wait Time (ms)',
				name: 'timeWait',
				type: 'number',
				default: 0,
				description: 'Additional milliseconds to wait after the page loads',
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
				description: 'Whether to scroll through the page before capturing (triggers lazy-loaded content)',
			},

			// Element Targeting
			{
				displayName: 'Capture Specific Element',
				name: 'element',
				type: 'string',
				default: '',
				placeholder: '#main-content, .hero-section',
				description: 'CSS selector of a specific element to capture instead of the full viewport',
			},
			{
				displayName: 'Hide Elements',
				name: 'hideElement',
				type: 'string',
				default: '',
				placeholder: '.ads, #popup, .cookie-banner',
				description: 'CSS selectors of elements to hide before capturing (comma-separated)',
			},
			{
				displayName: 'Click Before Capture',
				name: 'clickBefore',
				type: 'string',
				default: '',
				placeholder: '#accept-cookies, .close-modal',
				description: 'CSS selector of an element to click before capturing',
			},

			// Page Modifications
			{
				displayName: 'Hide Cookie Banners',
				name: 'hideCookie',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically hide common cookie consent banners',
			},
			{
				displayName: 'Highlight Text',
				name: 'highlight',
				type: 'string',
				default: '',
				placeholder: 'important keyword',
				description: 'Text to highlight with a yellow marker on the page',
			},
			{
				displayName: 'Custom CSS',
				name: 'customCss',
				type: 'string',
				default: '',
				placeholder: 'body { background: white; }',
				description: 'Custom CSS to inject into the page before capturing',
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
				description: 'JavaScript to execute on the page before capturing',
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
				description: 'Paper size for PDF output',
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
				description: 'Email address to send the screenshot to',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhook',
				type: 'string',
				default: '',
				placeholder: 'https://your-server.com/webhook',
				description: 'URL to POST the screenshot result to',
			},

			// Filename Options
			{
				displayName: 'Use URL as Filename',
				name: 'urlFilename',
				type: 'boolean',
				default: false,
				description: 'Whether to use the captured URL as the filename instead of a random string',
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
				description: 'Username for HTTP Basic Authentication on the target page',
			},
			{
				displayName: 'HTTP Basic Auth Password',
				name: 'authPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Password for HTTP Basic Authentication on the target page',
			},
		],
	},
];

export const screenshotDescription = {
	name: 'screenshot',
	value: 'screenshot',
	description: 'Capture a screenshot or PDF of a webpage',
	action: 'Capture a screenshot of a URL',
};
