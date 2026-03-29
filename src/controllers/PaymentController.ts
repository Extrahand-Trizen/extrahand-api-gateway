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

  async calculateFees(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { amount, taskCategory } = req.query;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.calculateFees(
        Number(amount),
        typeof taskCategory === 'string' ? taskCategory : undefined
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.calculateFees');
    }
  }

  async createEscrow(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.createEscrow(
        req.body.taskId,
        req.body.applicationId,
        req.body.posterUid,
        req.body.performerUid,
        req.body.amount,
        req.body.currency || 'INR',
        req.body.autoReleaseAfterDays,
        req.body.metadata,
        req.user || null,
        req.body.taskCategory
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.createEscrow');
    }
  }

  async getEscrowStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { escrowId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getEscrowStatus(escrowId, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getEscrowStatus');
    }
  }

  async getEscrowByTaskId(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getEscrowByTaskId(taskId, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getEscrowByTaskId');
    }
  }

  async getUserEarnings(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const requestLinked =
        typeof req.query.linkedUserIds === 'string'
          ? req.query.linkedUserIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const autoLinked = [req.user?.uid, req.user?.profileId]
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim());
      const linkedUserIdsMerged = Array.from(new Set([...requestLinked, ...autoLinked])).join(',') || undefined;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getUserEarnings(userId, req.user || null, linkedUserIdsMerged);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getUserEarnings');
    }
  }

  async getPendingCancellationPenalties(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const requestLinked =
        typeof req.query.linkedUserIds === 'string'
          ? req.query.linkedUserIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const autoLinked = [req.user?.uid, req.user?.profileId]
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim());
      const linkedUserIdsMerged = Array.from(new Set([...requestLinked, ...autoLinked])).join(',') || undefined;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getPendingCancellationPenalties(
        userId,
        req.user || null,
        linkedUserIdsMerged
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getPendingCancellationPenalties');
    }
  }

  async getUserTransactions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const requestLinked =
        typeof req.query.linkedUserIds === 'string'
          ? req.query.linkedUserIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const autoLinked = [req.user?.uid, req.user?.profileId]
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim());
      const linkedUserIdsMerged = Array.from(new Set([...requestLinked, ...autoLinked])).join(',') || undefined;
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        type: req.query.type as string,
        status: req.query.status as string,
        category: req.query.category as any,
        linkedUserIds: linkedUserIdsMerged,
      };

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getUserTransactions(userId, options, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getUserTransactions');
    }
  }

  async getTransactionSummary(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      const requestLinked =
        typeof req.query.linkedUserIds === 'string'
          ? req.query.linkedUserIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const autoLinked = [req.user?.uid, req.user?.profileId]
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim());
      const linkedUserIdsMerged = Array.from(new Set([...requestLinked, ...autoLinked])).join(',') || undefined;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getTransactionSummary(
        userId,
        startDate as string | undefined,
        endDate as string | undefined,
        req.user || null,
        linkedUserIdsMerged
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getTransactionSummary');
    }
  }

  async upsertBankAccount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.upsertBankAccount(req.body, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.upsertBankAccount');
    }
  }

  async getMyBankAccounts(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getMyBankAccounts(req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.getMyBankAccounts');
    }
  }

  async deleteBankAccount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { bankAccountId } = req.params;
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.deleteBankAccount(bankAccountId, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.deleteBankAccount');
    }
  }

  async setDefaultBankAccount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { bankAccountId } = req.params;
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.setDefaultBankAccount(bankAccountId, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.setDefaultBankAccount');
    }
  }

  async processTaskCompletionPayout(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.processTaskCompletionPayout(req.body, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'PaymentController.processTaskCompletionPayout');
    }
  }
}

export const paymentController = new PaymentController();



