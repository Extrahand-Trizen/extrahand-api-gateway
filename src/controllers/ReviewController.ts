import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class ReviewController {
  async getServiceReviewSummary(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { categorySlug, catalogId } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await reviewService.getServiceReviewSummary({
        categorySlug: categorySlug as string | undefined,
        catalogId: catalogId as string | undefined,
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ReviewController.getServiceReviewSummary');
    }
  }

  async getServiceReviews(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { categorySlug, catalogId, packageId, rating, limit, skip } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await reviewService.getServiceReviews({
        categorySlug: categorySlug as string | undefined,
        catalogId: catalogId as string | undefined,
        packageId: packageId as string | undefined,
        rating: rating ? parseInt(rating as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ReviewController.getServiceReviews');
    }
  }

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

  async voteHelpful(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { helpful } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await reviewService.voteHelpful(id, helpful, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ReviewController.voteHelpful');
    }
  }
}

export const reviewController = new ReviewController();
