import { env } from './dotenv.config';

export const ollamaConfig = {
	baseURL: env.OLLAMA_BASE_URL,
	model: env.OLLAMA_MODEL,
	generateEndpoint: `${env.OLLAMA_BASE_URL}/api/generate`,
	chatEndpoint: `${env.OLLAMA_BASE_URL}/api/chat`,
};
