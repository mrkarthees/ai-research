import 'reflect-metadata';
import dotenv from 'dotenv';
import http from 'http';

import app from './app';
import { sequelize } from './config/db.config';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
	try {
		await sequelize.sync();
		console.log('✅ Database synced');

		const server = http.createServer(app);

		server.listen(PORT, () => {
			console.log(`🚀 Server running at http://localhost:${PORT}`);
			console.log(`📘 Swagger at http://localhost:${PORT}/api-docs`);
		});
	} catch (err) {
		console.error('❌ Failed to start server', err);
		process.exit(1);
	}
};

startServer();
