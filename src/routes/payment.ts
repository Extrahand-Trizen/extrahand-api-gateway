import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Publishable Razorpay Key ID (requires user JWT — for mobile when public app.get route is not deployed yet)
router.get('/razorpay-key', paymentController.getRazorpayKeyId.bind(paymentController));

// Payment routes (with auth middleware)
router.post('/create-order', authMiddleware, paymentController.createOrder.bind(paymentController));
router.post('/verify-payment', authMiddleware, paymentController.verifyPayment.bind(paymentController));
router.get('/order-status/:orderId', authMiddleware, paymentController.getOrderStatus.bind(paymentController));
router.post('/refund', authMiddleware, paymentController.processRefund.bind(paymentController));

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

export default router;




