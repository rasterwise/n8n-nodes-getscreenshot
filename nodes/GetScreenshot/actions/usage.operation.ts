import type { INodeProperties } from 'n8n-workflow';

export const usageProperties: INodeProperties[] = [];

export const usageDescription = {
	name: 'usage',
	value: 'usage',
	description: 'Get current API usage and quota information',
	action: 'Get API usage quota',
};
