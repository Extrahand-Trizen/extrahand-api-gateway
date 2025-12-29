import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Payment routes (with auth middleware)
router.post('/create-order', authMiddleware, paymentController.createOrder.bind(paymentController));
router.post('/verify-payment', authMiddleware, paymentController.verifyPayment.bind(paymentController));
router.get('/order-status/:orderId', authMiddleware, paymentController.getOrderStatus.bind(paymentController));
router.post('/refund', authMiddleware, paymentController.processRefund.bind(paymentController));

export default router;



