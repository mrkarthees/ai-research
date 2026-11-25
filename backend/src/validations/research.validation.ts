import Joi from 'joi';

export const researchCreateValidation = Joi.object({
	websiteUrl: Joi.string()
		.trim()
		.uri({
			scheme: ['http', 'https'],
		})
		.max(2048)
		.required(),
});
