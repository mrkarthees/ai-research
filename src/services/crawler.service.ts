import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import * as cheerio from 'cheerio';

import { Companies } from '../models/company.model';
import { Researches } from '../models/research.model';
import { ResearchSources } from '../models/research-source.model';

const MAX_RESPONSE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_EXTRACTED_TEXT = 50000;
const REQUEST_TIMEOUT = 15000;
const MAX_REDIRECTS = 5;

interface MultiPageCrawlResult {
	message: string;
	research_id: number;
	total_pages_attempted: number;
	successful_pages: number;
	failed_pages: number;
	skipped_pages: number;
	sources: {
		id: number;
		page_url: string;
		page_title: string;
		page_type: string;
		crawl_status: string;
		http_status: number | null;
	}[];
	failures: {
		page_url: string;
		error: string;
	}[];
}

interface CrawledPage {
	page_url: string;
	page_title: string;
	page_type: string;
	meta_description: string;
	extracted_text: string;
	links: string[];
	http_status: number;
}

export class CrawlerService {
	// Validate URL and block private or local network destinations
	private async validatePublicUrl(value: string): Promise<URL> {
		let url: URL;

		try {
			url = new URL(value);
		} catch {
			throw new Error('Invalid website URL');
		}

		if (
			!['http:', 'https:'].includes(url.protocol) ||
			url.username ||
			url.password
		) {
			throw new Error('Only public HTTP and HTTPS URLs are allowed');
		}

		const hostname = url.hostname.toLowerCase();

		if (
			hostname === 'localhost' ||
			hostname.endsWith('.localhost') ||
			hostname.endsWith('.local')
		) {
			throw new Error('Local network URLs are not allowed');
		}

		const addresses = await lookup(hostname, { all: true });

		if (!addresses.length) {
			throw new Error('Website hostname could not be resolved');
		}

		for (const address of addresses) {
			const parsedAddress = ipaddr.parse(address.address);

			let addressToValidate = parsedAddress;

			// Handle the well-known NAT64 prefix: 64:ff9b::/96
			if (parsedAddress.kind() === 'ipv6') {
				const ipv6 = parsedAddress as ipaddr.IPv6;

				const isWellKnownNat64 =
					ipv6.parts[0] === 0x0064 &&
					ipv6.parts[1] === 0xff9b &&
					ipv6.parts[2] === 0 &&
					ipv6.parts[3] === 0 &&
					ipv6.parts[4] === 0 &&
					ipv6.parts[5] === 0;

				if (isWellKnownNat64) {
					const lastPart1 = ipv6.parts[6];
					const lastPart2 = ipv6.parts[7];

					const embeddedIPv4 = [
						lastPart1 >> 8,
						lastPart1 & 0xff,
						lastPart2 >> 8,
						lastPart2 & 0xff,
					].join('.');

					addressToValidate = ipaddr.parse(embeddedIPv4);

					console.log('NAT64 address detected:', {
						originalIPv6: address.address,
						embeddedIPv4,
					});
				}
			}

			const addressRange = addressToValidate.range();

			console.log('DNS Validation:', {
				hostname,
				ip: address.address,
				validatedRange: addressRange,
			});

			if (addressRange !== 'unicast') {
				throw new Error(
					`Private or restricted network address detected: ${address.address}`,
				);
			}
		}

		return url;
	}

	// Fetch webpage while manually validating redirects
	private async fetchPage(
		urlValue: string,
		allowedHostname: string,
	): Promise<Response> {
		let currentUrl = urlValue;

		for (let count = 0; count <= MAX_REDIRECTS; count++) {
			// Validate the current URL before requesting it
			const validatedUrl = await this.validatePublicUrl(currentUrl);

			if (validatedUrl.hostname !== allowedHostname) {
				throw new Error(
					'Crawling outside the registered company domain is not allowed',
				);
			}

			const response = await fetch(validatedUrl.toString(), {
				method: 'GET',
				redirect: 'manual',
				signal: AbortSignal.timeout(REQUEST_TIMEOUT),
				headers: {
					'User-Agent': 'CompanyResearchBot/1.0',
					Accept: 'text/html,application/xhtml+xml',
				},
			});

			// Handle redirects manually
			if ([301, 302, 303, 307, 308].includes(response.status)) {
				const location = response.headers.get('location');

				await response.body?.cancel();

				if (!location || count === MAX_REDIRECTS) {
					throw new Error('Too many or invalid website redirects');
				}

				const nextUrl = new URL(location, currentUrl);

				// Only allow redirects to the registered company hostname
				if (nextUrl.hostname.toLowerCase() !== allowedHostname) {
					throw new Error('Redirects to external websites are not allowed');
				}

				currentUrl = nextUrl.toString();

				continue;
			}

			// Validate the final response URL as well
			const finalUrl = await this.validatePublicUrl(response.url || currentUrl);

			if (finalUrl.hostname !== allowedHostname) {
				await response.body?.cancel();

				throw new Error(
					'Final response URL does not match the registered company domain',
				);
			}

			return response;
		}

		throw new Error('Unable to fetch website');
	}

	// Read response with a maximum size limit
	private async readResponse(response: Response): Promise<string> {
		const contentLength = Number(response.headers.get('content-length') || 0);

		if (contentLength > MAX_RESPONSE_SIZE) {
			await response.body?.cancel();

			throw new Error('Website response exceeds the allowed size');
		}

		if (!response.body) {
			throw new Error('Website response is empty');
		}

		const reader = response.body.getReader();

		const chunks: Uint8Array[] = [];
		let totalSize = 0;

		try {
			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				totalSize += value.length;

				if (totalSize > MAX_RESPONSE_SIZE) {
					await reader.cancel();

					throw new Error('Website response exceeds the allowed size');
				}

				chunks.push(value);
			}
		} finally {
			reader.releaseLock();
		}

		const combined = new Uint8Array(totalSize);

		let offset = 0;

		for (const chunk of chunks) {
			combined.set(chunk, offset);
			offset += chunk.length;
		}

		return new TextDecoder('utf-8').decode(combined);
	}

	// Extract useful information from HTML using Cheerio
	private extractPage(
		html: string,
		pageUrl: string,
		status: number,
	): CrawledPage {
		const $ = cheerio.load(html);

		const pageTitle = $('title').first().text().trim();

		const metaDescription =
			$('meta[name="description"]').attr('content')?.trim() || '';

		// Remove elements that do not contain useful page content
		$('script, style, noscript, iframe, svg, nav, footer, header').remove();

		// Extract headings
		const headings = $('h1, h2, h3')
			.map((_, element) => $(element).text().trim())
			.get()
			.filter(Boolean);

		// Extract paragraphs
		const paragraphs = $('main p, article p, body p')
			.map((_, element) => $(element).text().trim())
			.get()
			.filter(Boolean);

		// Combine and clean extracted text
		const extractedText = [...new Set([...headings, ...paragraphs])]
			.join('\n')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, MAX_EXTRACTED_TEXT);

		const baseUrl = new URL(pageUrl);

		// Discover internal links
		const links = $('a[href]')
			.map((_, element) => {
				const href = $(element).attr('href');

				if (!href) return null;

				try {
					const linkUrl = new URL(href, baseUrl);

					if (
						linkUrl.origin !== baseUrl.origin ||
						!['http:', 'https:'].includes(linkUrl.protocol)
					) {
						return null;
					}

					linkUrl.hash = '';

					return linkUrl.toString();
				} catch {
					return null;
				}
			})
			.get()
			.filter((link): link is string => Boolean(link));

		return {
			page_url: pageUrl,
			page_title: pageTitle,
			page_type: 'other',
			meta_description: metaDescription,
			extracted_text: extractedText,
			links: [...new Set(links)].slice(0, 100),
			http_status: status,
		};
	}

	// Crawl and save one webpage
	public async crawlPage(
		researchId: number,
		pageUrl: string,
	): Promise<{
		source: ResearchSources;
		discovered_links: string[];
	}> {
		// Find active research and associated company
		const research = await Researches.findOne({
			where: {
				id: researchId,
				active: true,
				research_status: 'processing',
			},
			include: [
				{
					model: Companies,
					where: { active: true },
				},
			],
		});

		if (!research || !research.company) {
			throw new Error('Active pending research or company not found');
		}

		// Validate requested page URL and registered company URL
		const requestedUrl = await this.validatePublicUrl(pageUrl);

		const companyUrl = await this.validatePublicUrl(research.company.website_url);

		// Only crawl pages from the registered hostname
		if (requestedUrl.hostname !== companyUrl.hostname) {
			throw new Error(
				'You can only crawl pages from the registered company website',
			);
		}

		// Fetch webpage
		const response = await this.fetchPage(
			requestedUrl.toString(),
			companyUrl.hostname,
		);

		const contentType = response.headers.get('content-type') || '';

		if (!response.ok) {
			await response.body?.cancel();

			throw new Error(`Website returned HTTP ${response.status}`);
		}

		if (!contentType.toLowerCase().includes('text/html')) {
			await response.body?.cancel();

			throw new Error('The requested URL does not return an HTML page');
		}

		// Read HTML response
		const html = await this.readResponse(response);

		// Extract webpage information
		const page = this.extractPage(
			html,
			response.url || requestedUrl.toString(),
			response.status,
		);

		// Save extracted information in MySQL
		const source = await ResearchSources.create({
			research_id: research.id,
			company_id: research.company_id,

			page_url: page.page_url,
			page_title: page.page_title || null,
			page_type: page.page_type,

			meta_description: page.meta_description || null,
			extracted_text: page.extracted_text || null,

			crawl_status: 'completed',
			http_status: page.http_status,

			active: true,

			created_by: 'system',
			modified_by: 'system',
		});

		return {
			source,
			discovered_links: page.links,
		};
	}

	private readonly MAX_PAGES = 10;

	private classifyPageType(pageUrl: string): string {
		const pathname = new URL(pageUrl).pathname.toLowerCase();

		if (pathname === '/' || pathname === '') {
			return 'homepage';
		}

		if (/\/(about|about-us|our-story|who-we-are)(\/|$)/.test(pathname)) {
			return 'about';
		}

		if (/\/(service|services|solutions|what-we-do)(\/|$)/.test(pathname)) {
			return 'services';
		}

		if (/\/(contact|contact-us|reach-us)(\/|$)/.test(pathname)) {
			return 'contact';
		}

		if (
			/\/(career|careers|jobs|job-openings|work-with-us)(\/|$)/.test(pathname)
		) {
			return 'careers';
		}

		return 'other';
	}

	private getLinkPriority(pageUrl: string): number {
		const pageType = this.classifyPageType(pageUrl);

		const priorities: Record<string, number> = {
			homepage: 1,
			about: 2,
			services: 3,
			careers: 4,
			contact: 5,
			other: 6,
		};

		return priorities[pageType] ?? 6;
	}

	private normalizePageUrl(value: string): string | null {
		try {
			const url = new URL(value);

			if (!['http:', 'https:'].includes(url.protocol)) {
				return null;
			}

			// Ignore links to files instead of HTML pages.
			if (
				/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|docx?|xlsx?|pptx?|mp4|mp3)$/i.test(
					url.pathname,
				)
			) {
				return null;
			}

			// Remove fragments and common tracking parameters.
			url.hash = '';

			[
				'utm_source',
				'utm_medium',
				'utm_campaign',
				'utm_term',
				'utm_content',
				'fbclid',
				'gclid',
			].forEach((key) => url.searchParams.delete(key));

			return url.toString();
		} catch {
			return null;
		}
	}

	public async crawlMultiplePages(
		researchId: number,
	): Promise<MultiPageCrawlResult> {
		const research = await Researches.findOne({
			where: {
				id: researchId,
				active: true,
				research_status: 'processing',
			},
			include: [
				{
					model: Companies,
					where: { active: true },
				},
			],
		});

		if (!research || !research.company) {
			throw new Error('Active pending research or company not found');
		}

		const companyUrl = await this.validatePublicUrl(research.company.website_url);

		const allowedHostname = companyUrl.hostname.toLowerCase();

		// Queue starts with the registered company homepage.
		const queue: string[] = [companyUrl.toString()];

		const visited = new Set<string>();

		const sources: MultiPageCrawlResult['sources'] = [];
		const failures: MultiPageCrawlResult['failures'] = [];

		let attemptedPages = 0;
		let skippedPages = 0;

		while (queue.length > 0 && attemptedPages < this.MAX_PAGES) {
			// Process the highest-priority page first.
			queue.sort((a, b) => this.getLinkPriority(a) - this.getLinkPriority(b));

			const currentUrl = queue.shift()!;

			const normalizedUrl = this.normalizePageUrl(currentUrl);

			if (!normalizedUrl || visited.has(normalizedUrl)) {
				skippedPages++;
				continue;
			}

			visited.add(normalizedUrl);

			const parsedUrl = new URL(normalizedUrl);

			// Do not crawl external websites or different subdomains.
			if (parsedUrl.hostname.toLowerCase() !== allowedHostname) {
				skippedPages++;
				continue;
			}

			// Avoid saving duplicate active sources.
			const existingSource = await ResearchSources.findOne({
				where: {
					research_id: researchId,
					page_url: normalizedUrl,
					active: true,
				},
			});

			if (existingSource) {
				skippedPages++;
				continue;
			}

			attemptedPages++;

			try {
				const result = await this.crawlPage(researchId, normalizedUrl);

				const pageType = this.classifyPageType(result.source.page_url);

				// Update the page type after extraction.
				await result.source.update({
					page_type: pageType,
				});

				sources.push({
					id: result.source.id,
					page_url: result.source.page_url,
					page_title: result.source.page_title || '',
					page_type: pageType,
					crawl_status: result.source.crawl_status,
					http_status: result.source.http_status,
				});

				// Add discovered internal links to the queue.
				for (const discoveredLink of result.discovered_links) {
					const normalizedLink = this.normalizePageUrl(discoveredLink);

					if (!normalizedLink) {
						continue;
					}

					const linkUrl = new URL(normalizedLink);

					if (linkUrl.hostname.toLowerCase() !== allowedHostname) {
						continue;
					}

					if (!visited.has(normalizedLink)) {
						queue.push(normalizedLink);
					}
				}
			} catch (error) {
				failures.push({
					page_url: normalizedUrl,
					error: error instanceof Error ? error.message : 'Unknown crawling error',
				});
			}
		}

		return {
			message: 'Website crawling completed',
			research_id: researchId,
			total_pages_attempted: attemptedPages,
			successful_pages: sources.length,
			failed_pages: failures.length,
			skipped_pages: skippedPages,
			sources,
			failures,
		};
	}

	private async startResearch(researchId: number): Promise<void> {
		const research = await Researches.findOne({
			where: {
				id: researchId,
				active: true,
				research_status: 'pending',
			},
			include: [
				{
					model: Companies,
					where: { active: true },
				},
			],
		});

		if (!research || !research.company) {
			throw new Error('Research not found, inactive, or already started');
		}

		// Atomically change pending to processing.
		const [updatedCount] = await Researches.update(
			{
				research_status: 'processing',
				started_at: new Date(),
				completed_at: null,
				error_message: null,
			},
			{
				where: {
					id: researchId,
					active: true,
					research_status: 'pending',
				},
			},
		);

		if (updatedCount === 0) {
			throw new Error('Research is already processing or has already finished');
		}
	}

	private async completeResearch(
		researchId: number,
		errorMessage: string | null = null,
	): Promise<void> {
		await Researches.update(
			{
				research_status: 'completed',
				completed_at: new Date(),
				error_message: errorMessage,
			},
			{
				where: {
					id: researchId,
					active: true,
					research_status: 'processing',
				},
			},
		);
	}

	private async failResearch(
		researchId: number,
		errorMessage: string,
	): Promise<void> {
		await Researches.update(
			{
				research_status: 'failed',
				completed_at: new Date(),
				error_message: errorMessage.slice(0, 2000),
			},
			{
				where: {
					id: researchId,
					active: true,
					research_status: 'processing',
				},
			},
		);
	}

	public async crawlSinglePageWithLifecycle(
		researchId: number,
		pageUrl: string,
	) {
		await this.startResearch(researchId);

		try {
			const result = await this.crawlPage(researchId, pageUrl);

			await this.completeResearch(researchId);

			return result;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown crawling error';

			await this.failResearch(researchId, message);

			throw error;
		}
	}

	public async crawlMultiplePagesWithLifecycle(
		researchId: number,
	): Promise<MultiPageCrawlResult> {
		await this.startResearch(researchId);

		try {
			const result = await this.crawlMultiplePages(researchId);

			if (result.successful_pages > 0) {
				const partialFailureMessage =
					result.failed_pages > 0
						? `${result.failed_pages} page(s) failed during crawling`
						: null;

				await this.completeResearch(researchId, partialFailureMessage);
			} else {
				await this.failResearch(
					researchId,
					'No website pages could be crawled successfully',
				);
			}

			return result;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown crawling error';

			await this.failResearch(researchId, message);

			throw error;
		}
	}
}
