import {
	Body,
	Controller,
	Delete,
	Get,
	Path,
	Post,
	Put,
	Query,
	Route,
	Tags,
	ValidateError,
} from 'tsoa';

import {
	CreateCompanyDTO,
	UpdateCompanyDTO,
	CompanyResponseDTO,
	CompanyListResponseDTO,
	CompanySingleResponseDTO,
	CompanyDeleteResponseDTO,
} from '../dtos/company.dto';

import {
	createCompanyValidation,
	updateCompanyValidation,
} from '../validations/company.validation';

import { CompanyService } from '../services/company.service';
import { Companies } from '../models/company.model';

@Route('companies')
@Tags('Companies')
export class CompanyController extends Controller {
	private companyService = new CompanyService();

	private formatCompany(company: Companies): CompanyResponseDTO {
		return {
			id: company.id,
			company_name: company.company_name,
			website_url: company.website_url,
			industry: company.industry ?? null,
			description: company.description ?? null,
			headquarters: company.headquarters ?? null,
			research_status: company.research_status,
			active: company.active,
			created: company.created,
			created_by: company.created_by ?? null,
			modified: company.modified,
			modified_by: company.modified_by ?? null,
		};
	}

	// CREATE COMPANY
	@Post('/')
	public async createCompany(
		@Body() body: CreateCompanyDTO,
	): Promise<CompanySingleResponseDTO> {
		const { error } = createCompanyValidation.validate(body, {
			abortEarly: false,
		});

		if (error) {
			throw new ValidateError(
				{
					body: {
						message: error.details.map((item) => item.message).join(', '),
					},
				},
				'Company validation failed',
			);
		}

		const company = await this.companyService.createCompany(body);

		this.setStatus(201);

		return {
			success: true,
			message: 'Company created successfully',
			data: this.formatCompany(company),
		};
	}

	// GET ALL COMPANIES
	@Get('/')
	public async getAllCompanies(
		@Query() page: number = 1,
		@Query() limit: number = 10,
		@Query() search?: string,
	): Promise<CompanyListResponseDTO> {
		if (
			!Number.isInteger(page) ||
			!Number.isInteger(limit) ||
			page < 1 ||
			limit < 1 ||
			limit > 100
		) {
			throw new ValidateError(
				{
					pagination: {
						message: 'Page must be positive and limit must be between 1 and 100',
					},
				},
				'Invalid pagination parameters',
			);
		}

		const result = await this.companyService.getAllCompanies(page, limit, search);

		return {
			success: true,
			message: 'Companies retrieved successfully',
			data: result.rows.map((company) => this.formatCompany(company)),
			pagination: {
				total: result.count,
				page,
				limit,
				totalPages: Math.ceil(result.count / limit),
			},
		};
	}

	// GET COMPANY BY ID
	@Get('{id}')
	public async getCompanyById(
		@Path() id: number,
	): Promise<CompanySingleResponseDTO> {
		const company = await this.companyService.getCompanyById(id);

		if (!company) {
			this.setStatus(404);

			return {
				success: false,
				message: 'Company not found',
				data: null as any,
			};
		}

		return {
			success: true,
			message: 'Company retrieved successfully',
			data: this.formatCompany(company),
		};
	}

	// UPDATE COMPANY
	@Put('{id}')
	public async updateCompany(
		@Path() id: number,
		@Body() body: UpdateCompanyDTO,
	): Promise<CompanySingleResponseDTO> {
		const { error } = updateCompanyValidation.validate(body, {
			abortEarly: false,
		});

		if (error) {
			throw new ValidateError(
				{
					body: {
						message: error.details.map((item) => item.message).join(', '),
					},
				},
				'Company validation failed',
			);
		}

		const company = await this.companyService.updateCompany(id, body);

		if (!company) {
			this.setStatus(404);

			return {
				success: false,
				message: 'Company not found',
				data: null as any,
			};
		}

		return {
			success: true,
			message: 'Company updated successfully',
			data: this.formatCompany(company),
		};
	}

	// DELETE COMPANY
	@Delete('{id}')
	public async deleteCompany(
		@Path() id: number,
	): Promise<CompanyDeleteResponseDTO> {
		const deleted = await this.companyService.deleteCompany(id);

		if (!deleted) {
			this.setStatus(404);

			return {
				success: false,
				message: 'Company not found',
			};
		}

		return {
			success: true,
			message: 'Company deactivated successfully',
		};
	}
}
