import { Sequelize } from 'sequelize-typescript';
import { env } from './dotenv.config';
import { Companies } from '../models/company.model';
import { Researches } from '../models/research.model';
import { ResearchSources } from '../models/research-source.model';
import { CompanyResearchResults } from '../models/company-research-result.model';
import { ResearchResultEvidences } from '../models/research-result-evidence.model';

export const sequelize = new Sequelize({
	database: env.DB_NAME,
	username: env.DB_USER,
	password: env.DB_PASSWORD,
	host: env.DB_HOST,
	dialect: 'mysql',
	models: [
		Companies,
		Researches,
		ResearchSources,
		CompanyResearchResults,
		ResearchResultEvidences,
	],
	logging: false,
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
