import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { notificationController } from '../controllers/NotificationController.js';

const router = Router();

router.post('/token', authMiddleware, notificationController.registerToken.bind(notificationController));
router.delete('/token', authMiddleware, notificationController.removeToken.bind(notificationController));
router.get('/preferences', authMiddleware, notificationController.getPreferences.bind(notificationController));
router.put('/preferences', authMiddleware, notificationController.updatePreferences.bind(notificationController));

// In-app notifications (polling) - user-facing endpoints
router.get(
  '/in-app',
  authMiddleware,
  notificationController.getInAppNotifications.bind(notificationController)
);

router.get(
  '/in-app/unread-count',
  authMiddleware,
  notificationController.getUnreadInAppCount.bind(notificationController)
);

router.patch(
  '/in-app/mark-all-read',
  authMiddleware,
  notificationController.markAllInAppRead.bind(notificationController)
);

router.patch(
  '/in-app/:notificationId/read',
  authMiddleware,
  notificationController.markInAppRead.bind(notificationController)
);

router.delete(
  '/in-app',
  authMiddleware,
  notificationController.clearAllInAppNotifications.bind(notificationController)
);

router.delete(
  '/in-app/:notificationId',
  authMiddleware,
  notificationController.deleteInAppNotification.bind(notificationController)
);

export default router;



























