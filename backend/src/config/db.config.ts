import { Sequelize } from 'sequelize-typescript';
import { env } from './dotenv.config';

import { Users } from '../models/user.model';
import { ResearchResults } from '../models/researchResults.model';
import { Research } from '../models/research.model';

export const sequelize = new Sequelize({
	database: env.DB_NAME,
	username: env.DB_USER,
	password: env.DB_PASSWORD,
	host: env.DB_HOST,
	port: env.DB_PORT,
	dialect: 'mysql',

	// Enable TLS only when DB_SSL=true
	dialectOptions: env.DB_SSL
		? {
				ssl: {},
			}
		: {},

	models: [Users, Research, ResearchResults],
	logging: false,

	pool: {
		max: 5,
		min: 0,
		acquire: 60000,
		idle: 10000,
	},
});

export const connectDB = async (): Promise<void> => {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connected successfully');
	} catch (error) {
		console.error('❌ Unable to connect to database:', error);
		throw error;
	}
};
