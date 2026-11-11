import Joi from 'joi';

const httpUrl = Joi.string().uri({ scheme: ['http', 'https'] });

const companySummarySchema = Joi.object({
	description: Joi.string().allow(null).required(),
	industry: Joi.string().allow(null).required(),
	business_model: Joi.string().allow(null).required(),
}).unknown(false);

const companyLocationSchema = Joi.object({
	location_type: Joi.string().allow(null).required(),
	address: Joi.string().allow(null).required(),
	city: Joi.string().allow(null).required(),
	state: Joi.string().allow(null).required(),
	country: Joi.string().allow(null).required(),
}).unknown(false);

const socialMediaLinksSchema = Joi.object({
	linkedin: httpUrl.allow(null).required(),
	instagram: httpUrl.allow(null).required(),
	facebook: httpUrl.allow(null).required(),
	x: httpUrl.allow(null).required(),
	youtube: httpUrl.allow(null).required(),
}).unknown(false);

const contactDetailsSchema = Joi.object({
	email: Joi.string().email().allow(null).required(),
	phone: Joi.string().max(50).allow(null).required(),
	contact_page_url: httpUrl.allow(null).required(),
}).unknown(false);

const totalWorkingMembersSchema = Joi.object({
	employee_count: Joi.number().integer().min(0).allow(null).required(),
	employee_range: Joi.string().max(100).allow(null).required(),
	is_estimate: Joi.boolean().required(),
	as_of_date: Joi.string().isoDate().allow(null).required(),
}).unknown(false);

const productServiceSchema = Joi.object({
	name: Joi.string().trim().max(255).required(),
	description: Joi.string().allow(null).required(),
	type: Joi.string().valid('product', 'service', 'both', 'unknown').required(),
}).unknown(false);

// Create research result
export const createResearchResultSchema = Joi.object({
	research_id: Joi.number().integer().positive().required(),

	company_summary: companySummarySchema.allow(null).optional(),

	company_locations: Joi.array()
		.items(companyLocationSchema)
		.allow(null)
		.optional(),

	social_media_links: socialMediaLinksSchema.allow(null).optional(),

	contact_details: contactDetailsSchema.allow(null).optional(),

	total_working_members: totalWorkingMembersSchema.allow(null).optional(),

	career_page_url: httpUrl.allow(null).optional(),

	products_services: Joi.array()
		.items(productServiceSchema)
		.allow(null)
		.optional(),
})
	.or(
		'company_summary',
		'company_locations',
		'social_media_links',
		'contact_details',
		'total_working_members',
		'career_page_url',
		'products_services',
	)
	.unknown(false);

// Create research result evidence
export const createResearchResultEvidenceSchema = Joi.object({
	research_id: Joi.number().integer().positive().required(),

	result_id: Joi.number().integer().positive().required(),

	field_name: Joi.string().trim().max(200).required(),

	source_url: httpUrl.required(),

	source_title: Joi.string().max(500).allow(null).optional(),

	evidence_text: Joi.string().trim().required(),

	confidence: Joi.number().min(0).max(1).allow(null).optional(),
}).unknown(false);
