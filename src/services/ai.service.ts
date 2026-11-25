import { generateJsonText, ChatMessage } from './gemini.service';
import { findCareersUrl } from './jobs.service';
import { CrawledPage } from '../dtos/research.dto';
import { CompanyFacts } from './enrichment.service';

/*
 * One Gemini call writes the summary, industry, services, employee count and
 * office locations. Everything the model says is checked against the crawled
 * text. Contacts, socials, careers URL and job openings never come from the
 * model (see crawling.service, enrichment.service and jobs.service).
 */

export interface SourcePage {
	url: string;
	title: string;
	socialLinks: string[];
	careersUrl: string | null;
}

export interface AIResearchResult {
	summary: string | null;
	industry: string | null;
	services: string[];
	employee_count: string | null;
	office_locations: string[];
	contact_details: {
		emails: string[];
		phone_numbers: string[];
		social_links: string[];
	};
	careers_url: string | null;
	sources: SourcePage[];
}

interface ModelOutput {
	summary?: unknown;
	industry?: unknown;
	services?: unknown;
	employee_count?: unknown;
	office_locations?: unknown;
}

const MAX_ATTEMPTS = 2;
const MODEL_MAX_TOKENS = 2000;
const MAX_CONTEXT_CHARS = 60_000;
const MIN_SECTION_CHARS = 400;
const MAX_SERVICES = 14;
const MAX_LOCATIONS = 10;
const MAX_CONTACTS = 10;
const MAX_SOCIAL_LINKS = 12;

const RESEARCH_SCHEMA = {
	type: 'object',
	properties: {
		summary: { type: 'string' },
		industry: { type: 'string' },
		services: { type: 'array', items: { type: 'string' } },
		employee_count: { type: 'string' },
		office_locations: { type: 'array', items: { type: 'string' } },
	},
	required: [
		'summary',
		'industry',
		'services',
		'employee_count',
		'office_locations',
	],
};

/* -------------------------------------------------------------------------- */
/*                                Small helpers                               */
/* -------------------------------------------------------------------------- */

const NULL_LIKE = /^(null|n\/a|na|none|unknown|not specified)$/i;
const GENERIC_SERVICE =
	/^(log ?in|sign ?(in|up)|pricing|blog|support|contact( us)?|partners?|privacy|terms|about( us)?|careers?|home|resources?|docs?|documentation)$/i;

const toText = (value: unknown): string | null => {
	if (typeof value === 'number') return String(value);

	if (typeof value !== 'string') return null;

	const text = value.replace(/\s+/g, ' ').trim();

	return text && !NULL_LIKE.test(text) ? text : null;
};

const normalizeKey = (text: string): string =>
	text.toLowerCase().replace(/[^a-z0-9]/g, '');

// Keeps the first occurrence of every value, in O(n) with a Set.
const uniqueTexts = (values: unknown[], maxLength = 200): string[] => {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const value of values) {
		const text = toText(value);

		if (!text || text.length > maxLength) continue;

		const key = normalizeKey(text);

		if (!key || seen.has(key)) continue;

		seen.add(key);
		result.push(text);
	}

	return result;
};

const hostKey = (url: string): string => {
	try {
		return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
	} catch {
		return '';
	}
};

const pathOf = (url: string): string => {
	try {
		return new URL(url).pathname.toLowerCase();
	} catch {
		return '';
	}
};

// twitter.com and x.com are the same platform.
const platformKey = (url: string): string => {
	const host = hostKey(url);

	return host === 'twitter.com' ? 'x.com' : host;
};

const parseModelJson = (response: string): ModelOutput => {
	const cleaned = response
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '')
		.trim();

	try {
		return JSON.parse(cleaned);
	} catch {
		const start = cleaned.indexOf('{');
		const end = cleaned.lastIndexOf('}');

		if (start !== -1 && end > start) {
			return JSON.parse(cleaned.slice(start, end + 1));
		}

		throw new Error('The AI returned invalid JSON');
	}
};

/* -------------------------------------------------------------------------- */
/*                               Context building                             */
/* -------------------------------------------------------------------------- */

type PageKind =
	| 'home'
	| 'about'
	| 'offerings'
	| 'contact'
	| 'careers'
	| 'other';

// The most useful pages are written into the context first.
const KIND_ORDER: PageKind[] = [
	'home',
	'about',
	'offerings',
	'contact',
	'careers',
	'other',
];

const KIND_RANK = new Map(KIND_ORDER.map((kind, index) => [kind, index]));

const KIND_BUDGET: Record<PageKind, number> = {
	home: 10_000,
	about: 7_000,
	offerings: 7_000,
	contact: 5_000,
	careers: 3_000,
	other: 3_000,
};

const KIND_RULES: [PageKind, RegExp][] = [
	['careers', /career|job/],
	['contact', /contact|location|office/],
	['about', /about|company|who-we|story|team|leadership/],
	['offerings', /service|product|solution|platform|industr/],
];

const pageKind = (page: CrawledPage, index: number): PageKind => {
	if (index === 0) return 'home';

	const path = pathOf(page.url);

	return KIND_RULES.find(([, rule]) => rule.test(path))?.[0] ?? 'other';
};

const pageSection = (
	page: CrawledPage,
	budget: number,
	isHome: boolean,
): string => {
	const lines = [`### PAGE: ${page.title}`, `URL: ${page.url}`];

	if (page.description) lines.push(`Meta description: ${page.description}`);

	const org = page.organization;

	if (org?.name) lines.push(`Company name (structured data): ${org.name}`);
	if (org?.employeeCount) {
		lines.push(`Employees (structured data): ${org.employeeCount}`);
	}
	if (org?.addresses?.length) {
		lines.push(`Addresses (structured data): ${org.addresses.join(' | ')}`);
	}

	if (page.addresses.length) {
		lines.push(`Addresses on page: ${page.addresses.slice(0, 3).join(' | ')}`);
	}

	if (isHome && page.navLinks.length) {
		lines.push(
			`Navigation and footer link labels (often product names): ${page.navLinks.join(' | ')}`,
		);
	}

	lines.push('Text:', page.content.slice(0, budget));

	if (isHome && page.footerText) {
		lines.push('Footer:', page.footerText.slice(0, 500));
	}

	return lines.join('\n');
};

const factsBlock = (facts: CompanyFacts): string => {
	const lines = [
		'### VERIFIED FACTS (Wikidata / Wikipedia, matched to this website)',
	];

	if (facts.name) lines.push(`Name: ${facts.name}`);
	if (facts.description) lines.push(`Description: ${facts.description}`);
	if (facts.foundedYear) lines.push(`Founded: ${facts.foundedYear}`);
	if (facts.headquarters.length) {
		lines.push(`Headquarters: ${facts.headquarters.join(', ')}`);
	}
	if (facts.industries.length) {
		lines.push(`Industry: ${facts.industries.join(', ')}`);
	}
	if (facts.wikipediaSummary) {
		lines.push(`Wikipedia: ${facts.wikipediaSummary.slice(0, 700)}`);
	}

	return lines.join('\n');
};

const buildContext = (
	pages: CrawledPage[],
	facts: CompanyFacts | null,
): string => {
	const sections = facts ? [factsBlock(facts)] : [];
	let remaining = MAX_CONTEXT_CHARS - (sections[0]?.length ?? 0);

	const ordered = pages
		.map((page, index) => ({ page, kind: pageKind(page, index) }))
		.sort((a, b) => KIND_RANK.get(a.kind)! - KIND_RANK.get(b.kind)!);

	for (const { page, kind } of ordered) {
		if (remaining < MIN_SECTION_CHARS) break;

		const section = pageSection(
			page,
			Math.min(KIND_BUDGET[kind], remaining),
			kind === 'home',
		);

		sections.push(section);
		remaining -= section.length;
	}

	return sections.join('\n\n');
};

/* -------------------------------------------------------------------------- */
/*                                   Prompt                                   */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT =
	'You are a precise business research analyst. You extract facts about a company from crawled website text. You never invent facts. You answer only with JSON that matches the requested schema.';

const buildMessages = (context: string): ChatMessage[] => [
	{ role: 'system', content: SYSTEM_PROMPT },
	{
		role: 'user',
		content: `Describe the company behind this website using ONLY the content below. If a VERIFIED FACTS section exists, you may use it. Never guess.

FIELDS
- summary: 3-4 sentences. Say what the company does, which products or services it sells, who its customers are, and (when stated) when it was founded, where it is headquartered and whether it is private or public.
- industry: one short label (1-4 words), for example "Software / SaaS", "Information Technology", "Financial Services", "Healthcare", "Manufacturing", "E-commerce", "Education", "Logistics". Always give one when the business is clear.
- services: the main products, product categories and services as short names (max ${MAX_SERVICES}). Navigation and footer link labels often list the real product names: use them. If there are many products, group them into categories (for example "CRM", "Finance and Accounting"). Ignore generic items such as Login, Pricing, Blog, Support, Contact, Partners, Privacy. No duplicates. No sentences.
- employee_count: only if the text explicitly states a number of employees (for example "19,000+ employees"). Keep the wording short. Otherwise "".
- office_locations: full addresses, or city and country, that are explicitly stated as an office or headquarters. Otherwise [].

WEBSITE CONTENT:

${context}`,
	},
];

/* -------------------------------------------------------------------------- */
/*                                 Model call                                 */
/* -------------------------------------------------------------------------- */

const askModel = async (context: string): Promise<ModelOutput | null> => {
	const messages = buildMessages(context);

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const text = await generateJsonText(
				messages,
				RESEARCH_SCHEMA,
				MODEL_MAX_TOKENS,
			);

			return parseModelJson(text);
		} catch (error: any) {
			console.error(
				`AI attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
				error?.message,
			);
		}
	}

	return null;
};

/* -------------------------------------------------------------------------- */
/*                      Checking the model against the text                   */
/* -------------------------------------------------------------------------- */

const normalizeText = (text: string): string =>
	text.toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');

// Keep an employee count only if its numbers appear in the website text.
const verifyEmployeeCount = (
	value: string | null,
	haystack: string,
): string | null => {
	const numbers = value?.match(/\d[\d,]*/g)?.map((n) => n.replace(/,/g, ''));

	if (!value || !numbers?.length) return null;

	return numbers.every((number) => haystack.includes(number)) ? value : null;
};

// Keep a location only if at least half of its parts appear in the text.
const isLocationSupported = (location: string, haystack: string): boolean => {
	const parts = location
		.split(/[,;|]/)
		.map((part) => part.trim().toLowerCase())
		.filter((part) => part.length >= 3);

	if (parts.length === 0) return false;

	const found = parts.filter((part) => haystack.includes(part)).length;

	return found / parts.length >= 0.5;
};

/* -------------------------------------------------------------------------- */
/*                         Deterministic data from crawl                      */
/* -------------------------------------------------------------------------- */

const collectEmails = (pages: CrawledPage[], siteHost: string): string[] => {
	const isSiteEmail = (email: string) =>
		email.endsWith(`@${siteHost}`) || email.endsWith(`.${siteHost}`);

	const all = [...new Set(pages.flatMap((page) => page.emails))];

	// Emails on the company's own domain first.
	return [
		...all.filter(isSiteEmail),
		...all.filter((email) => !isSiteEmail(email)),
	].slice(0, MAX_CONTACTS);
};

const collectPhones = (pages: CrawledPage[]): string[] => {
	const byDigits = new Map<string, string>();

	for (const phone of pages.flatMap((page) => page.phoneNumbers)) {
		const digits = phone.replace(/\D/g, '');

		if (!byDigits.has(digits)) byDigits.set(digits, phone);
	}

	return [...byDigits.values()].slice(0, MAX_CONTACTS);
};

// Links from the crawler first, then Wikidata for missing platforms.
const collectSocialLinks = (
	pages: CrawledPage[],
	facts: CompanyFacts | null,
): string[] => {
	const byUrl = new Map<string, string>();

	for (const link of pages.flatMap((page) => page.socialLinks)) {
		const key = link.replace(/\/+$/, '').toLowerCase();

		if (!byUrl.has(key)) byUrl.set(key, link);
	}

	const platforms = new Set([...byUrl.values()].map(platformKey));

	for (const link of facts?.socialLinks ?? []) {
		const platform = platformKey(link);

		if (platforms.has(platform)) continue;

		platforms.add(platform);
		byUrl.set(link.toLowerCase(), link);
	}

	return [...byUrl.values()].slice(0, MAX_SOCIAL_LINKS);
};

const collectAddresses = (pages: CrawledPage[]): string[] =>
	pages.flatMap((page) => [
		...(page.organization?.addresses ?? []),
		...page.addresses,
	]);

const structuredEmployeeCount = (pages: CrawledPage[]): string | null => {
	for (const page of pages) {
		const count = toText(page.organization?.employeeCount);

		if (count) return count;
	}

	return null;
};

const wikidataEmployeeCount = (facts: CompanyFacts | null): string | null => {
	if (!facts?.employees) return null;

	const { count, year } = facts.employees;
	const source = year ? `${year}, Wikidata` : 'Wikidata';

	return `approx. ${count.toLocaleString('en-US')} (${source})`;
};

const buildSummary = (
	modelSummary: string | null,
	pages: CrawledPage[],
	facts: CompanyFacts | null,
): string | null => {
	const summary =
		modelSummary ??
		toText(pages[0]?.description) ??
		facts?.wikipediaSummary?.split('. ').slice(0, 2).join('. ') ??
		null;

	if (!summary || !facts?.foundedYear) return summary;

	// Add the verified founding year / HQ when the model left them out.
	if (summary.includes(String(facts.foundedYear))) return summary;

	const hq = facts.headquarters[0];

	return `${summary.replace(/\s+$/, '')} Founded in ${facts.foundedYear}${
		hq ? ` and headquartered in ${hq}` : ''
	}.`;
};

/* -------------------------------------------------------------------------- */
/*                                 Public API                                 */
/* -------------------------------------------------------------------------- */

export const generateCompanyResearch = async (
	pages: CrawledPage[],
	facts: CompanyFacts | null = null,
): Promise<AIResearchResult> => {
	if (!pages.length) throw new Error('No crawled pages were supplied');

	const context = buildContext(pages, facts);
	const haystack = normalizeText(context);
	const output = await askModel(context);

	if (!output) {
		console.warn('AI extraction failed, returning crawler/Wikidata data only.');
	}

	const modelLocations = uniqueTexts(
		Array.isArray(output?.office_locations) ? output.office_locations : [],
		250,
	).filter((location) => isLocationSupported(location, haystack));

	// Trust order: website structured data > verified model answer > Wikidata.
	const employeeCount =
		structuredEmployeeCount(pages) ??
		verifyEmployeeCount(toText(output?.employee_count), haystack) ??
		wikidataEmployeeCount(facts);

	const services = uniqueTexts(
		Array.isArray(output?.services) ? output.services : [],
		100,
	)
		.filter((service) => !GENERIC_SERVICE.test(service))
		.slice(0, MAX_SERVICES);

	return {
		summary: buildSummary(toText(output?.summary), pages, facts),
		industry: toText(output?.industry) ?? facts?.industries[0] ?? null,
		services,
		employee_count: employeeCount,
		office_locations: uniqueTexts(
			[
				...collectAddresses(pages),
				...modelLocations,
				...(facts?.headquarters ?? []),
			],
			250,
		).slice(0, MAX_LOCATIONS),
		contact_details: {
			emails: collectEmails(pages, hostKey(pages[0].url)),
			phone_numbers: collectPhones(pages),
			social_links: collectSocialLinks(pages, facts),
		},
		careers_url: findCareersUrl(pages),
		sources: pages.map((page) => ({
			url: page.url,
			title: page.title,
			socialLinks: page.socialLinks,
			careersUrl: page.careersUrl,
		})),
	};
};
