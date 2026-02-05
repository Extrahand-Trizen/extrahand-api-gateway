import { Router } from 'express';
import { verificationController } from '../controllers/VerificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Aadhaar verification (DigiLocker - OTP flow removed)
router.post('/aadhaar/digilocker/initiate', authMiddleware, verificationController.initiateDigilockerVerification.bind(verificationController));
router.get('/aadhaar/digilocker/status', authMiddleware, verificationController.getDigilockerStatus.bind(verificationController));
router.post('/aadhaar/digilocker/complete', authMiddleware, verificationController.completeDigilockerVerification.bind(verificationController));

// Verify PAN
router.post('/pan/verify', authMiddleware, verificationController.verifyPAN.bind(verificationController));

// Verify Bank Account
router.post('/bank/verify', authMiddleware, verificationController.verifyBankAccount.bind(verificationController));

// Get verification status
router.get('/status/:userId?', authMiddleware, verificationController.getVerificationStatus.bind(verificationController));

// ============ Email Verification ============

// Initiate email verification (send OTP)
router.post('/email/initiate', authMiddleware, verificationController.initiateEmailVerification.bind(verificationController));

// Verify email OTP
router.post('/email/verify', authMiddleware, verificationController.verifyEmailOTP.bind(verificationController));

// Resend email OTP
router.post('/email/resend', authMiddleware, verificationController.resendEmailOTP.bind(verificationController));

// Get email verification status
router.get('/email/status/:userId?', authMiddleware, verificationController.getEmailVerificationStatus.bind(verificationController));

export default router;

