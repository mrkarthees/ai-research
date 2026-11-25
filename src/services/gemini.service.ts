/*
 * Gemini client (Google AI Studio / Gemini Developer API).
 *
 * .env
 *   AI_API_KEY=your_gemini_key
 *   AI_MODEL=gemini-3.1-flash-lite
 */

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

const GEMINI_BASE_URL =
	'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const REQUEST_TIMEOUT = 120_000;
const MAX_RETRY_WAIT_SECONDS = 60;
const MIN_OUTPUT_TOKENS = 8192; // "thinking" tokens count toward this limit

// Read lazily so it works no matter when dotenv is loaded.
const getConfig = () => {
	const apiKey = process.env.AI_API_KEY;
	const model = process.env.AI_MODEL || DEFAULT_MODEL;

	if (!apiKey) throw new Error('AI_API_KEY is missing in the .env file');

	return { apiKey, model };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const RATE_LIMIT_MESSAGE =
	'Gemini rate limit reached. Please try again in a minute.';

const postJson = async (
	url: string,
	apiKey: string,
	body: unknown,
): Promise<any> => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': apiKey,
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			body: JSON.stringify(body),
		});

		// The free tier is limited per minute: wait once, then retry.
		if (response.status === 429 && attempt === 0) {
			const retryAfter = Number(response.headers.get('retry-after')) || 20;

			await sleep(Math.min(retryAfter, MAX_RETRY_WAIT_SECONDS) * 1000);
			continue;
		}

		if (response.ok) return response.json();

		if (response.status === 429) throw new Error(RATE_LIMIT_MESSAGE);

		if (response.status === 404) {
			throw new Error('Gemini model not found. Check AI_MODEL in the .env file');
		}

		const text = await response.text().catch(() => '');

		throw new Error(
			`Gemini API returned HTTP ${response.status}: ${text.slice(0, 300)}`,
		);
	}

	throw new Error(RATE_LIMIT_MESSAGE);
};

/**
 * Sends the messages to Gemini and returns the JSON text of the answer.
 * The response is forced to follow `schema`.
 */
export const generateJsonText = async (
	messages: ChatMessage[],
	schema: object,
	maxTokens: number,
): Promise<string> => {
	const { apiKey, model } = getConfig();

	const system = messages
		.filter((message) => message.role === 'system')
		.map((message) => message.content)
		.join('\n\n');

	const contents = messages
		.filter((message) => message.role !== 'system')
		.map((message) => ({
			role: message.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: message.content }],
		}));

	const data = await postJson(
		`${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`,
		apiKey,
		{
			systemInstruction: { parts: [{ text: system }] },
			contents,
			generationConfig: {
				// Gemini 3 recommends its default temperature.
				...(model.includes('gemini-3') ? {} : { temperature: 0 }),
				maxOutputTokens: Math.max(maxTokens, MIN_OUTPUT_TOKENS),
				responseMimeType: 'application/json',
				responseJsonSchema: schema,
			},
		},
	);

	const candidate = data.candidates?.[0];

	if (!candidate) {
		const reason = data.promptFeedback?.blockReason;

		throw new Error(`Gemini returned no answer${reason ? ` (${reason})` : ''}`);
	}

	if (candidate.finishReason === 'MAX_TOKENS') {
		throw new Error('Gemini output was cut off (increase maxOutputTokens)');
	}

	const text = (candidate.content?.parts ?? [])
		.filter((part: any) => !part.thought && typeof part.text === 'string')
		.map((part: any) => part.text)
		.join('');

	if (!text) throw new Error('Gemini returned an empty response');

	if (process.env.DEBUG_RESEARCH === 'true') {
		console.log(`[gemini] model=${model} finishReason=${candidate.finishReason}`);
		console.log('[gemini] raw:', text);
	}

	return text;
};
