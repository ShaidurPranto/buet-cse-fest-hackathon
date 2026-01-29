import express from 'express';
import scheduleRoutes from './routes/scheduleRoutes.js';

const app = express();

app.use(express.json());
app.use('/api', scheduleRoutes);

export default app;
