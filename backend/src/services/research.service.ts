import { Users } from '../models/user.model';
import { Research } from '../models/research.model';
import { ResearchResults } from '../models/researchResults.model';

import { ResponseDTO } from '../dtos/base.dto';
import { CrawlingResponse, ResearchDTO } from '../dtos/research.dto';

import { crawlWebsite } from './crawling.service';
import { fetchCompanyFacts } from './enrichment.service';
import { fetchJobOpenings } from './jobs.service';
import { generateCompanyResearch } from './ai.service';

// Read lazily so it works no matter when dotenv is loaded.
const isDebug = (): boolean => process.env.DEBUG_RESEARCH === 'true';

const logCrawl = (crawl: CrawlingResponse): void => {
	console.log('\n========== CRAWLING DEBUG ==========');
	console.log('Website:', crawl.websiteUrl);
	console.log('Total pages:', crawl.pages.length);

	crawl.pages.forEach((page, index) => {
		console.log(`\n--- PAGE ${index + 1} ---`);
		console.log('Title:', page.title);
		console.log('URL:', page.url);
		console.log('Rendered with browser:', page.renderedWithBrowser);
		console.log('Content length:', page.content.length);
		console.log('Emails:', page.emails);
		console.log('Phones:', page.phoneNumbers);
		console.log('Content preview:', page.content.slice(0, 500));
	});

	console.log('====================================\n');
};

export const createResearch = async (
	userId: number,
	researchPayload: ResearchDTO,
): Promise<ResponseDTO> => {
	let research: Research | null = null;

	try {
		// 1. Verify the authenticated user.
		const user = await Users.findOne({
			where: { id: userId, active: true },
		});

		if (!user) {
			return {
				success: false,
				message: 'User not found or account is inactive',
			};
		}

		// 2. Save the research request.
		research = await Research.create({
			user_id: userId,
			search_url: researchPayload.websiteUrl,
			active: true,
			created: new Date(),
			created_by: userId,
			modified: null,
			modified_by: null,
		});

		// 3. Crawl the website.
		const crawl = await crawlWebsite(researchPayload.websiteUrl);

		if (isDebug()) logCrawl(crawl);

		// 4. Verified facts (Wikidata) and real job openings (hiring platform
		//    APIs) do not depend on each other, so run them together.
		//    Neither one throws.
		const [facts, jobs] = await Promise.all([
			fetchCompanyFacts(crawl.pages),
			fetchJobOpenings(crawl.pages),
		]);

		if (isDebug()) {
			console.log('Verified company facts:', facts);
			console.log('Job openings found:', jobs.length);
		}

		// 5. One AI call, checked against the crawled text.
		const aiResult = await generateCompanyResearch(crawl.pages, facts);

		// 6. Save the result.
		const savedResult = await ResearchResults.create({
			research_id: research.id,
			summary: aiResult.summary,
			industry: aiResult.industry,
			services: aiResult.services,
			employee_count: aiResult.employee_count,
			office_locations: aiResult.office_locations,
			contact_details: aiResult.contact_details,
			careers_url: aiResult.careers_url,
			job_opportunities: jobs,
			sources: aiResult.sources,
			active: true,
			created: new Date(),
			created_by: userId,
			modified: null,
			modified_by: null,
		});

		// 7. Return the complete research result.
		return {
			success: true,
			message: 'Company research completed successfully',
			data: {
				researchId: research.id,
				websiteUrl: research.search_url,
				result: savedResult,
			},
		};
	} catch (error: any) {
		// Do not leave an "active" research row without a result.
		if (research) {
			await research
				.update({ active: false, modified: new Date(), modified_by: userId })
				.catch(() => {});
		}

		return {
			success: false,
			message: error?.message || 'Company research failed',
		};
	}
};
