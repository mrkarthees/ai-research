import Joi from 'joi';

export const createCompanyValidation = Joi.object({
	company_name: Joi.string().trim().min(2).max(255).required(),

	website_url: Joi.string()
		.trim()
		.uri({
			scheme: ['http', 'https'],
		})
		.max(500)
		.required(),

	industry: Joi.string().trim().max(150).allow('', null).optional(),

	description: Joi.string().allow('', null).optional(),

	headquarters: Joi.string().trim().max(255).allow('', null).optional(),
}).unknown(false);

export const updateCompanyValidation = Joi.object({
	company_name: Joi.string().trim().min(2).max(255).optional(),

	website_url: Joi.string()
		.trim()
		.uri({
			scheme: ['http', 'https'],
		})
		.max(500)
		.optional(),

	industry: Joi.string().trim().max(150).allow('', null).optional(),

	description: Joi.string().allow('', null).optional(),

	headquarters: Joi.string().trim().max(255).allow('', null).optional(),
})
	.min(1)
	.unknown(false);
