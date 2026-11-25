import { CrawledPage } from '../dtos/research.dto';

/*
 * Looks the company up on Wikidata (free, no API key) and only accepts a match
 * when the entity's official website (P856) is the same site that was crawled.
 * This gives verified founded year, headquarters, industry, employee count,
 * social profiles and a Wikipedia summary, even when the website itself
 * does not state them.
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const REQUEST_TIMEOUT = 8000;

// Wikimedia asks for a descriptive User-Agent. Put your own contact here.
const HEADERS = {
	'User-Agent':
		'CompanyResearchBot/1.0 (company research tool; contact: admin@yourdomain.com)',
	Accept: 'application/json',
};

export interface CompanyFacts {
	entityUrl: string;
	name: string | null;
	description: string | null;
	foundedYear: number | null;
	headquarters: string[];
	industries: string[];
	employees: { count: number; year: number | null } | null;
	socialLinks: string[];
	wikipediaSummary: string | null;
}

const hostKey = (url: string): string => {
	try {
		return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
	} catch {
		return '';
	}
};

const sameSite = (a: string, b: string): boolean =>
	!!a && !!b && (a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`));

const getJson = async (url: string): Promise<any> => {
	const response = await fetch(url, {
		headers: HEADERS,
		signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	});

	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	return response.json();
};

const candidateNames = (pages: CrawledPage[]): string[] => {
	const names: string[] = [];
	const first = pages[0];
	const host = hostKey(first.url);

	if (first.organization?.name) names.push(first.organization.name);

	// "Zoho | Cloud Software Suite..." -> "Zoho"
	const titleStart = first.title.split(/[|\-–—:·•]/)[0].trim();
	if (titleStart && titleStart.length <= 40) names.push(titleStart);

	const hostLabel = host.split('.')[0];
	if (hostLabel && hostLabel.length >= 3) names.push(hostLabel);

	const seen = new Set<string>();

	return names.filter((name) => {
		const key = name.toLowerCase();

		if (seen.has(key)) return false;

		seen.add(key);
		return true;
	});
};

const claims = (entity: any, property: string): any[] =>
	(entity?.claims?.[property] ?? []).filter(
		(claim: any) => claim.rank !== 'deprecated' && claim.mainsnak?.datavalue,
	);

const findCompanyEntity = async (
	name: string,
	siteHost: string,
): Promise<any | null> => {
	const search = await getJson(
		`${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(
			name,
		)}&language=en&type=item&limit=6&format=json`,
	);

	const ids: string[] = (search.search ?? []).map((item: any) => item.id);

	if (ids.length === 0) return null;

	const data = await getJson(
		`${WIKIDATA_API}?action=wbgetentities&ids=${ids.join(
			'|',
		)}&props=claims|labels|descriptions|sitelinks&languages=en&sitefilter=enwiki&format=json`,
	);

	for (const id of ids) {
		const entity = data.entities?.[id];

		const websites: string[] = claims(entity, 'P856')
			.map((claim) => claim.mainsnak.datavalue.value)
			.filter((value: unknown): value is string => typeof value === 'string');

		if (websites.some((website) => sameSite(hostKey(website), siteHost))) {
			return entity;
		}
	}

	return null;
};

const getLabels = async (ids: string[]): Promise<string[]> => {
	if (ids.length === 0) return [];

	const data = await getJson(
		`${WIKIDATA_API}?action=wbgetentities&ids=${ids
			.slice(0, 40)
			.join('|')}&props=labels&languages=en&format=json`,
	);

	return ids
		.map((id) => data.entities?.[id]?.labels?.en?.value)
		.filter((label): label is string => typeof label === 'string');
};

const entityIds = (entity: any, property: string): string[] =>
	claims(entity, property)
		.map((claim) => claim.mainsnak.datavalue.value?.id)
		.filter((id: unknown): id is string => typeof id === 'string');

const buildSocialLinks = (entity: any): string[] => {
	const value = (property: string): string | null => {
		const raw = claims(entity, property)[0]?.mainsnak?.datavalue?.value;

		return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
	};

	const links: string[] = [];

	const twitter = value('P2002');
	const instagram = value('P2003');
	const facebook = value('P2013');
	const linkedin = value('P4264');
	const youtube = value('P2397');

	if (linkedin) links.push(`https://www.linkedin.com/company/${linkedin}`);
	if (instagram) links.push(`https://www.instagram.com/${instagram}`);
	if (facebook) links.push(`https://www.facebook.com/${facebook}`);
	if (twitter) links.push(`https://x.com/${twitter}`);
	if (youtube) links.push(`https://www.youtube.com/channel/${youtube}`);

	return links;
};

const buildFacts = async (entity: any): Promise<CompanyFacts> => {
	// Founded year.
	const inceptionTime: string | undefined = claims(entity, 'P571')[0]?.mainsnak
		?.datavalue?.value?.time;

	const foundedYear = inceptionTime?.match(/^[+-](\d{4})/)?.[1]
		? Number(inceptionTime.match(/^[+-](\d{4})/)![1])
		: null;

	// Employees: use the most recent figure.
	const employeeFigures = claims(entity, 'P1128')
		.map((claim) => {
			const amount = Number(claim.mainsnak.datavalue.value?.amount);
			const time: string | undefined =
				claim.qualifiers?.P585?.[0]?.datavalue?.value?.time;
			const year = time?.match(/^[+-](\d{4})/)?.[1];

			return {
				count: amount,
				year: year ? Number(year) : null,
			};
		})
		.filter((figure) => Number.isFinite(figure.count) && figure.count > 0)
		.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

	const [headquarters, industries] = await Promise.all([
		getLabels(entityIds(entity, 'P159')).catch(() => []),
		getLabels(entityIds(entity, 'P452')).catch(() => []),
	]);

	// Wikipedia summary.
	let wikipediaSummary: string | null = null;
	const wikiTitle: string | undefined = entity.sitelinks?.enwiki?.title;

	if (wikiTitle) {
		try {
			const summary = await getJson(
				`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
					wikiTitle.replace(/ /g, '_'),
				)}`,
			);

			wikipediaSummary =
				typeof summary.extract === 'string' ? summary.extract : null;
		} catch {
			// Wikipedia summary is optional.
		}
	}

	return {
		entityUrl: `https://www.wikidata.org/wiki/${entity.id}`,
		name: entity.labels?.en?.value ?? null,
		description: entity.descriptions?.en?.value ?? null,
		foundedYear,
		headquarters,
		industries,
		employees: employeeFigures[0] ?? null,
		socialLinks: buildSocialLinks(entity),
		wikipediaSummary,
	};
};

// Never throws: enrichment is a bonus, not a requirement.
export const fetchCompanyFacts = async (
	pages: CrawledPage[],
): Promise<CompanyFacts | null> => {
	if (pages.length === 0) return null;

	try {
		const siteHost = hostKey(pages[0].url);

		for (const name of candidateNames(pages)) {
			const entity = await findCompanyEntity(name, siteHost);

			if (entity) return await buildFacts(entity);
		}
	} catch (error: any) {
		console.warn('Company enrichment skipped:', error?.message);
	}

	return null;
};
