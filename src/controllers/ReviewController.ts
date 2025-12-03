import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class ReviewController {
  async getUserReviews(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit, skip, rating } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await reviewService.getUserReviews(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
        rating: rating ? parseInt(rating as string, 10) : undefined,
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ReviewController.getUserReviews');
    }
  }

  async createReview(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await reviewService.createReview(req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ReviewController.createReview');
    }
  }

  async getTaskReview(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { taskId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await reviewService.getTaskReview(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ReviewController.getTaskReview');
    }
  }
}

export const reviewController = new ReviewController();

