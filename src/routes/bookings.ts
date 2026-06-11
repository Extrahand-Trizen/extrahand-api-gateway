import { Router } from 'express';
import { bookingController } from '../controllers/BookingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, bookingController.createBooking.bind(bookingController));
router.get('/mine', authMiddleware, bookingController.listMyBookings.bind(bookingController));
router.get(
  '/by-task/:taskId',
  authMiddleware,
  bookingController.getBookingOrderIdForTask.bind(bookingController),
);
router.get('/:orderId', authMiddleware, bookingController.getBooking.bind(bookingController));
router.post(
  '/:orderId/cancel-item',
  authMiddleware,
  bookingController.cancelBookingItem.bind(bookingController),
);
router.post(
  '/:orderId/cancel',
  authMiddleware,
  bookingController.cancelBooking.bind(bookingController),
);

export default router;
