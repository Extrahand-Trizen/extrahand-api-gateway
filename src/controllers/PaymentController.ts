import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class PaymentController {
  async createOrder(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { amount, currency, metadata } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.createOrder(
        amount,
        currency || 'INR',
        metadata || {},
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.createOrder');
    }
  }

  async verifyPayment(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.verifyPayment');
    }
  }

  async getOrderStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getOrderStatus(
        orderId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getOrderStatus');
    }
  }

  async processRefund(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { paymentId, amount } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.processRefund(
        paymentId,
        amount,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.processRefund');
    }
  }

  async getFeeStructure(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getFeeStructure();
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getFeeStructure');
    }
  }
}

export const paymentController = new PaymentController();



