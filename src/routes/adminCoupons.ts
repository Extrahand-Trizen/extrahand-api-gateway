import { Router } from 'express';
import { couponAdminController } from '../controllers/CouponAdminController.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * Admin coupon management.
 * Protected by user JWT + service auth to coupon-service.
 * Portal should use an admin-capable account / service token deployment.
 */
const router = Router();

router.post('/', authMiddleware, couponAdminController.create.bind(couponAdminController));
router.get('/', authMiddleware, couponAdminController.list.bind(couponAdminController));
router.get('/:id', authMiddleware, couponAdminController.getById.bind(couponAdminController));
router.patch('/:id', authMiddleware, couponAdminController.update.bind(couponAdminController));
router.patch('/:id/status', authMiddleware, couponAdminController.setStatus.bind(couponAdminController));
router.delete('/:id', authMiddleware, couponAdminController.remove.bind(couponAdminController));

export default router;
