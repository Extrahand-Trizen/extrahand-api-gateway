import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verificationService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class VerificationController {
  async initiateAadhaarVerification(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Log request body for debugging
      console.log('🔍 [API Gateway] Received initiateAadhaarVerification request');
      console.log('🔍 [API Gateway] Request Body:', req.body);
      const { aadhaarNumber, consent } = req.body;
      console.log('🔍 [API Gateway] Extracted aadhaarNumber:', aadhaarNumber);
      console.log('🔍 [API Gateway] Extracted consent:', consent);

      if (!aadhaarNumber) {
        console.error('❌ [VerificationController] Missing aadhaarNumber in request body');
        console.error('❌ [VerificationController] Full body:', req.body);
        res.status(400).json({
          success: false,
          error: 'Aadhaar number is required',
          details: {
            receivedBody: req.body,
            bodyKeys: Object.keys(req.body || {}),
          },
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.initiateAadhaarVerification(
        aadhaarNumber,
        consent, // Pass consent to service
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.initiateAadhaarVerification');
    }
  }

  async verifyAadhaarOTP(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { refId, otp } = req.body;
      if (!refId || !otp) {
        res.status(400).json({
          success: false,
          error: 'Reference ID and OTP are required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.verifyAadhaarOTP(refId, otp, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.verifyAadhaarOTP');
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

      const { accountNumber, ifsc, accountHolderName } = req.body;
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
        req.user
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

