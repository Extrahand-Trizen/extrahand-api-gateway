import { Router } from 'express';
import { earningsController } from '../controllers/EarningsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All earnings routes require authentication
router.get('/:userId', authMiddleware, earningsController.getUserEarnings.bind(earningsController));
router.get('/:userId/period', authMiddleware, earningsController.getEarningsByPeriod.bind(earningsController));
router.get('/:userId/stats', authMiddleware, earningsController.getEarningsStats.bind(earningsController));

export default router;






