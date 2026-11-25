import Joi from 'joi';

export const userCreateValidation = Joi.object({
	name: Joi.string().trim().min(2).max(100).required(),

	email: Joi.string().trim().email().max(150).required(),

	password: Joi.string().min(8).max(100).required(),

	age: Joi.number().integer().min(18).max(120).optional(),

	username: Joi.string()
		.trim()
		.min(3)
		.max(50)
		.pattern(/^[a-zA-Z0-9_]+$/)
		.optional(),

	phone_number: Joi.string()
		.trim()
		.pattern(/^\+?[0-9]{10,15}$/)
		.optional(),
});

export const userLoginValidation = Joi.object({
	email: Joi.string().trim().email().required(),

	password: Joi.string().min(8).max(100).required(),
});

export const userUpdateValidation = Joi.object({
	name: Joi.string().trim().min(2).max(100).optional(),

	age: Joi.number().integer().min(18).max(120).optional(),

	username: Joi.string()
		.trim()
		.min(3)
		.max(50)
		.pattern(/^[a-zA-Z0-9_]+$/)
		.optional(),

	phone_number: Joi.string()
		.trim()
		.pattern(/^\+?[0-9]{10,15}$/)
		.optional(),
}).min(1);
