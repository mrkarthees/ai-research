import { CrawledPage } from '../dtos/research.dto';

/*
 * Finds REAL job openings without using AI.
 *
 * Most companies host their careers page on an applicant tracking system
 * (ATS) that has a free public JSON API. Reading that API gives exact job
 * titles, locations and apply links, so the model never has to guess them.
 *
 * Supported: Greenhouse, Lever, Ashby, Workable, Recruitee, SmartRecruiters.
 * Fallback: schema.org JobPosting JSON-LD on the careers page.
 *
 * Never throws: jobs are a bonus, not a requirement.
 */

const REQUEST_TIMEOUT = 8000;
const MAX_JOBS = 25;
const MAX_HTML_CHARS = 2_000_000;

export interface JobOpportunity {
	title: string;
	location: string | null;
	url: string | null;
}

interface RawJob {
	title: string | null;
	location: string | null;
	url: string | null;
}

type Ats =
	| 'greenhouse'
	| 'lever'
	| 'ashby'
	| 'workable'
	| 'recruitee'
	| 'smartrecruiters';

interface AtsBoard {
	ats: Ats;
	token: string;
}

// Board names are used inside API URLs, so allow only safe characters.
const SAFE_TOKEN = /^[a-z0-9][a-z0-9_-]{0,60}$/i;

const clean = (value: unknown): string | null => {
	if (typeof value !== 'string') return null;

	const text = value.replace(/\s+/g, ' ').trim();

	return text ? text : null;
};

// Only keep real http(s) links.
const safeUrl = (value: unknown): string | null => {
	const text = clean(value);

	return text && /^https?:\/\//i.test(text) ? text : null;
};

const getJson = async (url: string): Promise<any> => {
	const response = await fetch(url, {
		headers: {
			Accept: 'application/json',
			'User-Agent': 'CompanyResearchBot/1.0',
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	});

	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	return response.json();
};

/* -------------------------------------------------------------------------- */
/*                        Detect which ATS the company uses                   */
/* -------------------------------------------------------------------------- */

const detectBoard = (rawUrl: string): AtsBoard | null => {
	let url: URL;

	try {
		url = new URL(rawUrl);
	} catch {
		return null;
	}

	const host = url.hostname.toLowerCase();
	const first = url.pathname.split('/').filter(Boolean)[0] ?? '';
	const params = url.searchParams;

	const make = (ats: Ats, token: string | null | undefined): AtsBoard | null =>
		token && SAFE_TOKEN.test(token) ? { ats, token: token.toLowerCase() } : null;

	if (/(^|\.)greenhouse\.io$/.test(host)) {
		// boards.greenhouse.io/{token}  or  .../embed/job_board?for={token}
		return make(
			'greenhouse',
			params.get('for') ?? (first === 'embed' ? null : first),
		);
	}

	if (host === 'jobs.lever.co' || host === 'jobs.eu.lever.co') {
		return make('lever', first);
	}

	if (host === 'jobs.ashbyhq.com') return make('ashby', first);

	if (host === 'apply.workable.com') return make('workable', first);

	if (host.endsWith('.recruitee.com') && host !== 'www.recruitee.com') {
		return make('recruitee', host.split('.')[0]);
	}

	if (
		host === 'jobs.smartrecruiters.com' ||
		host === 'careers.smartrecruiters.com'
	) {
		return make('smartrecruiters', first);
	}

	return null;
};

// Careers pages often embed the ATS as a link, iframe or script.
const ATS_URL_IN_HTML =
	/https?:\/\/(?:[a-z0-9-]+\.)?(?:greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|recruitee\.com|smartrecruiters\.com)[^\s"'<>\\)]*/gi;

const findBoardInHtml = (html: string): AtsBoard | null => {
	for (const match of html.match(ATS_URL_IN_HTML) ?? []) {
		const board = detectBoard(match.replace(/&amp;/g, '&'));

		if (board) return board;
	}

	return null;
};

/* -------------------------------------------------------------------------- */
/*                               ATS API readers                              */
/* -------------------------------------------------------------------------- */

const readGreenhouse = async (token: string): Promise<RawJob[]> => {
	const data = await getJson(
		`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`,
	);

	return (data.jobs ?? []).map((job: any) => ({
		title: clean(job.title),
		location: clean(job.location?.name),
		url: safeUrl(job.absolute_url),
	}));
};

const readLever = async (token: string): Promise<RawJob[]> => {
	const data = await getJson(
		`https://api.lever.co/v0/postings/${token}?mode=json`,
	);

	return (Array.isArray(data) ? data : []).map((job: any) => ({
		title: clean(job.text),
		location: clean(job.categories?.location),
		url: safeUrl(job.hostedUrl),
	}));
};

const readAshby = async (token: string): Promise<RawJob[]> => {
	const data = await getJson(
		`https://api.ashbyhq.com/posting-api/job-board/${token}`,
	);

	return (data.jobs ?? []).map((job: any) => ({
		title: clean(job.title),
		location: clean(job.location),
		url: safeUrl(job.jobUrl),
	}));
};

const readWorkable = async (token: string): Promise<RawJob[]> => {
	const data = await getJson(
		`https://apply.workable.com/api/v1/widget/accounts/${token}`,
	);

	return (data.jobs ?? []).map((job: any) => ({
		title: clean(job.title),
		location:
			[job.city, job.state, job.country].map(clean).filter(Boolean).join(', ') ||
			null,
		url: safeUrl(job.url) ?? safeUrl(job.shortlink),
	}));
};

const readRecruitee = async (token: string): Promise<RawJob[]> => {
	const data = await getJson(`https://${token}.recruitee.com/api/offers/`);

	return (data.offers ?? []).map((job: any) => ({
		title: clean(job.title),
		location: clean(job.location) ?? clean(job.city),
		url: safeUrl(job.careers_url),
	}));
};

const readSmartRecruiters = async (token: string): Promise<RawJob[]> => {
	const data = await getJson(
		`https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=100`,
	);

	return (data.content ?? []).map((job: any) => ({
		title: clean(job.name),
		location:
			[job.location?.city, job.location?.country?.toUpperCase?.()]
				.map(clean)
				.filter(Boolean)
				.join(', ') || null,
		url: job.id ? `https://jobs.smartrecruiters.com/${token}/${job.id}` : null,
	}));
};

const readers: Record<Ats, (token: string) => Promise<RawJob[]>> = {
	greenhouse: readGreenhouse,
	lever: readLever,
	ashby: readAshby,
	workable: readWorkable,
	recruitee: readRecruitee,
	smartrecruiters: readSmartRecruiters,
};

/* -------------------------------------------------------------------------- */
/*                     Fallback: JobPosting JSON-LD on a page                 */
/* -------------------------------------------------------------------------- */

const jobPostingsFromHtml = (html: string, pageUrl: string): RawJob[] => {
	const jobs: RawJob[] = [];
	const blocks = html.matchAll(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
	);

	for (const block of blocks) {
		try {
			const stack: any[] = [JSON.parse(block[1])].flat();

			while (stack.length) {
				const node = stack.pop();

				if (!node || typeof node !== 'object') continue;

				if (Array.isArray(node['@graph'])) stack.push(...node['@graph']);

				const type = [node['@type']].flat().join(' ');

				if (!/JobPosting/i.test(type)) continue;

				const place = [node.jobLocation].flat()[0]?.address;
				const location =
					typeof place === 'object'
						? [place.addressLocality, place.addressRegion, place.addressCountry]
								.map((part: any) => clean(typeof part === 'object' ? part?.name : part))
								.filter(Boolean)
								.join(', ') || null
						: clean(place);

				jobs.push({
					title: clean(node.title),
					location,
					url: safeUrl(node.url) ?? pageUrl,
				});
			}
		} catch {
			// Ignore invalid JSON-LD.
		}
	}

	return jobs;
};

const fetchPageHtml = async (url: string): Promise<string | null> => {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'CompanyResearchBot/1.0',
				Accept: 'text/html',
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		});

		if (!response.ok) return null;

		const html = await response.text();

		return html.length > MAX_HTML_CHARS ? null : html;
	} catch {
		return null;
	}
};

/* -------------------------------------------------------------------------- */
/*                                  Public API                                */
/* -------------------------------------------------------------------------- */

const sameSite = (a: string, b: string): boolean => {
	try {
		const strip = (value: string) =>
			new URL(value).hostname.toLowerCase().replace(/^www\./, '');

		return strip(a) === strip(b);
	} catch {
		return false;
	}
};

const dedupe = (jobs: RawJob[]): JobOpportunity[] => {
	const seen = new Set<string>();
	const result: JobOpportunity[] = [];

	for (const job of jobs) {
		if (!job.title) continue;

		const key = `${job.title}|${job.location ?? ''}`.toLowerCase();

		if (seen.has(key)) continue;

		seen.add(key);
		result.push({ title: job.title, location: job.location, url: job.url });
	}

	return result;
};

const pathOf = (url: string): string => {
	try {
		return new URL(url).pathname;
	} catch {
		return '';
	}
};

/** Careers link found by the crawler, or a crawled page that is a careers page. */
export const findCareersUrl = (pages: CrawledPage[]): string | null =>
	pages.find((page) => page.careersUrl)?.careersUrl ??
	pages.find((page, index) => index > 0 && /career|job/i.test(pathOf(page.url)))
		?.url ??
	null;

export const fetchJobOpenings = async (
	pages: CrawledPage[],
): Promise<JobOpportunity[]> => {
	try {
		const careersUrl = findCareersUrl(pages);

		// 1. A link found while crawling may already point at the ATS.
		const candidates = [
			careersUrl,
			...pages.map((page) => page.careersUrl),
		].filter((url): url is string => !!url);

		let board: AtsBoard | null = null;

		for (const url of candidates) {
			board = detectBoard(url);

			if (board) break;
		}

		// 2. Otherwise read the careers page and look for an embedded ATS.
		//    Only pages on the company's own site are fetched here.
		let careersHtml: string | null = null;
		const siteUrl = pages[0]?.url;

		if (!board && careersUrl && siteUrl && sameSite(careersUrl, siteUrl)) {
			careersHtml = await fetchPageHtml(careersUrl);

			if (careersHtml) board = findBoardInHtml(careersHtml);
		}

		// 3. Ask the ATS API (exact data).
		if (board) {
			const jobs = dedupe(await readers[board.ats](board.token));

			if (jobs.length > 0) return jobs.slice(0, MAX_JOBS);
		}

		// 4. Fallback: JobPosting structured data on the careers page.
		if (careersHtml && careersUrl) {
			return dedupe(jobPostingsFromHtml(careersHtml, careersUrl)).slice(
				0,
				MAX_JOBS,
			);
		}
	} catch (error: any) {
		console.warn('Job lookup skipped:', error?.message);
	}

	return [];
};
