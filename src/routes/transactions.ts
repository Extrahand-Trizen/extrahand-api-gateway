import { Router } from 'express';
import { transactionController } from '../controllers/TransactionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All transaction routes require authentication
router.get('/:userId', authMiddleware, transactionController.getUserTransactions.bind(transactionController));
router.get('/:userId/summary', authMiddleware, transactionController.getTransactionSummary.bind(transactionController));
router.get('/:userId/wallet', authMiddleware, transactionController.getExtraCoinsWallet.bind(transactionController));

export default router;






