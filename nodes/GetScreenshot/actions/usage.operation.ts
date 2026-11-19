import type { INodeProperties } from 'n8n-workflow';

/**
 * The usage endpoint rejects requests without an `email` query parameter but accepts
 * any non-empty value; the result depends on the API key alone. This value is sent
 * when the Account Email field is left empty.
 */
export const USAGE_EMAIL_PLACEHOLDER = 'n8n@getscreenshotapi.com';

export const usageProperties: INodeProperties[] = [
	{
		displayName: 'Account Email',
		name: 'accountEmail',
		type: 'string',
		default: '',
		placeholder: 'you@example.com',
		description:
			'Email address of the GetScreenshot account, e.g. you@example.com. Optional: the usage figures depend on the API key alone, and the API only needs some value here. Leave empty and the node sends a placeholder.',
		displayOptions: {
			show: {
				operation: ['usage'],
			},
		},
	},
];

export const usageDescription = {
	name: 'usage',
	value: 'usage',
	description:
		'Get the quota for the API key: screenshots used in the current period (usedQuota), the monthly allowance (limit), how many are left (remaining) and the date the count resets (quotaRestartDate). Takes no input. Each call uses 1 screenshot of the monthly quota.',
	action: 'Get API usage and remaining quota',
};
