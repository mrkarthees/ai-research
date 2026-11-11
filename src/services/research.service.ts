import { Op } from 'sequelize';

import { Researches } from '../models/research.model';
import { Companies } from '../models/company.model';
import { CreateResearchDTO } from '../dtos/research.dto';

export class ResearchService {
	// Create a new research request
	public async createResearch(
		payload: CreateResearchDTO,
		createdBy?: string,
	): Promise<Researches> {
		// Check whether the company exists and is active
		const company = await Companies.findOne({
			where: {
				id: payload.company_id,
				active: true,
			},
		});

		if (!company) {
			throw new Error('Company not found or inactive');
		}

		// Prevent another pending or processing research for the same company
		const existingResearch = await Researches.findOne({
			where: {
				company_id: payload.company_id,
				active: true,
				research_status: {
					[Op.in]: ['pending', 'processing'],
				},
			},
		});

		if (existingResearch) {
			throw new Error(
				'Research is already pending or processing for this company',
			);
		}

		return await Researches.create({
			company_id: payload.company_id,
			research_status: 'pending',
			active: true,
			created_by: createdBy || 'system',
			modified_by: createdBy || 'system',
		});
	}

	// Get all research records with pagination
	public async getAllResearch(
		page: number,
		limit: number,
		search?: number,
	): Promise<{ rows: Researches[]; count: number }> {
		const offset = (page - 1) * limit;

		const whereCondition: any = {
			active: true,
		};

		if (search) {
			whereCondition.company_id = search;
		}

		return await Researches.findAndCountAll({
			where: whereCondition,
			include: [
				{
					model: Companies,
					attributes: ['id', 'company_name', 'website_url'],
				},
			],
			order: [['id', 'DESC']],
			limit,
			offset,
			distinct: true,
		});
	}

	// Get research by ID
	public async getResearchById(id: number): Promise<Researches | null> {
		return await Researches.findOne({
			where: {
				id,
				active: true,
			},
			include: [
				{
					model: Companies,
					attributes: ['id', 'company_name', 'website_url'],
				},
			],
		});
	}

	// Get research history for a company
	public async getResearchByCompanyId(
		companyId: number,
		page: number,
		limit: number,
	): Promise<{ rows: Researches[]; count: number }> {
		const offset = (page - 1) * limit;

		return await Researches.findAndCountAll({
			where: {
				company_id: companyId,
				active: true,
			},
			include: [
				{
					model: Companies,
					attributes: ['id', 'company_name', 'website_url'],
					where: { active: true },
				},
			],
			order: [['id', 'DESC']],
			limit,
			offset,
			distinct: true,
		});
	}

	// Soft delete research record
	public async deleteResearch(
		id: number,
		modifiedBy?: string,
	): Promise<boolean> {
		const research = await Researches.findOne({
			where: {
				id,
				active: true,
			},
		});

		if (!research) {
			return false;
		}

		await research.update({
			active: false,
			modified: new Date(),
			modified_by: modifiedBy || 'system',
		});

		return true;
	}
}
