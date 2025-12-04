import { Router } from 'express';
import { reviewController } from '../controllers/ReviewController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/reviews/user/:userId - Get reviews for a user (PUBLIC - no auth required)
router.get('/user/:userId', reviewController.getUserReviews.bind(reviewController));

// POST /api/v1/reviews - Create a review (requires auth)
router.post('/', authMiddleware, reviewController.createReview.bind(reviewController));

// GET /api/v1/reviews/task/:taskId - Get review for a task (requires auth)
router.get('/task/:taskId', authMiddleware, reviewController.getTaskReview.bind(reviewController));

export default router;


