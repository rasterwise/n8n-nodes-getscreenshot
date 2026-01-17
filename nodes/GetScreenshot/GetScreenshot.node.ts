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
import { usageDescription } from './actions/usage.operation';

export class GetScreenshot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GetScreenshot',
		name: 'getScreenshot',
		icon: 'file:getscreenshot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Capture screenshots and PDFs of web pages using GetScreenshot API',
		defaults: {
			name: 'GetScreenshot',
		},
		inputs: ['main'],
		outputs: ['main'],
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
	if (outputFormat === 'pdf') {
		queryParams.pdf = 'true';
		if (options.pdfPaper) {
			queryParams.pdfpaper = options.pdfPaper;
		}
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
	if (options.urlFilename) {
		queryParams.urlfilename = 'true';
	}
	if (options.filenamePrefix) {
		queryParams.filenameprefix = options.filenamePrefix;
	}

	// Add authentication
	if (options.authUser) {
		queryParams.authuser = options.authUser;
	}
	if (options.authPassword) {
		queryParams.authpassword = options.authPassword;
	}

	// Make the API request
	const response = await this.helpers.requestWithAuthentication.call(
		this,
		'getScreenshotApi',
		{
			method: 'GET',
			url: 'https://api.rasterwise.com/v1/get-screenshot',
			qs: queryParams,
			json: true,
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

	// Download the screenshot binary data
	const screenshotUrl = response.screenshotImage || response.screenshotPDF;

	if (!screenshotUrl) {
		throw new NodeOperationError(
			this.getNode(),
			'No screenshot URL returned from API',
			{ itemIndex },
		);
	}

	// Fetch the binary data
	const binaryResponse = await this.helpers.request({
		method: 'GET',
		url: screenshotUrl,
		encoding: null,
		resolveWithFullResponse: true,
	});

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

	// Create binary data object
	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(binaryResponse.body),
		`screenshot.${fileExtension}`,
		mimeType,
	);

	// Return both JSON metadata and binary data
	return {
		json: {
			status: response.status,
			url: response.url,
			screenshotUrl,
			width: response.width,
			height: response.height,
			format: outputFormat,
			fullPage,
			preset: preset !== 'none' ? preset : undefined,
			capturedAt: new Date().toISOString(),
		},
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
	const response = await this.helpers.requestWithAuthentication.call(
		this,
		'getScreenshotApi',
		{
			method: 'GET',
			url: 'https://api.rasterwise.com/v1/usage',
			json: true,
		},
	);

	return {
		json: {
			usedQuota: response.usedQuota,
			remainingQuota: response.remainingQuota,
			totalQuota: response.totalQuota,
			planName: response.planName,
			resetDate: response.resetDate,
		},
		pairedItem: { item: itemIndex },
	};
}
