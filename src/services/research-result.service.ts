import { sequelize } from '../config/db.config';

import { Researches } from '../models/research.model';
import { CompanyResearchResults } from '../models/company-research-result.model';
import { ResearchResultEvidences } from '../models/research-result-evidence.model';

import {
	CreateResearchResultDTO,
	CreateResearchResultEvidenceDTO,
} from '../dtos/research-result.dto';

// Save research result and its supporting evidence
export const saveResearchResult = async (
	data: CreateResearchResultDTO,
	evidences?: Omit<
		CreateResearchResultEvidenceDTO,
		'research_id' | 'result_id'
	>[],
) => {
	return await sequelize.transaction(async (transaction) => {
		// Check whether the research exists and is active
		const research = await Researches.findOne({
			where: {
				id: data.research_id,
				active: true,
			},
			transaction,
		});

		if (!research) {
			throw new Error('Research not found or inactive');
		}

		// Find existing result for this research
		let result = await CompanyResearchResults.findOne({
			where: {
				research_id: data.research_id,
			},
			transaction,
		});

		// Prepare result data
		// Only supplied fields will be updated
		const resultData = {
			...(data.company_summary !== undefined && {
				company_summary: data.company_summary,
			}),

			...(data.company_locations !== undefined && {
				company_locations: data.company_locations,
			}),

			...(data.social_media_links !== undefined && {
				social_media_links: data.social_media_links,
			}),

			...(data.contact_details !== undefined && {
				contact_details: data.contact_details,
			}),

			...(data.total_working_members !== undefined && {
				total_working_members: data.total_working_members,
			}),

			...(data.career_page_url !== undefined && {
				career_page_url: data.career_page_url,
			}),

			...(data.products_services !== undefined && {
				products_services: data.products_services,
			}),

			modified: new Date(),
		};

		if (result) {
			// Update existing result
			await result.update(resultData, { transaction });
		} else {
			// Create new result
			result = await CompanyResearchResults.create(
				{
					research_id: data.research_id,
					...resultData,
					active: true,
					created: new Date(),
				},
				{ transaction },
			);
		}

		// Update evidence only when the caller supplies it
		if (evidences !== undefined) {
			// Deactivate previous evidence records
			await ResearchResultEvidences.update(
				{
					active: false,
				},
				{
					where: {
						research_id: data.research_id,
						result_id: result.id,
						active: true,
					},
					transaction,
				},
			);

			// Insert new evidence records
			if (evidences.length > 0) {
				const evidenceData = evidences.map((evidence) => ({
					research_id: data.research_id,
					result_id: result!.id,
					field_name: evidence.field_name,
					source_url: evidence.source_url,
					source_title: evidence.source_title ?? null,
					evidence_text: evidence.evidence_text,
					confidence: evidence.confidence ?? null,
					active: true,
					created: new Date(),
				}));

				await ResearchResultEvidences.bulkCreate(evidenceData, {
					transaction,
				});
			}
		}

		return result;
	});
};

// Get research result by research ID
export const getResearchResultByResearchId = async (researchId: number) => {
	const result = await CompanyResearchResults.findOne({
		where: {
			research_id: researchId,
			active: true,
		},
	});

	if (!result) {
		throw new Error('Research result not found');
	}

	return result;
};

// Get all active evidence records for a research result
export const getResearchResultEvidences = async (researchId: number) => {
	const result = await CompanyResearchResults.findOne({
		where: {
			research_id: researchId,
			active: true,
		},
	});

	if (!result) {
		throw new Error('Research result not found');
	}

	return await ResearchResultEvidences.findAll({
		where: {
			research_id: researchId,
			result_id: result.id,
			active: true,
		},
		order: [['id', 'ASC']],
	});
};
