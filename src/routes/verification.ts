import { Router } from 'express';
import { verificationController } from '../controllers/VerificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Initiate Aadhaar verification
router.post('/aadhaar/initiate', authMiddleware, verificationController.initiateAadhaarVerification.bind(verificationController));

// Verify Aadhaar OTP
router.post('/aadhaar/verify', authMiddleware, verificationController.verifyAadhaarOTP.bind(verificationController));

// Verify PAN
router.post('/pan/verify', authMiddleware, verificationController.verifyPAN.bind(verificationController));

// Verify Bank Account
router.post('/bank/verify', authMiddleware, verificationController.verifyBankAccount.bind(verificationController));

// Get verification status
router.get('/status/:userId?', authMiddleware, verificationController.getVerificationStatus.bind(verificationController));

export default router;

