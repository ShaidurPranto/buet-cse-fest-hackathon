import express from 'express';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', inventoryController.updateInventoryHandler);
router.post('/inventory/restock', inventoryController.addStock);

export default router;
