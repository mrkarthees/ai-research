import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerDocument from './swagger/swagger.json';
import { RegisterRoutes } from './routes-tsoa/routes';

import { env } from './config/dotenv.config';

const app = express();

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = env.ALLOWED_ORIGINS.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin: env.ALLOW_ALL_ORIGINS ? true : allowedOrigins,
		credentials: true,
	}),
);

// Health check
app.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'AI Job Research API is running',
		environment: env.NODE_ENV,
	});
});

// TSOA generated routes
RegisterRoutes(app);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
