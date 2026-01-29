import express from 'express';
import cors from 'cors';
import inventoryRoutes from './routes/inventoryRoutes.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', inventoryRoutes);

export default app;
