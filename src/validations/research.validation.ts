import Joi from 'joi';

export const createResearchValidation = Joi.object({
	company_id: Joi.number().integer().positive().required(),
}).unknown(false);
