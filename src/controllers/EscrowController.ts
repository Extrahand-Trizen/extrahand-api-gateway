import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class EscrowController {
  async createEscrow(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const {
        taskId,
        applicationId,
        posterUid,
        performerUid,
        amount,
        taskAmount,
        currency,
        autoReleaseAfterDays,
        metadata,
        taskCategory,
      } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.createEscrow(
        taskId,
        applicationId,
        posterUid,
        performerUid,
        amount,
        currency || 'INR',
        autoReleaseAfterDays,
        metadata,
        req.user || null,
        taskCategory,
        taskAmount
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EscrowController.createEscrow');
    }
  }

  async getEscrowStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { escrowId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getEscrowStatus(
        escrowId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EscrowController.getEscrowStatus');
    }
  }

  async getEscrowByTaskId(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.getEscrowByTaskId(
        taskId,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EscrowController.getEscrowByTaskId');
    }
  }

  async releaseEscrow(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { escrowId } = req.params;
      const { releasedBy, metadata } = req.body;

      // Use authenticated user's UID if releasedBy not provided
      const releasedByUid = releasedBy || req.user?.uid;

      if (!releasedByUid) {
        res.status(400).json({
          success: false,
          error: 'releasedBy is required. User must be authenticated.',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'payment-service');

      const response = await paymentService.releaseEscrow(
        escrowId,
        releasedByUid,
        metadata,
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'EscrowController.releaseEscrow');
    }
  }
}

export const escrowController = new EscrowController();


