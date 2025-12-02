import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';

const router = Router();

// POST /api/v1/auth/check-phone (PUBLIC - no auth required)
router.post('/check-phone', authController.checkPhone.bind(authController));

// POST /api/v1/auth/signup (PUBLIC - no auth required)
router.post('/signup', authController.signup.bind(authController));

// POST /api/v1/auth/login (PUBLIC - no auth required)
router.post('/login', authController.login.bind(authController));

// POST /api/v1/auth/password/reset (PUBLIC - no auth required)
router.post('/password/reset', authController.passwordReset.bind(authController));

export default router;

