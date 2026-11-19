import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	screenshotProperties,
	screenshotDescription,
} from './actions/screenshot.operation';
import {
	usageProperties,
	usageDescription,
	USAGE_EMAIL_PLACEHOLDER,
} from './actions/usage.operation';

export class GetScreenshot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GetScreenshot',
		name: 'getScreenshot',
		icon: 'file:getscreenshot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Capture a screenshot (PNG or JPEG) or a PDF of a public web page and get a link to the stored file, or check how much of the monthly API quota is used',
		defaults: {
			name: 'GetScreenshot',
		},
		inputs: ['main'],
		outputs: ['main'],
		// Lets n8n expose this node as a tool for AI Agents (the "GetScreenshot Tool" variant).
		usableAsTool: true,
		credentials: [
			{
				name: 'getScreenshotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'screenshot',
				options: [screenshotDescription, usageDescription],
			},
			...screenshotProperties,
			...usageProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'screenshot') {
					const result = await executeScreenshot.call(this, i);
					returnData.push(result);
				} else if (operation === 'usage') {
					const result = await executeUsage.call(this, i);
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function executeScreenshot(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const url = this.getNodeParameter('url', itemIndex) as string;
	const preset = this.getNodeParameter('preset', itemIndex) as string;
	const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
	const fullPage = this.getNodeParameter('fullPage', itemIndex) as boolean;
	// Added in 1.1.0. Workflows saved with an earlier version do not have this parameter,
	// so the fallback keeps their behaviour (download the file).
	const downloadBinary = this.getNodeParameter('downloadBinary', itemIndex, true) as boolean;
	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

	// Validate URL
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		throw new NodeOperationError(
			this.getNode(),
			'URL must start with http:// or https://',
			{ itemIndex },
		);
	}

	// Build query parameters
	const queryParams: IDataObject = {
		url,
	};

	// Add preset if not custom
	if (preset && preset !== 'none' && !preset.includes('_header')) {
		queryParams.preset = preset;
	}

	// Add custom dimensions if preset is none
	if (preset === 'none') {
		if (options.width) {
			queryParams.width = options.width;
		}
		if (options.height) {
			queryParams.height = options.height;
		}
	}

	// Add output format
	// options.pdfPaper is not sent: the API has no paper size parameter (PDFs are always A4).
	if (outputFormat === 'pdf') {
		queryParams.pdf = 'true';
	} else if (outputFormat !== 'png') {
		queryParams.format = outputFormat;
	}

	// Add full page
	if (fullPage) {
		queryParams.fullpage = 'true';
	}

	// Add device scale factor
	if (options.deviceFactor && options.deviceFactor !== '1') {
		queryParams.devicefactor = options.deviceFactor;
	}

	// Add timing options
	if (options.waitUntil && options.waitUntil !== 'networkidle2') {
		queryParams.waituntil = options.waitUntil;
	}
	if (options.timeWait) {
		queryParams.timewait = options.timeWait;
	}
	// The API scrolls by default (scrollmotion=true), so this only restates the default.
	// Sending scrollmotion=false when the toggle is off is not done here on purpose: the
	// field's default is false, so that would turn scrolling off for every saved workflow.
	if (options.scrollMotion) {
		queryParams.scrollmotion = 'true';
	}

	// Add element targeting
	if (options.element) {
		queryParams.element = options.element;
	}
	if (options.hideElement) {
		queryParams.hideelement = options.hideElement;
	}
	if (options.clickBefore) {
		queryParams.click = options.clickBefore;
	}

	// Add page modifications
	if (options.hideCookie === false) {
		queryParams.hidecookie = 'false';
	}
	if (options.highlight) {
		queryParams.highlight = options.highlight;
	}
	if (options.customCss) {
		queryParams.customcss = options.customCss;
	}
	if (options.customJs) {
		queryParams.customjs = options.customJs;
	}

	// Add delivery options
	if (options.emailTo) {
		queryParams.email = options.emailTo;
	}
	if (options.webhook) {
		queryParams.webhook = options.webhook;
	}

	// Add filename options
	// The API parameter is `urlasfilename` (1.0.x sent `urlfilename`, which the API ignores).
	if (options.urlFilename) {
		queryParams.urlasfilename = 'true';
	}
	if (options.filenamePrefix) {
		queryParams.filenameprefix = options.filenamePrefix;
	}

	// options.authUser / options.authPassword are not sent: the API has no HTTP basic
	// auth parameters and ignored them.

	// Make the API request
	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'getScreenshotApi',
		{
			method: 'GET',
			url: 'https://api.rasterwise.com/v1/get-screenshot',
			qs: queryParams,
		},
	);

	// Check for API errors
	if (response.status === 'failed') {
		throw new NodeOperationError(
			this.getNode(),
			`Screenshot capture failed: ${response.message || 'Unknown error'}`,
			{ itemIndex },
		);
	}

	if (response.status === 'denied') {
		throw new NodeOperationError(
			this.getNode(),
			`Access denied: ${response.message || 'Rate limit exceeded or invalid API key'}`,
			{ itemIndex },
		);
	}

	// Locate the stored file. Images come back as `screenshotImage`. With pdf=true the API
	// returns `pdfFile` and no `screenshotImage`. `screenshotPDF` is what 1.0.x read and is
	// kept as a fallback.
	const pdfUrl = response.pdfFile || response.screenshotPDF;
	const screenshotUrl =
		outputFormat === 'pdf'
			? pdfUrl || response.screenshotImage
			: response.screenshotImage || pdfUrl;

	if (!screenshotUrl) {
		throw new NodeOperationError(
			this.getNode(),
			'No screenshot URL returned from API',
			{ itemIndex },
		);
	}

	// Determine MIME type and file extension
	let mimeType: string;
	let fileExtension: string;

	if (outputFormat === 'pdf') {
		mimeType = 'application/pdf';
		fileExtension = 'pdf';
	} else if (outputFormat === 'jpeg') {
		mimeType = 'image/jpeg';
		fileExtension = 'jpg';
	} else if (outputFormat === 'webp') {
		mimeType = 'image/webp';
		fileExtension = 'webp';
	} else {
		mimeType = 'image/png';
		fileExtension = 'png';
	}

	const json: IDataObject = {
		status: response.status,
		// `url`, `width` and `height` have been output keys since 1.0.0 but the API does not
		// return fields with those names. `url` now falls back to the captured page address.
		url: response.url ?? response.originUrl,
		screenshotUrl,
		width: response.width,
		height: response.height,
		format: outputFormat,
		fullPage,
		preset: preset !== 'none' ? preset : undefined,
		capturedAt: new Date().toISOString(),
		// Fields the API returns (dates and hours are UTC)
		originUrl: response.originUrl,
		pageStatus: response.pageStatus,
		captureDate: response.captureDate,
		captureHour: response.captureHour,
	};

	// Skip the download when the caller only needs the link (AI Agent tools, or workflows
	// that pass the URL on).
	if (!downloadBinary) {
		return {
			json,
			pairedItem: { item: itemIndex },
		};
	}

	// Fetch the binary data
	const binaryResponse = await this.helpers.httpRequest({
		method: 'GET',
		url: screenshotUrl,
		encoding: 'arraybuffer',
	} as any);

	// Create binary data object
	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(binaryResponse as Buffer),
		`screenshot.${fileExtension}`,
		mimeType,
	);

	// Return both JSON metadata and binary data
	return {
		json,
		binary: {
			data: binaryData,
		},
		pairedItem: { item: itemIndex },
	};
}

async function executeUsage(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	// The endpoint returns 400 without an `email` query parameter. Any non-empty value is
	// accepted; the figures depend on the API key alone.
	const accountEmail = (this.getNodeParameter('accountEmail', itemIndex, '') as string).trim();

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'getScreenshotApi',
		{
			method: 'GET',
			url: 'https://api.rasterwise.com/v1/usage',
			qs: {
				email: accountEmail || USAGE_EMAIL_PLACEHOLDER,
			},
		},
	);

	// `remainingQuota` is the plan quota object ({ limit, offset, period }), not a count.
	const usedQuota = response.usedQuota;
	const limit = response.remainingQuota?.limit;
	const usedNumber = toFiniteNumber(usedQuota);
	const limitNumber = toFiniteNumber(limit);
	const remaining =
		usedNumber !== undefined && limitNumber !== undefined ? limitNumber - usedNumber : undefined;
	const quotaRestartDate = response.quotaRestartDate;

	return {
		json: {
			usedQuota,
			remainingQuota: response.remainingQuota,
			limit,
			remaining,
			quotaRestartDate,
			// Keys output since 1.0.0. The API never returned fields with these names, so
			// they were always empty; they now carry the matching real values.
			totalQuota: response.totalQuota ?? limit,
			planName: response.planName,
			resetDate: response.resetDate ?? quotaRestartDate,
		},
		pairedItem: { item: itemIndex },
	};
}

function toFiniteNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}
