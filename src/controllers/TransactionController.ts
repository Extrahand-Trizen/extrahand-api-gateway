import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class TransactionController {
  async getUserTransactions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit, offset, startDate, endDate, type, status, category, linkedUserIds } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getUserTransactions(
        userId,
        {
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
          type: type as string | undefined,
          status: status as string | undefined,
          category: category as 'earnings' | 'payments' | 'all' | undefined,
          linkedUserIds: linkedUserIds as string | undefined,
        },
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TransactionController.getUserTransactions');
    }
  }

  async getTransactionSummary(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getTransactionSummary(
        userId,
        startDate as string | undefined,
        endDate as string | undefined,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TransactionController.getTransactionSummary');
    }
  }
}

export const transactionController = new TransactionController();

