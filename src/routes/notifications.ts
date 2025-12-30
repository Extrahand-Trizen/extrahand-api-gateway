import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notificationController } from '../controllers/NotificationController';

const router = Router();

router.post('/token', authMiddleware, notificationController.registerToken.bind(notificationController));
router.delete('/token', authMiddleware, notificationController.removeToken.bind(notificationController));
router.get('/preferences', authMiddleware, notificationController.getPreferences.bind(notificationController));
router.put('/preferences', authMiddleware, notificationController.updatePreferences.bind(notificationController));

export default router;



























