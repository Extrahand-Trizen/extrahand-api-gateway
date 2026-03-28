import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class EarningsController {
  async getPendingCancellationPenalties(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getPendingCancellationPenalties(userId, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EarningsController.getPendingCancellationPenalties');
    }
  }

  async getUserEarnings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getUserEarnings(
        userId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EarningsController.getUserEarnings');
    }
  }

  async getEarningsByPeriod(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getEarningsByPeriod(
        userId,
        startDate as string | undefined,
        endDate as string | undefined,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EarningsController.getEarningsByPeriod');
    }
  }

  async getEarningsStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getEarningsStats(
        userId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EarningsController.getEarningsStats');
    }
  }
}

export const earningsController = new EarningsController();






