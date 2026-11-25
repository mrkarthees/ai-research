import { apiPost } from './client';
import { getToken } from './auth';

const inFlight = new Map();

// "https://www.Zoho.com/about" -> "www.zoho.com". Returns null if invalid.
export const normalizeDomain = (input = '') => {
	const host = input
		.trim()
		.toLowerCase()
		.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
		.split(/[/?#]/)[0];

	return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(
		host,
	)
		? host
		: null;
};

const cacheKey = (domain) => `research:${domain}`;

const readCache = (domain) => {
	try {
		return JSON.parse(sessionStorage.getItem(cacheKey(domain)));
	} catch {
		return null;
	}
};

const writeCache = (domain, value) => {
	try {
		sessionStorage.setItem(cacheKey(domain), JSON.stringify(value));
	} catch {
		// Storage can be full or blocked. The result still shows.
	}
};

/*
 * Each research crawls a website and uses AI, so it is slow and counts
 * against the free quota. Results are kept for the browser session, and two
 * identical requests at the same time share one API call.
 */
export const researchCompany = async (domain, { force = false } = {}) => {
	if (!force) {
		const cached = readCache(domain);

		if (cached) return { ...cached, cached: true };

		if (inFlight.has(domain)) return inFlight.get(domain);
	}

	const request = apiPost('/api/v1/research', { websiteUrl: domain }, getToken())
		.then((response) => {
			writeCache(domain, response);

			return { ...response, cached: false };
		})
		.finally(() => inFlight.delete(domain));

	inFlight.set(domain, request);

	return request;
};
