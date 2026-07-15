import { Router, Request } from 'express';
import multer from 'multer';
import { verificationController } from '../controllers/VerificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Single auth gate for all verification routes (avoid duplicate middleware at app mount)
router.use(authMiddleware);

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
router.post('/aadhaar/digilocker/initiate', verificationController.initiateDigilockerVerification.bind(verificationController));
router.get('/aadhaar/digilocker/status', verificationController.getDigilockerStatus.bind(verificationController));
router.post('/aadhaar/digilocker/complete', verificationController.completeDigilockerVerification.bind(verificationController));

// Aadhaar Smart OCR (feature-flagged on verification-service)
router.post('/aadhaar/ocr/initiate', verificationController.initiateAadhaarOcr.bind(verificationController));
router.post('/aadhaar/ocr/front', ocrUpload.single('file'), verificationController.uploadAadhaarOcrFront.bind(verificationController));
router.post('/aadhaar/ocr/back', ocrUpload.single('file'), verificationController.uploadAadhaarOcrBack.bind(verificationController));
router.get('/aadhaar/ocr/status', verificationController.getAadhaarOcrStatus.bind(verificationController));
router.post('/aadhaar/ocr/cancel', verificationController.cancelAadhaarOcr.bind(verificationController));
router.post(
  '/aadhaar/ocr/report-upload-failure',
  verificationController.reportAadhaarOcrUploadFailure.bind(verificationController)
);

// Verify PAN
router.post('/pan/verify', verificationController.verifyPAN.bind(verificationController));

// Verify Bank Account
router.post('/bank/verify', verificationController.verifyBankAccount.bind(verificationController));

// Get verification status
router.get('/status/:userId?', verificationController.getVerificationStatus.bind(verificationController));

// ============ Email Verification ============

// Initiate email verification (send OTP)
router.post('/email/initiate', verificationController.initiateEmailVerification.bind(verificationController));

// Verify email OTP
router.post('/email/verify', verificationController.verifyEmailOTP.bind(verificationController));

// Resend email OTP
router.post('/email/resend', verificationController.resendEmailOTP.bind(verificationController));

// Get email verification status
router.get('/email/status/:userId?', verificationController.getEmailVerificationStatus.bind(verificationController));

export default router;
