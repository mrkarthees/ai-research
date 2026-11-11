import Joi from 'joi';

export const crawlPageSchema = Joi.object({
	page_url: Joi.string()
		.trim()
		.uri({
			scheme: [/https?/],
		})
		.required()
		.messages({
			'string.empty': 'Page URL is required',
			'string.uri': 'Please provide a valid HTTP or HTTPS URL',
			'any.required': 'Page URL is required',
		}),
}).unknown(false);
