import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GetScreenshotApi implements ICredentialType {
	name = 'getScreenshotApi';

	displayName = 'GetScreenshot API';

	documentationUrl = 'https://docs.rasterwise.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your GetScreenshot API key. Find it in your dashboard at getscreenshotapi.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				apikey: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.rasterwise.com',
			url: '/v1/get-screenshot/validate-key',
		},
	};
}
