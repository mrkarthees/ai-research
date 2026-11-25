import dotenv from 'dotenv';

dotenv.config();

export const env = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: Number(process.env.PORT) || 4000,

	DB_HOST: process.env.DB_HOST!,
	DB_PORT: Number(process.env.DB_PORT || 3306),
	DB_NAME: process.env.DB_NAME!,
	DB_USER: process.env.DB_USER!,
	DB_PASSWORD: process.env.DB_PASSWORD!,
	DB_SSL: process.env.DB_SSL === 'true',

	// CORS configuration
	ALLOW_ALL_ORIGINS: process.env.ALLOW_ALL_ORIGINS === 'true',

	ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? '',
};
