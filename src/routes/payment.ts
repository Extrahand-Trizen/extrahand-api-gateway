import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Payment routes (with auth middleware)
router.post('/create-order', authMiddleware, paymentController.createOrder.bind(paymentController));
router.post('/verify-payment', authMiddleware, paymentController.verifyPayment.bind(paymentController));
router.get('/order-status/:orderId', authMiddleware, paymentController.getOrderStatus.bind(paymentController));
router.post('/refund', authMiddleware, paymentController.processRefund.bind(paymentController));
router.post('/cancel', authMiddleware, paymentController.cancelPayment.bind(paymentController));

// Escrow routes
router.post('/escrow/create', authMiddleware, paymentController.createEscrow.bind(paymentController));
router.get('/escrow/status/:escrowId', authMiddleware, paymentController.getEscrowStatus.bind(paymentController));
router.get('/escrow/task/:taskId', authMiddleware, paymentController.getEscrowByTaskId.bind(paymentController));

// Fee routes
router.get('/fees/calculate', paymentController.calculateFees.bind(paymentController)); // Public endpoint
router.get('/fees/structure', paymentController.getFeeStructure.bind(paymentController)); // Public endpoint

// Earnings routes
router.get('/earnings/:userId', authMiddleware, paymentController.getUserEarnings.bind(paymentController));

// Transaction routes
router.get('/transactions/user/:userId', authMiddleware, paymentController.getUserTransactions.bind(paymentController));

// Bank account routes (tasker payouts)
router.post('/bank-accounts', authMiddleware, paymentController.upsertBankAccount.bind(paymentController));
router.get('/bank-accounts/me', authMiddleware, paymentController.getMyBankAccounts.bind(paymentController));
router.put('/bank-accounts/:bankAccountId/default', authMiddleware, paymentController.setDefaultBankAccount.bind(paymentController));
router.delete('/bank-accounts/:bankAccountId', authMiddleware, paymentController.deleteBankAccount.bind(paymentController));

// Non-escrow task completion payout route
router.post('/payout/task-completion', authMiddleware, paymentController.processTaskCompletionPayout.bind(paymentController));

export default router;




