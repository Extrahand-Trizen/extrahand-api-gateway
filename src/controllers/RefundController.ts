import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class RefundController {
  async processRefund(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const {
        razorpayOrderId,
        razorpayPaymentId,
        reason,
        cancelledBy,
        taskStartDate,
        cancelledAt,
        userId,
        amount,
      } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.processRefundWithCancellation(
        razorpayOrderId,
        razorpayPaymentId,
        reason,
        cancelledBy,
        taskStartDate,
        cancelledAt,
        userId,
        amount,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'RefundController.processRefund');
    }
  }

  async getRefundStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { refundId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getRefundStatus(
        refundId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'RefundController.getRefundStatus');
    }
  }

  async getRefundsByEscrowId(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { escrowId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getRefundsByEscrowId(
        escrowId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'RefundController.getRefundsByEscrowId');
    }
  }
}

export const refundController = new RefundController();








