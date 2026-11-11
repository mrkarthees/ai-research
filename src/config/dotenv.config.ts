import dotenv from 'dotenv';

dotenv.config();

export const env = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: Number(process.env.PORT) || 4000,

	DB_HOST: process.env.DB_HOST ?? 'localhost',
	DB_USER: process.env.DB_USER ?? 'root',
	DB_PASSWORD: process.env.DB_PASSWORD ?? 'password',
	DB_NAME: process.env.DB_NAME ?? '',

	// CORS configuration
	ALLOW_ALL_ORIGINS: process.env.ALLOW_ALL_ORIGINS === 'true',
	ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',

	ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? '',

	// Ollama configuration
	OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
	OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
};
