import { Op } from 'sequelize';
import { Companies } from '../models/company.model';

import { CreateCompanyDTO, UpdateCompanyDTO } from '../dtos/company.dto';

export class CompanyService {
	// Create company
	public async createCompany(
		payload: CreateCompanyDTO,
		createdBy?: string,
	): Promise<Companies> {
		const existingCompany = await Companies.findOne({
			where: {
				website_url: payload.website_url,
				active: true,
			},
		});

		if (existingCompany) {
			throw new Error('Company with this website already exists');
		}

		const company = await Companies.create({
			...payload,
			research_status: 'pending',
			active: true,
			created_by: createdBy || 'system',
			modified_by: createdBy || 'system',
		});

		return company;
	}

	// Get all companies
	public async getAllCompanies(
		page: number,
		limit: number,
		search?: string,
	): Promise<{
		rows: Companies[];
		count: number;
	}> {
		const offset = (page - 1) * limit;

		const whereCondition: any = {
			active: true,
		};

		if (search) {
			whereCondition[Op.or] = [
				{
					company_name: {
						[Op.like]: `%${search}%`,
					},
				},
				{
					website_url: {
						[Op.like]: `%${search}%`,
					},
				},
			];
		}

		const result = await Companies.findAndCountAll({
			where: whereCondition,
			order: [['id', 'DESC']],
			limit,
			offset,
		});

		return result;
	}

	// Get company by ID
	public async getCompanyById(id: number): Promise<Companies | null> {
		return await Companies.findOne({
			where: {
				id,
				active: true,
			},
		});
	}

	// Update company
	public async updateCompany(
		id: number,
		payload: UpdateCompanyDTO,
		modifiedBy?: string,
	): Promise<Companies | null> {
		const company = await this.getCompanyById(id);

		if (!company) {
			return null;
		}

		if (payload.website_url) {
			const existingCompany = await Companies.findOne({
				where: {
					website_url: payload.website_url,
					active: true,
					id: {
						[Op.ne]: id,
					},
				},
			});

			if (existingCompany) {
				throw new Error('Another company with this website already exists');
			}
		}

		await company.update({
			...payload,
			modified: new Date(),
			modified_by: modifiedBy || 'system',
		});

		return company;
	}

	// Soft delete company
	public async deleteCompany(id: number, modifiedBy?: string): Promise<boolean> {
		const company = await this.getCompanyById(id);

		if (!company) {
			return false;
		}

		await company.update({
			active: false,
			modified: new Date(),
			modified_by: modifiedBy || 'system',
		});

		return true;
	}
}
