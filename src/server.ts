import 'reflect-metadata';

import http from 'http';

import app from './app';
import { connectDB, sequelize } from './config/db.config';
import { env } from './config/dotenv.config';

const startServer = async (): Promise<void> => {
	try {
		// Connect to MySQL
		await connectDB();
		await sequelize.sync();
		console.log('✅ Database models synchronized');

		// Start HTTP server
		const server = http.createServer(app);

		server.listen(env.PORT, () => {
			console.log('-----------------------------------');
			console.log('🚀 AI Job Research API Started');
			console.log(`🌐 Server: http://localhost:${env.PORT}`);
			console.log(`📘 Swagger: http://localhost:${env.PORT}/api-docs`);
			console.log(`❤️ Health: http://localhost:${env.PORT}/health`);
			console.log('-----------------------------------');
		});
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
