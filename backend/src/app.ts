import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger/swagger.json';
import { RegisterRoutes } from './routes-tsoa/routes';
import { upload } from './middlewares/upload.middleware';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/dotenv.config';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(
	cors({
		origin: env.ALLOW_ALL_ORIGINS ? '*' : false,
	}),
);

RegisterRoutes(app);

app.use('/api/v1/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
	res.send('Hello World! Server is working 🚀');
});

app.use(errorHandler);

export default app;
