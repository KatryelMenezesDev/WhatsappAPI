import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { errors } from 'celebrate';
import instanceRoutes from './routes/instanceRoutes';
import messageRoutes from './routes/messageRoutes';
import { authenticate } from './middlewares/authenticate';
import { errorHandler } from './middlewares/errorHandler';
import { errorMiddleware } from './middlewares/errorMiddleware';
dotenv.config();
const app = express();

// Middleware de logging
app.use(morgan('dev'));

// Middleware para parsear JSON
app.use(express.json());

// Documentação Swagger
const swaggerDocument = yaml.load(path.resolve(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware de autenticação
app.use(authenticate);

// Rotas
app.use('/instances', instanceRoutes);
app.use('/messages', messageRoutes);

// Middleware para lidar com erros de validação
app.use(errorMiddleware);
app.use(errors());

// Middleware para lidar com erros gerais
app.use(errorHandler);

export default app;
