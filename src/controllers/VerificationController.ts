import { Request, Response, NextFunction } from 'express';
import FormData from 'form-data';
import { verificationService } from '../services/verificationService.js';
import { userService } from '../services/userService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { isReviewBypassUser } from '../utils/reviewBypass.js';
import logger from '../config/logger.js';

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

      const { mobileNumber, aadhaarNumber, consentGiven, redirectUrl } = req.body;

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

      let profilePhone: string | undefined;
      try {
        const profileRes = await userService.getCurrentProfile(req.user);
        const profile = profileRes.data?.data ?? null;
        profilePhone =
          (profile?.phone && String(profile.phone)) ||
          (profile?.phoneNumber && String(profile.phoneNumber)) ||
          undefined;
        if (
          profile?.reviewBypassActive === true ||
          isReviewBypassUser(req.user.uid, profilePhone)
        ) {
          logger.info('DigiLocker initiate skipped for review/demo account', {
            uid: req.user.uid,
          });
          res.status(200).json({
            success: true,
            alreadyVerified: true,
            message: 'Aadhaar verification is not required for this demo account.',
          });
          return;
        }
      } catch (profileErr) {
        if (isReviewBypassUser(req.user.uid, undefined)) {
          res.status(200).json({
            success: true,
            alreadyVerified: true,
            message: 'Aadhaar verification is not required for this demo account.',
          });
          return;
        }
        logger.warn('Could not load profile for DigiLocker bypass check; continuing', {
          uid: req.user.uid,
          error: profileErr instanceof Error ? profileErr.message : String(profileErr),
        });
      }

      const response = await verificationService.initiateDigilockerVerification(
        { mobileNumber, aadhaarNumber, consentGiven, redirectUrl },
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

  async initiateAadhaarOcr(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { consentGiven } = req.body;
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      const response = await verificationService.initiateAadhaarOcr({ consentGiven }, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.initiateAadhaarOcr');
    }
  }

  async uploadAadhaarOcrFront(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.proxyAadhaarOcrUpload(req, res, 'front');
  }

  async uploadAadhaarOcrBack(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.proxyAadhaarOcrUpload(req, res, 'back');
  }

  private async proxyAadhaarOcrUpload(
    req: Request,
    res: Response,
    side: 'front' | 'back'
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const file = (req as Request & { file?: Express.Multer.File }).file;
      const verificationId =
        (req.body.verification_id as string) || (req.body.verificationId as string);
      if (!file || !verificationId) {
        res.status(400).json({
          success: false,
          error: 'file and verification_id are required',
        });
        return;
      }
      const formData = new FormData();
      formData.append('verification_id', verificationId);
      formData.append('file', file.buffer, {
        filename: file.originalname || `aadhaar-${side}.jpg`,
        contentType: file.mimetype,
      });
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      const response = await verificationService.uploadAadhaarOcrSide(side, formData, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, `VerificationController.uploadAadhaarOcr${side}`);
    }
  }

  async getAadhaarOcrStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const verificationId = req.query.verification_id as string | undefined;
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      const response = await verificationService.getAadhaarOcrStatus(verificationId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.getAadhaarOcrStatus');
    }
  }

  async cancelAadhaarOcr(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const verificationId =
        (req.body.verification_id as string) || (req.body.verificationId as string);
      if (!verificationId) {
        res.status(400).json({ success: false, error: 'verification_id is required' });
        return;
      }
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      const response = await verificationService.cancelAadhaarOcr(verificationId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.cancelAadhaarOcr');
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

  // ============ Email Verification ============

  async initiateEmailVerification(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { email, consentGiven } = req.body;
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      logger.info('Email verification initiated', {
        uid: req.user.uid,
        email,
        consentGiven: !!consentGiven,
      });

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.initiateEmailVerification(email, consentGiven, req.user);
      logger.info('Email verification initiate response', {
        uid: req.user.uid,
        status: response.status,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.initiateEmailVerification');
    }
  }

  async verifyEmailOTP(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { otp, verificationId } = req.body;
      if (!otp) {
        res.status(400).json({
          success: false,
          error: 'OTP is required',
        });
        return;
      }

      logger.info('Email OTP verification requested', {
        uid: req.user.uid,
        hasOtp: !!otp,
        verificationId,
      });

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.verifyEmailOTP(otp, verificationId, req.user);
      logger.info('Email OTP verification response', {
        uid: req.user.uid,
        status: response.status,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.verifyEmailOTP');
    }
  }

  async resendEmailOTP(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      logger.info('Email OTP resend requested', {
        uid: req.user.uid,
      });

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await verificationService.resendEmailOTP(req.user);
      logger.info('Email OTP resend response', {
        uid: req.user.uid,
        status: response.status,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.resendEmailOTP');
    }
  }

  async getEmailVerificationStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'verification-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const userId = req.params.userId || req.user.uid;
      logger.info('Email verification status requested', {
        uid: req.user.uid,
        targetUserId: userId,
      });
      const response = await verificationService.getEmailVerificationStatus(userId, req.user);
      logger.info('Email verification status response', {
        uid: req.user.uid,
        status: response.status,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'VerificationController.getEmailVerificationStatus');
    }
  }
}

export const verificationController = new VerificationController();

