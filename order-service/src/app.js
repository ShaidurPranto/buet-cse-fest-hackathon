import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes.js';
import * as healthController from './controllers/healthController.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', healthController.getHealth);
app.use('/api', orderRoutes);

export default app;
