import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verificationService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class VerificationController {
  async initiateDigilockerVerification(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { mobileNumber, aadhaarNumber, consentGiven } = req.body;

      if (!mobileNumber && !aadhaarNumber) {
        res.status(400).json({
          success: false,
          error: 'Either mobile number or Aadhaar number is required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.initiateDigilockerVerification(
        { mobileNumber, aadhaarNumber, consentGiven },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.initiateDigilockerVerification');
    }
  }

  async getDigilockerStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const verificationId = req.query.verification_id as string;
      if (!verificationId) {
        res.status(400).json({
          success: false,
          error: 'verification_id query parameter is required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.getDigilockerStatus(verificationId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.getDigilockerStatus');
    }
  }

  async completeDigilockerVerification(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { verification_id: verificationId } = req.body;
      if (!verificationId) {
        res.status(400).json({
          success: false,
          error: 'verification_id is required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.completeDigilockerVerification(verificationId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.completeDigilockerVerification');
    }
  }

  async verifyPAN(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { panNumber } = req.body;
      if (!panNumber) {
        res.status(400).json({
          success: false,
          error: 'PAN number is required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.verifyPAN(panNumber, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.verifyPAN');
    }
  }

  async verifyBankAccount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { accountNumber, ifsc, accountHolderName, consent } = req.body;
      if (!accountNumber || !ifsc || !accountHolderName) {
        res.status(400).json({
          success: false,
          error: 'Account number, IFSC, and account holder name are required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.verifyBankAccount(
        accountNumber,
        ifsc,
        accountHolderName,
        req.user,
        consent // ✨ Forward consent to verification service
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.verifyBankAccount');
    }
  }

  async getVerificationStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const userId = req.params.userId || req.user.uid;
      const response = await verificationService.getVerificationStatus(userId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.getVerificationStatus');
    }
  }
}

export const verificationController = new VerificationController();

