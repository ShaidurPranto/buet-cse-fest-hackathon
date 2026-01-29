import express from 'express';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

router.get('/orders', orderController.getOrders);
router.post('/orders', orderController.createOrder);

export default router;
