import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

// POST /api/v1/auth/check-phone (PUBLIC - no auth required)
router.post('/check-phone', AuthController.checkPhone.bind(AuthController));

// POST /api/v1/auth/signup (PUBLIC - no auth required)
router.post('/signup', AuthController.signup.bind(AuthController));

// POST /api/v1/auth/login (PUBLIC - no auth required)
router.post('/login', AuthController.login.bind(AuthController));

// POST /api/v1/auth/password/reset (PUBLIC - no auth required)
router.post('/password/reset', AuthController.passwordReset.bind(AuthController));

export default router;

