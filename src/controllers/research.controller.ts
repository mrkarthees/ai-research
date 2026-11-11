import {
	Body,
	Controller,
	Delete,
	Get,
	Path,
	Post,
	Query,
	Route,
	Tags,
	ValidateError,
} from 'tsoa';

import {
	CreateResearchDTO,
	ResearchResponseDTO,
	ResearchListResponseDTO,
	ResearchSingleResponseDTO,
	ResearchDeleteResponseDTO,
} from '../dtos/research.dto';

import { createResearchValidation } from '../validations/research.validation';
import { ResearchService } from '../services/research.service';
import { Researches } from '../models/research.model';

@Route('research')
@Tags('Research')
export class ResearchController extends Controller {
	private researchService = new ResearchService();

	// Format database model into API response
	private formatResearch(research: Researches): ResearchResponseDTO {
		return {
			id: research.id,
			company_id: research.company_id,
			research_status: research.research_status,
			started_at: research.started_at ?? null,
			completed_at: research.completed_at ?? null,
			error_message: research.error_message ?? null,
			active: research.active,
			created: research.created,
			created_by: research.created_by ?? null,
			modified: research.modified,
			modified_by: research.modified_by ?? null,
			company: research.company
				? {
						id: research.company.id,
						company_name: research.company.company_name,
						website_url: research.company.website_url,
					}
				: null,
		};
	}

	// Create research request
	@Post('/')
	public async createResearch(
		@Body() body: CreateResearchDTO,
	): Promise<ResearchSingleResponseDTO> {
		const { error } = createResearchValidation.validate(body, {
			abortEarly: false,
		});

		if (error) {
			throw new ValidateError(
				{
					body: {
						message: error.details.map((item) => item.message).join(', '),
					},
				},
				'Research validation failed',
			);
		}

		try {
			const research = await this.researchService.createResearch(body);

			this.setStatus(201);

			const result = await this.researchService.getResearchById(research.id);

			return {
				success: true,
				message: 'Research request created successfully',
				data: this.formatResearch(result || research),
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : '';

			if (message === 'Company not found or inactive') {
				this.setStatus(404);
				return {
					success: false,
					message,
					data: null,
				};
			}

			if (
				message === 'Research is already pending or processing for this company'
			) {
				this.setStatus(409);
				return {
					success: false,
					message,
					data: null,
				};
			}

			throw error;
		}
	}

	// Get all research records
	@Get('/')
	public async getAllResearch(
		@Query() page: number = 1,
		@Query() limit: number = 10,
		@Query() company_id?: number,
	): Promise<ResearchListResponseDTO> {
		if (
			!Number.isInteger(page) ||
			!Number.isInteger(limit) ||
			page < 1 ||
			limit < 1 ||
			limit > 100 ||
			(company_id !== undefined &&
				(!Number.isInteger(company_id) || company_id < 1))
		) {
			throw new ValidateError(
				{
					pagination: {
						message: 'Invalid page, limit, or company_id parameter',
					},
				},
				'Invalid query parameters',
			);
		}

		const result = await this.researchService.getAllResearch(
			page,
			limit,
			company_id,
		);

		return {
			success: true,
			message: 'Research records retrieved successfully',
			data: result.rows.map((research) => this.formatResearch(research)),
			pagination: {
				total: result.count,
				page,
				limit,
				totalPages: Math.ceil(result.count / limit),
			},
		};
	}

	// Get research by ID
	@Get('{id}')
	public async getResearchById(
		@Path() id: number,
	): Promise<ResearchSingleResponseDTO> {
		if (!Number.isInteger(id) || id < 1) {
			throw new ValidateError(
				{ id: { message: 'Research ID must be a positive integer' } },
				'Invalid research ID',
			);
		}

		const research = await this.researchService.getResearchById(id);

		if (!research) {
			this.setStatus(404);
			return {
				success: false,
				message: 'Research record not found',
				data: null,
			};
		}

		return {
			success: true,
			message: 'Research record retrieved successfully',
			data: this.formatResearch(research),
		};
	}

	// Get research history by company ID
	@Get('company/{companyId}')
	public async getResearchByCompanyId(
		@Path() companyId: number,
		@Query() page: number = 1,
		@Query() limit: number = 10,
	): Promise<ResearchListResponseDTO> {
		if (
			!Number.isInteger(companyId) ||
			companyId < 1 ||
			!Number.isInteger(page) ||
			!Number.isInteger(limit) ||
			page < 1 ||
			limit < 1 ||
			limit > 100
		) {
			throw new ValidateError(
				{ query: { message: 'Invalid company ID or pagination parameters' } },
				'Invalid query parameters',
			);
		}

		const result = await this.researchService.getResearchByCompanyId(
			companyId,
			page,
			limit,
		);

		return {
			success: true,
			message: 'Company research history retrieved successfully',
			data: result.rows.map((research) => this.formatResearch(research)),
			pagination: {
				total: result.count,
				page,
				limit,
				totalPages: Math.ceil(result.count / limit),
			},
		};
	}

	// Soft delete research record
	@Delete('{id}')
	public async deleteResearch(
		@Path() id: number,
	): Promise<ResearchDeleteResponseDTO> {
		if (!Number.isInteger(id) || id < 1) {
			throw new ValidateError(
				{ id: { message: 'Research ID must be a positive integer' } },
				'Invalid research ID',
			);
		}

		const deleted = await this.researchService.deleteResearch(id);

		if (!deleted) {
			this.setStatus(404);
			return {
				success: false,
				message: 'Research record not found',
			};
		}

		return {
			success: true,
			message: 'Research record deactivated successfully',
		};
	}
}
