import { Router } from 'express';
import { refundController } from '../controllers/RefundController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All refund routes require authentication
router.post('/process', authMiddleware, refundController.processRefund.bind(refundController));
router.get('/status/:refundId', authMiddleware, refundController.getRefundStatus.bind(refundController));
router.get('/escrow/:escrowId', authMiddleware, refundController.getRefundsByEscrowId.bind(refundController));

export default router;








