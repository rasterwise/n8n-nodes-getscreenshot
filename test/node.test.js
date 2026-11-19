'use strict';

// Runs against the built node in dist/ (npm test builds first). No network: the two
// HTTP helpers n8n gives a node are stubbed, and the test asserts on what the node
// asks them to do and on the items it returns.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { GetScreenshot } = require(
	path.join(__dirname, '..', 'dist', 'nodes', 'GetScreenshot', 'GetScreenshot.node.js'),
);

const IMAGE_URL = 'https://storage.googleapis.com/getscreenshot-storage/imageAbC123xYz9.png';
const PDF_URL = 'https://storage.googleapis.com/getscreenshot-storage/pdfAbC123xYz9.pdf';

// Response bodies as documented for the API.
const IMAGE_RESPONSE = {
	status: 'success',
	originUrl: 'https://example.com',
	pageStatus: 200,
	captureDate: '2026/11/18',
	captureHour: '14:03:22',
	aiAnalysis: null,
	screenshotImage: IMAGE_URL,
};
const PDF_RESPONSE = {
	status: 'success',
	originUrl: 'https://example.com',
	pageStatus: 200,
	captureDate: '2026/11/18',
	captureHour: '14:03:22',
	aiAnalysis: null,
	pdfFile: PDF_URL,
};
const USAGE_RESPONSE = {
	usedQuota: 123,
	remainingQuota: { limit: 6000, offset: 0, period: 'MONTH' },
	quotaRestartDate: '2026-12-01',
};

// The parameters a workflow saved with 1.0.2 holds for an untouched screenshot node.
// It has no `downloadBinary`: that parameter did not exist yet.
const SAVED_1_0_2_DEFAULTS = {
	operation: 'screenshot',
	url: 'https://example.com',
	preset: 'none',
	outputFormat: 'png',
	fullPage: false,
	options: {},
};

/**
 * Minimal stand-in for n8n's IExecuteFunctions. Like n8n, getNodeParameter returns the
 * fallback when the saved workflow has no value for a parameter.
 */
function makeContext(parameters, apiResponse) {
	const calls = { api: [], downloads: [], binaries: [] };
	const context = {
		calls,
		getInputData: () => [{ json: {} }],
		getNodeParameter(name, _itemIndex, fallback) {
			if (Object.prototype.hasOwnProperty.call(parameters, name)) return parameters[name];
			if (arguments.length >= 3) return fallback;
			throw new Error(`Test context has no value for parameter "${name}"`);
		},
		getNode: () => ({ name: 'GetScreenshot', type: 'n8n-nodes-getscreenshot.getScreenshot' }),
		continueOnFail: () => false,
		helpers: {
			async httpRequestWithAuthentication(credentialType, requestOptions) {
				calls.api.push({ credentialType, requestOptions });
				return apiResponse;
			},
			async httpRequest(requestOptions) {
				calls.downloads.push(requestOptions);
				return Buffer.from('file-bytes');
			},
			async prepareBinaryData(buffer, fileName, mimeType) {
				calls.binaries.push({ fileName, mimeType });
				return { data: buffer.toString('base64'), fileName, mimeType };
			},
		},
	};
	return context;
}

async function run(parameters, apiResponse) {
	const context = makeContext(parameters, apiResponse);
	const [items] = await new GetScreenshot().execute.call(context);
	return { context, item: items[0], request: context.calls.api[0]?.requestOptions };
}

test('screenshot: request query for each parameter set', async (t) => {
	const cases = [
		{
			name: 'a workflow saved with 1.0.2 defaults sends only the url',
			parameters: SAVED_1_0_2_DEFAULTS,
			expectedQuery: { url: 'https://example.com' },
		},
		{
			name: 'Use URL as Filename is sent as urlasfilename',
			parameters: { ...SAVED_1_0_2_DEFAULTS, options: { urlFilename: true } },
			expectedQuery: { url: 'https://example.com', urlasfilename: 'true' },
		},
		{
			name: 'PDF output sends pdf=true and no paper size',
			parameters: {
				...SAVED_1_0_2_DEFAULTS,
				outputFormat: 'pdf',
				options: { pdfPaper: 'letter' },
			},
			response: PDF_RESPONSE,
			expectedQuery: { url: 'https://example.com', pdf: 'true' },
		},
		{
			name: 'basic auth fields are not sent',
			parameters: {
				...SAVED_1_0_2_DEFAULTS,
				options: { authUser: 'someone', authPassword: 'not-a-real-password' },
			},
			expectedQuery: { url: 'https://example.com' },
		},
		{
			name: 'Scroll Page First off sends nothing (unchanged from 1.0.2)',
			parameters: { ...SAVED_1_0_2_DEFAULTS, options: { scrollMotion: false } },
			expectedQuery: { url: 'https://example.com' },
		},
		{
			name: 'every supported option maps to its API parameter',
			parameters: {
				operation: 'screenshot',
				url: 'https://example.com/pricing',
				preset: 'none',
				outputFormat: 'jpeg',
				fullPage: true,
				downloadBinary: true,
				options: {
					width: 1920,
					height: 1080,
					deviceFactor: '2',
					waitUntil: 'domcontentloaded',
					timeWait: 5000,
					scrollMotion: true,
					element: '#pricing',
					hideElement: '.ads, #popup',
					clickBefore: '#accept-cookies',
					hideCookie: false,
					highlight: 'pricing',
					customCss: 'body { background: white; }',
					customJs: 'document.title = "x";',
					emailTo: 'user@example.com',
					webhook: 'https://example.com/hooks/screenshot',
					filenamePrefix: 'project-screenshots',
				},
			},
			expectedQuery: {
				url: 'https://example.com/pricing',
				width: 1920,
				height: 1080,
				format: 'jpeg',
				fullpage: 'true',
				devicefactor: '2',
				waituntil: 'domcontentloaded',
				timewait: 5000,
				scrollmotion: 'true',
				element: '#pricing',
				hideelement: '.ads, #popup',
				click: '#accept-cookies',
				hidecookie: 'false',
				highlight: 'pricing',
				customcss: 'body { background: white; }',
				customjs: 'document.title = "x";',
				email: 'user@example.com',
				webhook: 'https://example.com/hooks/screenshot',
				filenameprefix: 'project-screenshots',
			},
		},
		{
			name: 'a device preset replaces width and height',
			parameters: {
				...SAVED_1_0_2_DEFAULTS,
				preset: 'iphone12',
				options: { width: 1920, height: 1080 },
			},
			expectedQuery: { url: 'https://example.com', preset: 'iphone12' },
		},
	];

	for (const { name, parameters, response, expectedQuery } of cases) {
		await t.test(name, async () => {
			const { context, request } = await run(parameters, response ?? IMAGE_RESPONSE);

			assert.equal(context.calls.api.length, 1);
			assert.equal(context.calls.api[0].credentialType, 'getScreenshotApi');
			assert.equal(request.method, 'GET');
			assert.equal(request.url, 'https://api.rasterwise.com/v1/get-screenshot');
			assert.deepEqual(request.qs, expectedQuery);
		});
	}
});

test('screenshot: a 1.0.2 workflow still gets its JSON fields and the file, plus the API fields', async () => {
	const { context, item } = await run(SAVED_1_0_2_DEFAULTS, IMAGE_RESPONSE);

	// What 1.0.2 produced for this response.
	assert.equal(item.json.status, 'success');
	assert.equal(item.json.screenshotUrl, IMAGE_URL);
	assert.equal(item.json.format, 'png');
	assert.equal(item.json.fullPage, false);
	assert.equal(item.json.preset, undefined);
	assert.match(item.json.capturedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	assert.deepEqual(item.pairedItem, { item: 0 });

	// The file is downloaded from the returned link and attached as `data`.
	assert.equal(context.calls.downloads.length, 1);
	assert.equal(context.calls.downloads[0].url, IMAGE_URL);
	assert.equal(context.calls.downloads[0].method, 'GET');
	assert.equal(context.calls.downloads[0].encoding, 'arraybuffer');
	assert.equal(item.binary.data.mimeType, 'image/png');
	assert.equal(item.binary.data.fileName, 'screenshot.png');

	// Added in 1.1.0: fields the API actually returns.
	assert.equal(item.json.originUrl, 'https://example.com');
	assert.equal(item.json.pageStatus, 200);
	assert.equal(item.json.captureDate, '2026/11/18');
	assert.equal(item.json.captureHour, '14:03:22');
	assert.equal(item.json.url, 'https://example.com');

	// Keys that exist since 1.0.0 stay in the item even though the API has no value for them.
	for (const key of ['width', 'height']) {
		assert.ok(key in item.json, `output key "${key}" is missing`);
	}
});

test('screenshot: PDF output reads the link the API returns', async (t) => {
	const pdfParameters = { ...SAVED_1_0_2_DEFAULTS, outputFormat: 'pdf' };

	await t.test('pdfFile, the documented field', async () => {
		const { context, item } = await run(pdfParameters, PDF_RESPONSE);

		assert.equal(item.json.screenshotUrl, PDF_URL);
		assert.equal(item.json.format, 'pdf');
		assert.equal(context.calls.downloads[0].url, PDF_URL);
		assert.equal(item.binary.data.mimeType, 'application/pdf');
		assert.equal(item.binary.data.fileName, 'screenshot.pdf');
	});

	await t.test('screenshotPDF, the field 1.0.x read, still works as a fallback', async () => {
		const legacyResponse = { status: 'success', screenshotPDF: PDF_URL };
		const { item } = await run(pdfParameters, legacyResponse);

		assert.equal(item.json.screenshotUrl, PDF_URL);
	});

	await t.test('a response without any file link is an error', async () => {
		await assert.rejects(
			run(pdfParameters, { status: 'success' }),
			/No screenshot URL returned from API/,
		);
	});
});

test('screenshot: Download File off returns the link without fetching the file', async () => {
	const { context, item } = await run(
		{ ...SAVED_1_0_2_DEFAULTS, downloadBinary: false },
		IMAGE_RESPONSE,
	);

	assert.equal(context.calls.api.length, 1);
	assert.equal(context.calls.downloads.length, 0);
	assert.equal(context.calls.binaries.length, 0);
	assert.equal(item.binary, undefined);
	assert.equal(item.json.screenshotUrl, IMAGE_URL);
	assert.equal(item.json.originUrl, 'https://example.com');
	assert.deepEqual(item.pairedItem, { item: 0 });
});

test('usage: sends the email parameter the endpoint requires', async (t) => {
	await t.test('a workflow saved with 1.0.2 (no Account Email) sends the placeholder', async () => {
		const { context, request } = await run({ operation: 'usage' }, USAGE_RESPONSE);

		assert.equal(context.calls.api[0].credentialType, 'getScreenshotApi');
		assert.equal(request.method, 'GET');
		assert.equal(request.url, 'https://api.rasterwise.com/v1/usage');
		assert.deepEqual(request.qs, { email: 'n8n@getscreenshotapi.com' });
	});

	await t.test('Account Email is sent when filled in', async () => {
		const { request } = await run(
			{ operation: 'usage', accountEmail: ' owner@example.com ' },
			USAGE_RESPONSE,
		);

		assert.deepEqual(request.qs, { email: 'owner@example.com' });
	});
});

test('usage: output has the raw API fields, the computed remaining count and the 1.0.x keys', async () => {
	const { item } = await run({ operation: 'usage' }, USAGE_RESPONSE);

	assert.deepEqual(item.json, {
		usedQuota: 123,
		remainingQuota: { limit: 6000, offset: 0, period: 'MONTH' },
		limit: 6000,
		remaining: 5877,
		quotaRestartDate: '2026-12-01',
		totalQuota: 6000,
		planName: undefined,
		resetDate: '2026-12-01',
	});
	assert.ok('planName' in item.json);
});

// Saved workflows store parameter names and option values, and rely on defaults for
// anything the user never touched. This is the list published in 1.0.2; every entry
// must still exist with the same default and still accept the same values.
test('parameters published in 1.0.2 keep their names, defaults and option values', () => {
	const published = {
		top: {
			operation: { default: 'screenshot', values: ['screenshot', 'usage'] },
			url: { default: '' },
			preset: {
				default: 'none',
				values: [
					'none',
					'iphone12',
					'iphonex',
					'iphone678',
					'iphone678_plus',
					'pixel2',
					'pixel2_xl',
					'ipad',
					'ipadpro',
					'wxga_s',
					'wxga_l',
					'sxga',
					'wsxga_plus',
				],
			},
			outputFormat: { default: 'png', values: ['png', 'jpeg', 'webp', 'pdf'] },
			fullPage: { default: false },
			options: { default: {} },
		},
		options: {
			width: { default: 1280 },
			height: { default: 800 },
			deviceFactor: { default: '1', values: ['1', '2', '3'] },
			waitUntil: {
				default: 'networkidle2',
				values: ['networkidle2', 'networkidle0', 'domcontentloaded', 'load'],
			},
			timeWait: { default: 0 },
			scrollMotion: { default: false },
			element: { default: '' },
			hideElement: { default: '' },
			clickBefore: { default: '' },
			hideCookie: { default: true },
			highlight: { default: '' },
			customCss: { default: '' },
			customJs: { default: '' },
			pdfPaper: { default: 'a4', values: ['letter', 'legal', 'tabloid', 'a4', 'a3'] },
			emailTo: { default: '' },
			webhook: { default: '' },
			urlFilename: { default: false },
			filenamePrefix: { default: '' },
			authUser: { default: '' },
			authPassword: { default: '' },
		},
	};

	const { description } = new GetScreenshot();
	assert.equal(description.name, 'getScreenshot');
	assert.equal(description.version, 1);
	assert.deepEqual(description.credentials, [{ name: 'getScreenshotApi', required: true }]);

	const optionsCollection = description.properties.find((p) => p.name === 'options');
	const groups = [
		['top', description.properties],
		['options', optionsCollection.options],
	];

	for (const [group, properties] of groups) {
		for (const [name, expected] of Object.entries(published[group])) {
			const property = properties.find((p) => p.name === name);
			assert.ok(property, `parameter "${name}" was removed or renamed`);
			assert.deepEqual(property.default, expected.default, `default of "${name}" changed`);
			if (expected.values) {
				const values = property.options.map((option) => option.value);
				for (const value of expected.values) {
					assert.ok(values.includes(value), `"${name}" no longer accepts "${value}"`);
				}
			}
		}
	}
});
