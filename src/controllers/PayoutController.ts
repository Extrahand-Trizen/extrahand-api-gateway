import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class PayoutController {
  async getPayoutStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { payoutId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getPayoutStatus(
        payoutId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PayoutController.getPayoutStatus');
    }
  }

  async getPayoutsByEscrowId(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { escrowId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getPayoutsByEscrowId(
        escrowId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PayoutController.getPayoutsByEscrowId');
    }
  }
}

export const payoutController = new PayoutController();








