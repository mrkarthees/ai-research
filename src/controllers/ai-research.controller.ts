import { Controller, Post, Path, Route, SuccessResponse } from 'tsoa';

import { extractCompanyResearch } from '../services/ollama-research.service';

import {
	saveResearchResult,
	getResearchResultEvidences,
} from '../services/research-result.service';

import {
	ResearchResultResponseDTO,
	ResearchResultEvidenceResponseDTO,
} from '../dtos/research-result.dto';

interface AIResearchResponseDTO {
	message: string;
	research_result: ResearchResultResponseDTO;
	evidences: ResearchResultEvidenceResponseDTO[];
}

interface AIResearchErrorDTO {
	message: string;
}

@Route('research')
export class AIResearchController extends Controller {
	// POST /api/v1/research/{researchId}/analyze
	@Post('{researchId}/analyze')
	@SuccessResponse('200', 'AI research completed successfully')
	public async analyzeCompanyResearch(
		@Path() researchId: number,
	): Promise<AIResearchResponseDTO | AIResearchErrorDTO> {
		try {
			// Step 1: Extract company information using Ollama
			const extraction = await extractCompanyResearch(researchId);

			// Step 2: Save research result and evidence
			const savedResult = await saveResearchResult(
				extraction.result,
				extraction.evidences,
			);

			// Step 3: Retrieve saved evidence records
			const savedEvidences = await getResearchResultEvidences(researchId);

			// Step 4: Return completed research report
			this.setStatus(200);

			return {
				message: 'AI company research completed successfully',

				research_result: savedResult.toJSON() as ResearchResultResponseDTO,

				evidences: savedEvidences.map((evidence) => {
					const data = evidence.toJSON();

					return {
						...data,
						confidence: data.confidence === null ? null : Number(data.confidence),
					};
				}) as ResearchResultEvidenceResponseDTO[],
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'An unexpected error occurred';

			// Research sources are not available
			if (
				errorMessage.includes('No completed crawled sources') ||
				errorMessage.includes('No usable extracted website content')
			) {
				this.setStatus(400);

				return {
					message: errorMessage,
				};
			}

			// Research record does not exist
			if (errorMessage === 'Research not found or inactive') {
				this.setStatus(404);

				return {
					message: errorMessage,
				};
			}

			// Ollama connection or model error
			if (
				errorMessage.includes('Ollama request failed') ||
				errorMessage.includes('fetch failed') ||
				errorMessage.includes('Ollama returned')
			) {
				this.setStatus(502);

				return {
					message: errorMessage,
				};
			}

			// Other unexpected errors
			this.setStatus(500);

			return {
				message: errorMessage,
			};
		}
	}
}
