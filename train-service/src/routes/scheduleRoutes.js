import express from 'express';
import { searchSchedules } from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/schedules', searchSchedules);

export default router;
