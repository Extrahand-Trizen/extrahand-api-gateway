import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { bookingController } from '../controllers/BookingController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', bookingController.createBooking.bind(bookingController));
router.get('/mine', bookingController.listMyBookings.bind(bookingController));
router.get('/:orderId', bookingController.getBooking.bind(bookingController));
router.post('/:orderId/cancel', bookingController.cancelBooking.bind(bookingController));

export default router;
