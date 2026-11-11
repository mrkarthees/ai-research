import {
	Body,
	Controller,
	Get,
	Path,
	Post,
	Route,
	SuccessResponse,
	ValidateError,
} from 'tsoa';

import {
	CreateResearchResultDTO,
	ResearchResultResponseDTO,
	ResearchResultEvidenceResponseDTO,
} from '../dtos/research-result.dto';

import { createResearchResultSchema } from '../validations/research-result.validation';

import {
	saveResearchResult,
	getResearchResultByResearchId,
	getResearchResultEvidences,
} from '../services/research-result.service';

@Route('research-results')
export class ResearchResultController extends Controller {
	// POST /api/v1/research-results
	@Post('/')
	@SuccessResponse('201', 'Research result saved successfully')
	public async createResearchResult(
		@Body() body: CreateResearchResultDTO,
	): Promise<ResearchResultResponseDTO | { message: string }> {
		// Joi validation
		const { error, value } = createResearchResultSchema.validate(body, {
			abortEarly: false,
			convert: true,
		});

		if (error) {
			const fields: Record<string, { message: string; value: unknown }> = {};

			error.details.forEach((detail) => {
				const field = detail.path.join('.');

				fields[field] = {
					message: detail.message,
					value: detail.context?.value,
				};
			});

			throw new ValidateError(fields, 'Research result validation failed');
		}

		try {
			const result = await saveResearchResult(value as CreateResearchResultDTO);

			this.setStatus(201);

			return result.toJSON() as ResearchResultResponseDTO;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === 'Research not found or inactive'
			) {
				this.setStatus(404);

				return {
					message: error.message,
				};
			}

			throw error;
		}
	}

	// GET /api/v1/research-results/{researchId}
	@Get('{researchId}')
	public async getResearchResult(
		@Path() researchId: number,
	): Promise<ResearchResultResponseDTO | { message: string }> {
		const result = await getResearchResultByResearchId(researchId);

		return result.toJSON() as ResearchResultResponseDTO;
	}

	// GET /api/v1/research-results/{researchId}/evidences
	@Get('{researchId}/evidences')
	public async getResearchResultEvidence(
		@Path() researchId: number,
	): Promise<ResearchResultEvidenceResponseDTO[]> {
		const evidences = await getResearchResultEvidences(researchId);

		return evidences.map((evidence) => {
			const data = evidence.toJSON();

			return {
				...data,
				confidence: data.confidence === null ? null : Number(data.confidence),
			};
		}) as ResearchResultEvidenceResponseDTO[];
	}
}
