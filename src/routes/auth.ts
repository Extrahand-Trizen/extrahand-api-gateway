import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authMiddleware } from "../middleware/auth.js";
const router = Router();

// POST /api/v1/auth/check-phone (PUBLIC - no auth required)
router.post("/check-phone", AuthController.checkPhone.bind(AuthController));

// POST /api/v1/auth/signup (PUBLIC - no auth required)
// REDUNDANT: OTP flow handles signup via /otp/complete
// router.post("/signup", AuthController.signup.bind(AuthController));

// POST /api/v1/auth/login (PUBLIC - no auth required)
// REDUNDANT: OTP flow handles login via /otp/complete
// router.post("/login", AuthController.login.bind(AuthController));

// POST /api/v1/auth/password/reset (PUBLIC - no auth required)
// REDUNDANT: App uses phone OTP, not password-based auth
// router.post(
//    "/password/reset",
//    AuthController.passwordReset.bind(AuthController)
// );

// ============================================================================

// POST /api/v1/auth/otp/complete (PUBLIC - no auth required, but requires valid ID token in body)
router.post("/otp/complete", AuthController.completeOTP.bind(AuthController));

// POST /api/v1/auth/otp/complete-dev (DEV only - test phone + OTP)
router.post("/otp/complete-dev", AuthController.completeOTPDev.bind(AuthController));

router.post("/alternate-login/send-otp", AuthController.sendAlternateLoginOtp.bind(AuthController));
router.post("/alternate-login/verify", AuthController.verifyAlternateLoginOtp.bind(AuthController));
router.post("/alternate-login/verify-firebase", AuthController.completeAlternateLoginFirebase.bind(AuthController));
router.post("/session/restore-firebase", AuthController.restoreFirebaseSession.bind(AuthController));

// POST /api/v1/auth/sync (AUTHENTICATED)
router.post("/sync", authMiddleware, AuthController.sync.bind(AuthController));

export default router;
