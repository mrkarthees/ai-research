import {
	Body,
	Controller,
	Path,
	Post,
	Route,
	SuccessResponse,
	Tags,
} from 'tsoa';

import { CrawlerService } from '../services/crawler.service';
import {
	CrawlPageDTO,
	CrawlPageResponseDTO,
	MultiPageCrawlResponseDTO,
} from '../dtos/crawler.dto';
import { crawlPageSchema } from '../validations/crawler.validation';

@Route('research')
@Tags('Crawler')
export class CrawlerController extends Controller {
	/**
	 * Crawl a single page for a research record.
	 */
	@Post('{id}/crawl')
	@SuccessResponse('201', 'Page crawled successfully')
	public async crawlResearchPage(
		@Path() id: number,
		@Body() requestBody: CrawlPageDTO,
	): Promise<CrawlPageResponseDTO> {
		// 1. Validate request body
		const { error } = crawlPageSchema.validate(requestBody);

		if (error) {
			this.setStatus(400);

			return {
				message: error.details[0].message,
				source: null,
				discovered_links: [],
			};
		}

		try {
			// 2. Call crawler service
			const result = await new CrawlerService().crawlSinglePageWithLifecycle(
				id,
				requestBody.page_url,
			);

			// 3. Return successful response
			this.setStatus(201);

			return {
				message: 'Page crawled successfully',
				source: {
					id: result.source.id,
					research_id: result.source.research_id,
					company_id: result.source.company_id,
					page_url: result.source.page_url,
					page_title: result.source.page_title,
					page_type: result.source.page_type,
					meta_description: result.source.meta_description,
					extracted_text: result.source.extracted_text,
					crawl_status: result.source.crawl_status,
					http_status: result.source.http_status,
				},
				discovered_links: result.discovered_links,
			};
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Something went wrong';

			// 4. Map expected errors to HTTP status codes
			if (errorMessage.includes('not found')) {
				this.setStatus(404);
			} else if (
				errorMessage.includes('Invalid') ||
				errorMessage.includes('not allowed') ||
				errorMessage.includes('Only public') ||
				errorMessage.includes('outside') ||
				errorMessage.includes('Redirect')
			) {
				this.setStatus(400);
			} else if (errorMessage.includes('does not return an HTML')) {
				this.setStatus(415);
			} else if (errorMessage.includes('Website returned HTTP')) {
				this.setStatus(502);
			} else {
				this.setStatus(500);
			}

			return {
				message: errorMessage,
				source: null,
				discovered_links: [],
			};
		}
	}

	/**
	 * Automatically crawl multiple relevant pages from a company website.
	 */
	@Post('{id}/crawl-all')
	@SuccessResponse('200', 'Multi-page crawling completed')
	public async crawlMultiplePages(
		@Path() id: number,
	): Promise<MultiPageCrawlResponseDTO> {
		try {
			const result = await new CrawlerService().crawlMultiplePagesWithLifecycle(
				id,
			);

			this.setStatus(200);

			return result;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Something went wrong';

			if (
				errorMessage.includes('already started') ||
				errorMessage.includes('already processing') ||
				errorMessage.includes('already finished')
			) {
				this.setStatus(409);
			} else if (errorMessage.includes('not found')) {
				this.setStatus(404);
			} else {
				this.setStatus(500);
			}

			return {
				message: errorMessage,
				research_id: id,
				total_pages_attempted: 0,
				successful_pages: 0,
				failed_pages: 0,
				skipped_pages: 0,
				sources: [],
				failures: [],
			};
		}
	}
}
