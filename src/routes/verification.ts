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

// Email verification (OTP flow)
router.post('/email/initiate', authMiddleware, verificationController.initiateEmail.bind(verificationController));
router.post('/email/verify', authMiddleware, verificationController.verifyEmail.bind(verificationController));
router.post('/email/resend', authMiddleware, verificationController.resendEmailOtp.bind(verificationController));
router.get('/email/status/:userId?', authMiddleware, verificationController.getEmailStatus.bind(verificationController));

// Get verification status
router.get('/status/:userId?', authMiddleware, verificationController.getVerificationStatus.bind(verificationController));

export default router;

