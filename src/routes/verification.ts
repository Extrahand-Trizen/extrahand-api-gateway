import { Router, Request } from 'express';
import multer from 'multer';
import { verificationController } from '../controllers/VerificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const ocrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype?.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Aadhaar verification (DigiLocker - OTP flow removed)
router.post('/aadhaar/digilocker/initiate', authMiddleware, verificationController.initiateDigilockerVerification.bind(verificationController));
router.get('/aadhaar/digilocker/status', authMiddleware, verificationController.getDigilockerStatus.bind(verificationController));
router.post('/aadhaar/digilocker/complete', authMiddleware, verificationController.completeDigilockerVerification.bind(verificationController));

// Aadhaar Smart OCR (feature-flagged on verification-service)
router.post('/aadhaar/ocr/initiate', authMiddleware, verificationController.initiateAadhaarOcr.bind(verificationController));
router.post('/aadhaar/ocr/front', authMiddleware, ocrUpload.single('file'), verificationController.uploadAadhaarOcrFront.bind(verificationController));
router.post('/aadhaar/ocr/back', authMiddleware, ocrUpload.single('file'), verificationController.uploadAadhaarOcrBack.bind(verificationController));
router.get('/aadhaar/ocr/status', authMiddleware, verificationController.getAadhaarOcrStatus.bind(verificationController));
router.post('/aadhaar/ocr/cancel', authMiddleware, verificationController.cancelAadhaarOcr.bind(verificationController));

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

