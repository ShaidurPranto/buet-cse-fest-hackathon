import express from 'express';
import inventoryRoutes from './routes/inventoryRoutes.js';

const app = express();

app.use(express.json());
app.use('/api', inventoryRoutes);

export default app;
