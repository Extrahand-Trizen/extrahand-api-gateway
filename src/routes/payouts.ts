import { Router } from 'express';
import { payoutController } from '../controllers/PayoutController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All payout routes require authentication
router.get('/status/:payoutId', authMiddleware, payoutController.getPayoutStatus.bind(payoutController));
router.get('/escrow/:escrowId', authMiddleware, payoutController.getPayoutsByEscrowId.bind(payoutController));

export default router;








