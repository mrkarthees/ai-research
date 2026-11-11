import { ResearchSources } from '../models/research-source.model';
import { ollamaConfig } from '../config/ollama.config';

import { CreateResearchResultDTO } from '../dtos/research-result.dto';

import { createResearchResultSchema } from '../validations/research-result.validation';

// AI evidence returned by Ollama
interface AIResearchEvidence {
	source_index: number;
	field_name: string;
	evidence_text: string;
	confidence: number | null;
}

// Expected AI response
interface AIResearchResponse {
	result: Omit<CreateResearchResultDTO, 'research_id'>;
	evidences: AIResearchEvidence[];
}

// Prepared source content
interface ResearchSourceContent {
	id: number;
	page_url: string;
	page_title: string;
	extracted_text: string;
}

// Final extraction response
export interface AIResearchExtractionResult {
	research_id: number;
	result: CreateResearchResultDTO;
	evidences: {
		field_name: string;
		source_url: string;
		source_title: string | null;
		evidence_text: string;
		confidence: number | null;
	}[];
}

// Maximum content sent to the local model
const MAX_TOTAL_CONTENT_LENGTH = 24000;
const MAX_SOURCE_CONTENT_LENGTH = 5000;

// Extract JSON from Ollama response
const parseAIResponse = (content: string): AIResearchResponse => {
	try {
		return JSON.parse(content) as AIResearchResponse;
	} catch {
		// Handle accidental Markdown code fences
		const cleanedContent = content
			.replace(/^```json\s*/i, '')
			.replace(/^```\s*/i, '')
			.replace(/\s*```$/i, '')
			.trim();

		try {
			return JSON.parse(cleanedContent) as AIResearchResponse;
		} catch {
			throw new Error('Ollama returned an invalid JSON response');
		}
	}
};

// Read crawled website content
const getResearchSources = async (
	researchId: number,
): Promise<ResearchSourceContent[]> => {
	const sources = await ResearchSources.findAll({
		where: {
			research_id: researchId,
			active: true,
			crawl_status: 'completed',
		},
		order: [['id', 'ASC']],
	});

	if (sources.length === 0) {
		throw new Error('No completed crawled sources found for this research');
	}

	let remainingContent = MAX_TOTAL_CONTENT_LENGTH;

	const preparedSources: ResearchSourceContent[] = [];

	for (const source of sources) {
		if (remainingContent <= 0) {
			break;
		}

		const extractedText = source.extracted_text?.trim();

		if (!extractedText) {
			continue;
		}

		const allowedLength = Math.min(MAX_SOURCE_CONTENT_LENGTH, remainingContent);

		const content = extractedText.substring(0, allowedLength);

		preparedSources.push({
			id: source.id,
			page_url: source.page_url,
			page_title: source.page_title,
			extracted_text: content,
		});

		remainingContent -= content.length;
	}

	if (preparedSources.length === 0) {
		throw new Error('No usable extracted website content found');
	}

	return preparedSources;
};

// Build AI research prompt
const buildResearchPrompt = (sources: ResearchSourceContent[]): string => {
	const sourceContent = sources.map((source, index) => ({
		source_index: index,
		page_title: source.page_title,
		page_url: source.page_url,
		content: source.extracted_text,
	}));

	return `
You are a professional company research analyst.

Your task is to analyze the supplied official company website content
and extract accurate company information.

IMPORTANT RULES:

1. Use only the supplied website content.
2. Never invent or assume company information.
3. If information is unavailable, return null.
4. Do not create fake URLs, email addresses, phone numbers, or statistics.
5. Distinguish verified employee counts from estimates.
6. Only include social media URLs explicitly supported by the sources.
7. Only include products and services supported by the sources.
8. Every evidence record must refer to a supplied source_index.
9. Evidence text must contain relevant supporting information from that source.
10. Do not include information from your general knowledge.
11. Extract exactly the seven categories below.
12. Return valid JSON only. Do not include Markdown or explanations.

RESEARCH CATEGORIES:

1. Company summary:
   - description
   - industry
   - business_model

2. Company locations:
   - location_type
   - address
   - city
   - state
   - country

3. Social media links:
   - linkedin
   - instagram
   - facebook
   - x
   - youtube

4. Contact details:
   - email
   - phone
   - contact_page_url

5. Total working members:
   - employee_count
   - employee_range
   - is_estimate
   - as_of_date

6. Career page URL:
   - career_page_url

7. Products or services:
   - name
   - description
   - type: product, service, both, or unknown

EVIDENCE RULES:

For each extracted fact, provide an evidence record containing:
- source_index
- field_name
- evidence_text
- confidence (0 to 1)

Use field names such as:
company_summary.industry
company_locations[0].city
social_media_links.linkedin
contact_details.email
total_working_members.employee_count
career_page_url
products_services[0].name

Do not create evidence for information that is null or unsupported.

EXPECTED JSON STRUCTURE:

{
  "result": {
    "company_summary": {
      "description": null,
      "industry": null,
      "business_model": null
    },
    "company_locations": [],
    "social_media_links": {
      "linkedin": null,
      "instagram": null,
      "facebook": null,
      "x": null,
      "youtube": null
    },
    "contact_details": {
      "email": null,
      "phone": null,
      "contact_page_url": null
    },
    "total_working_members": {
      "employee_count": null,
      "employee_range": null,
      "is_estimate": false,
      "as_of_date": null
    },
    "career_page_url": null,
    "products_services": []
  },
  "evidences": []
}

COMPANY WEBSITE CONTENT:

${JSON.stringify(sourceContent)}
`;
};

// Send website content to Ollama
const generateAIResponse = async (prompt: string): Promise<string> => {
	const response = await fetch(ollamaConfig.chatEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: ollamaConfig.model,
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
			format: 'json',
			stream: false,
			options: {
				temperature: 0.1,
			},
		}),
		signal: AbortSignal.timeout(180000),
	});

	if (!response.ok) {
		const errorText = await response.text();

		throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
	}

	const responseData = (await response.json()) as {
		message?: {
			content?: string;
		};
	};

	const content = responseData.message?.content;

	if (!content) {
		throw new Error('Ollama returned an empty response');
	}

	return content;
};

// Validate AI-generated result
const validateAIResult = (
	result: AIResearchResponse,
	researchId: number,
): CreateResearchResultDTO => {
	if (
		!result ||
		typeof result !== 'object' ||
		!result.result ||
		!Array.isArray(result.evidences)
	) {
		throw new Error('Invalid AI research response structure');
	}

	const researchResult: CreateResearchResultDTO = {
		research_id: researchId,
		...result.result,
	};

	const { error, value } = createResearchResultSchema.validate(researchResult, {
		abortEarly: false,
		convert: true,
	});

	if (error) {
		throw new Error(
			`AI research validation failed: ${error.details
				.map((detail) => detail.message)
				.join(', ')}`,
		);
	}

	return value as CreateResearchResultDTO;
};

// Main AI research extraction function
export const extractCompanyResearch = async (
	researchId: number,
): Promise<AIResearchExtractionResult> => {
	// Step 1: Read completed crawled pages
	const sources = await getResearchSources(researchId);

	// Step 2: Prepare prompt
	const prompt = buildResearchPrompt(sources);

	// Step 3: Generate AI response
	const aiContent = await generateAIResponse(prompt);

	// Step 4: Parse JSON
	const aiResult = parseAIResponse(aiContent);

	// Step 5: Validate structured result
	const validatedResult = validateAIResult(aiResult, researchId);

	// Step 6: Map AI evidence to original database sources
	const evidences = aiResult.evidences.map((evidence) => {
		const source = sources[evidence.source_index];

		if (!source) {
			throw new Error(
				`AI returned an invalid source index: ${evidence.source_index}`,
			);
		}

		if (
			typeof evidence.field_name !== 'string' ||
			!evidence.field_name.trim() ||
			typeof evidence.evidence_text !== 'string' ||
			!evidence.evidence_text.trim()
		) {
			throw new Error('AI returned invalid evidence information');
		}

		if (
			evidence.confidence !== null &&
			(typeof evidence.confidence !== 'number' ||
				evidence.confidence < 0 ||
				evidence.confidence > 1)
		) {
			throw new Error('AI returned an invalid evidence confidence score');
		}

		return {
			field_name: evidence.field_name,
			source_url: source.page_url,
			source_title: source.page_title,
			evidence_text: evidence.evidence_text,
			confidence: evidence.confidence,
		};
	});

	// Step 7: Return validated research and evidence
	return {
		research_id: researchId,
		result: validatedResult,
		evidences,
	};
};
