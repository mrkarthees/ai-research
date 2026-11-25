import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import net from 'node:net';
import {
	CrawledPage,
	CrawlingResponse,
	OrganizationData,
} from '../dtos/research.dto';

const MAX_PAGES = 8;
const MAX_PAGE_CONTENT = 12000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT = 15000;
const CONCURRENCY = 3;
const MIN_TEXT_LENGTH = 400; // below this we assume the page is JS-rendered
const MAX_BROWSER_RENDERS = 3; // per crawl

const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const COMMON_PATHS = [
	'/about',
	'/about-us',
	'/company',
	'/contact',
	'/contact-us',
	'/careers',
	'/services',
	'/products',
	'/solutions',
];

const LINK_WEIGHTS: [string, number][] = [
	['about', 10],
	['who-we-are', 10],
	['our-story', 8],
	['company', 9],
	['contact', 9],
	['career', 9],
	['job', 7],
	['services', 9],
	['solutions', 8],
	['products', 8],
	['platform', 6],
	['team', 6],
	['leadership', 6],
	['industr', 5],
	['location', 6],
	['office', 6],
];

const EXCLUDED_LINK_REGEX =
	/\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?|mp4|mp3)$|\/(blog|news|press|articles?|privacy|terms|cookies?|login|signin|signup|cart|tag|category|events?)(\/|$)/i;

const SOCIAL_DOMAINS = [
	'facebook.com',
	'instagram.com',
	'twitter.com',
	'x.com',
	'linkedin.com',
	'youtube.com',
	't.me',
	'pinterest.com',
];

const CAREERS_REGEX =
	/\b(careers?|jobs?|vacanc(?:y|ies)|recruitment|join[- ]us|work[- ]with[- ]us|we'?re[- ]hiring)\b/i;

const JOB_PORTAL_REGEX =
	/(lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com|smartrecruiters\.com|zohorecruit\.com|keka\.com|bamboohr\.com|recruitee\.com|breezy\.hr|darwinbox\.in|myworkdayjobs\.com)$/;

const ORG_TYPE_REGEX =
	/(Organization|Corporation|LocalBusiness|Company|OnlineBusiness|Store|ProfessionalService|NGO|EducationalOrganization)$/i;

/* -------------------------------------------------------------------------- */
/*                               SSRF protection                              */
/* -------------------------------------------------------------------------- */

const isPrivateIPv4 = (ip: string): boolean => {
	const [a, b] = ip.split('.').map(Number);

	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 198 && (b === 18 || b === 19)) ||
		a >= 224
	);
};

const isPrivateIPv6 = (ip: string): boolean => {
	const value = ip.toLowerCase();

	if (value === '::1' || value === '::') return true;

	// IPv4-mapped, dotted form (::ffff:127.0.0.1)
	const mappedDotted = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
	if (mappedDotted) return isPrivateIPv4(mappedDotted[1]);

	// IPv4-mapped, hex form (::ffff:7f00:1)
	const mappedHex = value.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
	if (mappedHex) {
		const hi = parseInt(mappedHex[1], 16);
		const lo = parseInt(mappedHex[2], 16);

		return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
	}

	return /^f[cd]/.test(value) || /^fe[89ab]/.test(value);
};

const validatePublicUrl = async (url: string): Promise<URL> => {
	const parsedUrl = new URL(url);

	if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
		throw new Error('Only HTTP and HTTPS URLs are allowed');
	}

	if (parsedUrl.username || parsedUrl.password) {
		throw new Error('URLs containing credentials are not allowed');
	}

	// URL.hostname keeps the brackets for IPv6 literals, so strip them.
	const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '');

	if (
		hostname === 'localhost' ||
		hostname.endsWith('.localhost') ||
		hostname.endsWith('.local') ||
		hostname.endsWith('.internal')
	) {
		throw new Error('Private network URLs are not allowed');
	}

	const ipVersion = net.isIP(hostname);

	if (ipVersion === 4 && isPrivateIPv4(hostname)) {
		throw new Error('Private IP addresses are not allowed');
	}

	if (ipVersion === 6 && isPrivateIPv6(hostname)) {
		throw new Error('Private IP addresses are not allowed');
	}

	if (!ipVersion) {
		let addresses: { address: string; family: number }[];

		try {
			addresses = await dns.lookup(hostname, { all: true, verbatim: true });
		} catch {
			throw new Error('The website domain could not be found');
		}

		if (
			addresses.length === 0 ||
			addresses.some(({ address, family }) =>
				family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address),
			)
		) {
			throw new Error('The website resolves to a private network address');
		}
	}

	return parsedUrl;
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const hasScheme = (value: string): boolean =>
	/^[a-z][a-z0-9+.-]*:\/\//i.test(value.trim());

const normalizeInputUrl = (input: string): string => {
	const trimmed = (input || '').trim();

	if (!trimmed) throw new Error('Website URL is required');

	return hasScheme(trimmed) ? trimmed : `https://${trimmed}`;
};

const hostKey = (url: string): string =>
	new URL(url).hostname.toLowerCase().replace(/^www\./, '');

const canonicalUrl = (url: string): string => {
	const parsed = new URL(url);

	return `${parsed.hostname.toLowerCase().replace(/^www\./, '')}${parsed.pathname
		.replace(/\/+$/, '')
		.toLowerCase()}`;
};

const asString = (value: any): string | null => {
	if (typeof value === 'number') return String(value);

	if (typeof value !== 'string') return null;

	const cleaned = value.replace(/\s+/g, ' ').trim();

	return cleaned.length > 0 ? cleaned : null;
};

const toArray = (value: any): any[] =>
	value === undefined || value === null
		? []
		: Array.isArray(value)
			? value
			: [value];

// Collapse whitespace per line and drop repeated lines (menus, banners).
const cleanText = (raw: string): string => {
	const seen = new Set<string>();
	const lines: string[] = [];

	for (const line of raw.split('\n')) {
		const text = line.replace(/\s+/g, ' ').trim();

		if (text.length < 2) continue;

		const key = text.toLowerCase();

		if (seen.has(key)) continue;

		seen.add(key);
		lines.push(text);
	}

	return lines.join('\n');
};

const isValidEmail = (email: string): boolean =>
	/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(email) &&
	!/\.(png|jpe?g|gif|svg|webp|css|js|woff2?)$/i.test(email) &&
	!/(example\.com|sentry|wixpress|yourdomain|domain\.com|@2x)/i.test(email);

const normalizePhone = (
	raw: string,
	minDigits = 8,
): { display: string; digits: string } | null => {
	const display = raw
		.replace(/^tel:/i, '')
		.replace(/[^\d+()\-.\s]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	const digits = display.replace(/\D/g, '');

	if (digits.length < minDigits || digits.length > 15) return null;

	// Skip things like 2023-11-05
	if (/^\d{4}[-.]\d{1,2}[-.]\d{1,2}$/.test(display)) return null;

	return { display, digits };
};

const isSocialUrl = (url: URL): boolean => {
	const host = url.hostname.toLowerCase().replace(/^www\./, '');

	const isSocialHost = SOCIAL_DOMAINS.some(
		(domain) => host === domain || host.endsWith(`.${domain}`),
	);

	return (
		isSocialHost &&
		url.pathname.length > 1 &&
		!/share|sharer|intent|login|dialog|watch|embed/i.test(url.pathname)
	);
};

/* -------------------------------------------------------------------------- */
/*                         JSON-LD (structured data)                          */
/* -------------------------------------------------------------------------- */

const collectJsonLd = ($: cheerio.CheerioAPI): any[] => {
	const nodes: any[] = [];

	$('script[type="application/ld+json"]').each((_, element) => {
		try {
			const data = JSON.parse($(element).text());
			const stack: any[] = Array.isArray(data) ? [...data] : [data];

			while (stack.length) {
				const node = stack.pop();

				if (!node || typeof node !== 'object') continue;

				if (Array.isArray(node['@graph'])) stack.push(...node['@graph']);

				nodes.push(node);
			}
		} catch {
			// Ignore invalid JSON-LD.
		}
	});

	return nodes;
};

const formatAddress = (address: any): string | null => {
	if (!address) return null;

	if (typeof address === 'string') return asString(address);

	if (typeof address !== 'object') return null;

	const country =
		typeof address.addressCountry === 'object'
			? address.addressCountry?.name
			: address.addressCountry;

	const parts = [
		address.streetAddress,
		address.addressLocality,
		address.addressRegion,
		address.postalCode,
		country,
	]
		.filter((part) => typeof part === 'string' && part.trim())
		.map((part: string) => part.trim());

	return parts.length ? parts.join(', ') : null;
};

const extractOrganization = (
	$: cheerio.CheerioAPI,
): OrganizationData | null => {
	const nodes = collectJsonLd($).filter((node) =>
		toArray(node['@type']).some(
			(type) => typeof type === 'string' && ORG_TYPE_REGEX.test(type),
		),
	);

	if (nodes.length === 0) return null;

	const org: OrganizationData = {
		name: null,
		description: null,
		employeeCount: null,
		addresses: [],
		emails: [],
		phones: [],
		sameAs: [],
	};

	for (const node of nodes) {
		org.name = org.name || asString(node.name);
		org.description = org.description || asString(node.description);

		const employees = node.numberOfEmployees;

		if (!org.employeeCount && employees) {
			const value =
				typeof employees === 'object'
					? (employees.value ??
						[employees.minValue, employees.maxValue].filter(Boolean).join('-'))
					: employees;

			org.employeeCount = asString(value);
		}

		const addresses = [
			...toArray(node.address),
			...toArray(node.location).map((location) => location?.address),
		];

		for (const address of addresses) {
			const formatted = formatAddress(address);

			if (formatted) org.addresses.push(formatted);
		}

		const email = asString(node.email)?.replace(/^mailto:/i, '');
		if (email && isValidEmail(email)) org.emails.push(email.toLowerCase());

		const phone = asString(node.telephone);
		if (phone) org.phones.push(phone);

		for (const point of toArray(node.contactPoint)) {
			const pointEmail = asString(point?.email)?.replace(/^mailto:/i, '');
			if (pointEmail && isValidEmail(pointEmail)) {
				org.emails.push(pointEmail.toLowerCase());
			}

			const pointPhone = asString(point?.telephone);
			if (pointPhone) org.phones.push(pointPhone);
		}

		for (const link of toArray(node.sameAs)) {
			if (typeof link === 'string') org.sameAs.push(link);
		}
	}

	org.addresses = [...new Set(org.addresses)];
	org.emails = [...new Set(org.emails)];
	org.phones = [...new Set(org.phones)];
	org.sameAs = [...new Set(org.sameAs)];

	return org;
};

/* -------------------------------------------------------------------------- */
/*                                 Fetching                                   */
/* -------------------------------------------------------------------------- */

const fetchHtml = async (
	url: string,
): Promise<{ html: string; finalUrl: string }> => {
	let currentUrl = url;

	for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt++) {
		await validatePublicUrl(currentUrl);

		const response = await fetch(currentUrl, {
			redirect: 'manual',
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'text/html,application/xhtml+xml',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		});

		if ([301, 302, 303, 307, 308].includes(response.status)) {
			const location = response.headers.get('location');

			if (!location) throw new Error('Invalid website redirect');

			currentUrl = new URL(location, currentUrl).toString();
			continue;
		}

		if (!response.ok) {
			throw new Error(`Website returned HTTP ${response.status}`);
		}

		const contentType = response.headers.get('content-type') || '';

		if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
			throw new Error('The requested page is not an HTML page');
		}

		const declaredLength = Number(response.headers.get('content-length') || 0);

		if (declaredLength > MAX_HTML_BYTES) {
			throw new Error('Website page is too large to process');
		}

		const html = await response.text();

		if (html.length > MAX_HTML_BYTES) {
			throw new Error('Website page is too large to process');
		}

		return { html, finalUrl: currentUrl };
	}

	throw new Error('Too many website redirects');
};

/**
 * Optional fallback for JavaScript-rendered sites.
 * Requires:  npm i playwright && npx playwright install chromium
 * If Playwright is not installed this silently returns null.
 */
const renderWithBrowser = async (
	url: string,
): Promise<{ html: string; finalUrl: string } | null> => {
	let browser: any;

	try {
		const moduleName = 'playwright';
		const { chromium } = await import(moduleName);

		browser = await chromium.launch({ headless: true });

		const context = await browser.newContext({ userAgent: USER_AGENT });
		const page = await context.newPage();

		// Block heavy assets and any request to a private network.
		await page.route('**/*', async (route: any) => {
			const request = route.request();

			if (
				['image', 'media', 'font', 'stylesheet'].includes(request.resourceType())
			) {
				return route.abort();
			}

			if (/^(data|blob):/i.test(request.url())) return route.continue();

			try {
				await validatePublicUrl(request.url());
				return route.continue();
			} catch {
				return route.abort();
			}
		});

		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
		await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

		const html: string = await page.content();
		const finalUrl: string = page.url();

		return html.length > MAX_HTML_BYTES ? null : { html, finalUrl };
	} catch {
		return null;
	} finally {
		if (browser) await browser.close().catch(() => {});
	}
};

/* -------------------------------------------------------------------------- */
/*                              Page extraction                               */
/* -------------------------------------------------------------------------- */

const extractPageContent = (
	html: string,
	pageUrl: string,
	renderedWithBrowser = false,
): CrawledPage => {
	const $ = cheerio.load(html);
	const pageHost = hostKey(pageUrl);

	// Keep line breaks so the AI sees structure instead of one long blob.
	$('br').replaceWith('\n');
	$(
		'p,div,li,h1,h2,h3,h4,h5,h6,section,article,tr,td,th,dt,dd,address,blockquote',
	).each((_, element) => {
		$(element).append('\n');
	});

	// 1. Structured data (must run before <script> tags are removed).
	const organization = extractOrganization($);

	// 2. Meta description.
	const description =
		asString($('meta[name="description"]').attr('content')) ||
		asString($('meta[property="og:description"]').attr('content')) ||
		asString($('meta[name="twitter:description"]').attr('content')) ||
		organization?.description ||
		null;

	// 3. Links: social, careers, mailto, tel.
	const socialLinks = new Set<string>();
	const emails = new Set<string>(organization?.emails ?? []);
	const phones = new Map<string, string>();
	let careersUrl: string | null = null;

	for (const sameAs of organization?.sameAs ?? []) {
		try {
			const url = new URL(sameAs);
			if (isSocialUrl(url)) socialLinks.add(url.toString());
		} catch {
			// Ignore invalid URLs.
		}
	}

	for (const phone of organization?.phones ?? []) {
		const normalized = normalizePhone(phone);
		if (normalized) phones.set(normalized.digits, normalized.display);
	}

	$('a[href]').each((_, element) => {
		const href = ($(element).attr('href') || '').trim();

		if (!href) return;

		try {
			if (/^mailto:/i.test(href)) {
				const email = decodeURIComponent(href.slice(7).split('?')[0])
					.trim()
					.toLowerCase();

				if (isValidEmail(email)) emails.add(email);
				return;
			}

			if (/^tel:/i.test(href)) {
				const normalized = normalizePhone(decodeURIComponent(href));

				if (normalized) phones.set(normalized.digits, normalized.display);
				return;
			}

			const linkUrl = new URL(href, pageUrl);

			if (!['http:', 'https:'].includes(linkUrl.protocol)) return;

			if (isSocialUrl(linkUrl)) {
				socialLinks.add(linkUrl.toString());
				return;
			}

			if (careersUrl) return;

			const linkHost = linkUrl.hostname.toLowerCase().replace(/^www\./, '');
			const linkText = $(element).text().replace(/\s+/g, ' ').trim();

			const looksLikeCareers = CAREERS_REGEX.test(
				`${linkUrl.pathname} ${linkText.length <= 40 ? linkText : ''}`,
			);

			if (
				(linkHost === pageHost && looksLikeCareers) ||
				JOB_PORTAL_REGEX.test(linkHost)
			) {
				careersUrl = linkUrl.toString();
			}
		} catch {
			// Ignore invalid URLs.
		}
	});

	// 4. Emails written as plain text (before nav/footer are removed).
	const bodyText = $('body').text();

	for (const match of bodyText.match(
		/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/g,
	) || []) {
		if (isValidEmail(match)) emails.add(match.toLowerCase());
	}

	// 5. Phone numbers written as plain text, only in contact-like areas.
	const isContactPage = /contact/i.test(new URL(pageUrl).pathname);

	const phoneScope = [
		$('footer').text(),
		$('address').text(),
		$('[class*="contact"], [id*="contact"]').text(),
		isContactPage ? bodyText : '',
	].join('\n');

	for (const match of phoneScope.match(/(?:\+|00)?\d[\d\s().-]{7,}\d/g) || []) {
		const normalized = normalizePhone(match, 10);

		if (normalized && !phones.has(normalized.digits)) {
			phones.set(normalized.digits, normalized.display);
		}
	}

	// 6. Addresses.
	const addresses = new Set<string>(organization?.addresses ?? []);

	$('address').each((_, element) => {
		const text = cleanText($(element).text()).replace(/\n/g, ', ');

		if (text.length >= 10 && text.length <= 300) addresses.add(text);
	});

	// 7. Title.
	const title =
		asString($('title').first().text()) ||
		asString($('meta[property="og:title"]').attr('content')) ||
		asString($('h1').first().text()) ||
		pageHost;

	// 8. Footer text (often holds address / company tagline).
	const footerText = cleanText($('footer').first().text()).slice(0, 600);

	// 9. Navigation / footer link labels. Mega-menus usually list the real
	//    product and service names, so keep them as a separate short list.
	const navLinkSet = new Set<string>();

	$('nav a, footer a, [role="navigation"] a').each((_, element) => {
		const text = $(element).text().replace(/\s+/g, ' ').trim();

		if (
			text.length >= 2 &&
			text.length <= 40 &&
			!/^(home|log ?in|sign ?(in|up)|contact|privacy|terms|cookie|search|menu|skip to|read more|learn more)/i.test(
				text,
			)
		) {
			navLinkSet.add(text);
		}
	});

	const navLinks = [...navLinkSet].slice(0, 80);

	// 10. Remove noise and extract readable content.
	$(
		'script, style, noscript, iframe, svg, nav, footer, [role="navigation"], [role="contentinfo"], [id*="cookie"], [class*="cookie"], [class*="consent"]',
	).remove();

	const content = cleanText($('body').text()).slice(0, MAX_PAGE_CONTENT);

	return {
		url: pageUrl,
		title,
		description,
		content,
		footerText,
		navLinks,
		socialLinks: [...socialLinks],
		careersUrl,
		emails: [...emails],
		phoneNumbers: [...phones.values()],
		addresses: [...addresses],
		organization,
		renderedWithBrowser,
	};
};

/* -------------------------------------------------------------------------- */
/*                              Link discovery                                */
/* -------------------------------------------------------------------------- */

const discoverRelevantLinks = (html: string, baseUrl: string): string[] => {
	const $ = cheerio.load(html);
	const baseHost = hostKey(baseUrl);

	const scored = new Map<string, { url: string; score: number }>();

	$('a[href]').each((_, element) => {
		const href = $(element).attr('href');

		if (!href) return;

		try {
			const linkUrl = new URL(href, baseUrl);

			if (
				!['http:', 'https:'].includes(linkUrl.protocol) ||
				hostKey(linkUrl.toString()) !== baseHost
			) {
				return;
			}

			linkUrl.hash = '';
			linkUrl.search = '';

			const pathname = linkUrl.pathname.toLowerCase();
			const depth = pathname.split('/').filter(Boolean).length;

			if (depth === 0 || depth > 3 || EXCLUDED_LINK_REGEX.test(pathname)) return;

			const score = LINK_WEIGHTS.reduce(
				(total, [keyword, weight]) =>
					pathname.includes(keyword) ? Math.max(total, weight) : total,
				0,
			);

			if (score === 0) return;

			const key = canonicalUrl(linkUrl.toString());
			const existing = scored.get(key);

			if (!existing || score > existing.score) {
				scored.set(key, { url: linkUrl.toString(), score });
			}
		} catch {
			// Ignore invalid links.
		}
	});

	return [...scored.values()]
		.sort((a, b) => b.score - a.score)
		.map((item) => item.url);
};

/* -------------------------------------------------------------------------- */
/*                                Page loading                                */
/* -------------------------------------------------------------------------- */

const loadPage = async (
	url: string,
	budget: { browser: number },
): Promise<{ page: CrawledPage; html: string }> => {
	let html: string | null = null;
	let finalUrl = url;
	let fetchError: any = null;

	try {
		({ html, finalUrl } = await fetchHtml(url));
	} catch (error) {
		fetchError = error;
	}

	let page = html ? extractPageContent(html, finalUrl) : null;

	const blocked =
		fetchError && /HTTP (403|429|503)/.test(String(fetchError.message));
	const thin = page !== null && page.content.length < MIN_TEXT_LENGTH;

	if ((blocked || thin) && budget.browser > 0) {
		budget.browser--;

		const rendered = await renderWithBrowser(thin ? finalUrl : url);

		if (rendered) {
			const renderedPage = extractPageContent(
				rendered.html,
				rendered.finalUrl,
				true,
			);

			if (!page || renderedPage.content.length > page.content.length) {
				page = renderedPage;
				html = rendered.html;
				finalUrl = rendered.finalUrl;
			}
		}
	}

	if (!page || html === null) {
		throw fetchError ?? new Error('Unable to load page');
	}

	return { page, html };
};

const friendlyError = (error: any): string => {
	const code = error?.cause?.code;

	if (code === 'ENOTFOUND') return 'The website domain could not be found';
	if (code === 'ECONNREFUSED') return 'The website refused the connection';
	if (code === 'CERT_HAS_EXPIRED' || String(code).startsWith('ERR_TLS')) {
		return 'The website has an invalid SSL certificate';
	}
	if (error?.name === 'TimeoutError')
		return 'The website took too long to respond';

	return error?.message || 'Website crawling failed';
};

/* -------------------------------------------------------------------------- */
/*                                Public API                                  */
/* -------------------------------------------------------------------------- */

export const crawlWebsite = async (
	websiteUrl: string,
): Promise<CrawlingResponse> => {
	try {
		const startUrl = normalizeInputUrl(websiteUrl);
		const budget = { browser: MAX_BROWSER_RENDERS };

		// Load the homepage (fall back to http:// if the user typed a bare domain).
		let main: { page: CrawledPage; html: string };

		try {
			main = await loadPage(startUrl, budget);
		} catch (error) {
			if (hasScheme(websiteUrl)) throw error;

			main = await loadPage(startUrl.replace(/^https:/, 'http:'), budget);
		}

		const pages: CrawledPage[] = [main.page];
		const seenUrls = new Set<string>([canonicalUrl(main.page.url)]);
		const seenContent = new Set<string>([main.page.content.slice(0, 300)]);

		// Discovered links first, then common paths as a safety net.
		const queue = new Map<string, string>();

		for (const link of discoverRelevantLinks(main.html, main.page.url)) {
			queue.set(canonicalUrl(link), link);
		}

		for (const path of COMMON_PATHS) {
			const link = new URL(path, main.page.url).toString();

			if (!queue.has(canonicalUrl(link))) queue.set(canonicalUrl(link), link);
		}

		const pending = [...queue.values()];

		while (pending.length > 0 && pages.length < MAX_PAGES) {
			const batch = pending.splice(
				0,
				Math.min(CONCURRENCY, MAX_PAGES - pages.length),
			);

			const results = await Promise.allSettled(
				batch.map((link) => loadPage(link, budget)),
			);

			for (const result of results) {
				if (result.status !== 'fulfilled') continue;

				const { page } = result.value;
				const urlKey = canonicalUrl(page.url);
				const contentKey = page.content.slice(0, 300);

				// Skip redirects to pages we already have and SPA "soft 404" shells.
				if (seenUrls.has(urlKey) || seenContent.has(contentKey)) continue;

				seenUrls.add(urlKey);
				seenContent.add(contentKey);

				if (
					page.content.length > 100 ||
					page.emails.length > 0 ||
					page.phoneNumbers.length > 0
				) {
					pages.push(page);
				}
			}
		}

		const combinedContent = pages
			.map(
				(page) =>
					`PAGE TITLE: ${page.title}\nSOURCE URL: ${page.url}\nCONTENT: ${page.content}`,
			)
			.join('\n\n');

		if (!combinedContent.trim()) {
			throw new Error('No readable website content was found');
		}

		return {
			websiteUrl: main.page.url,
			pages,
			combinedContent,
		};
	} catch (error: any) {
		throw new Error(friendlyError(error));
	}
};
