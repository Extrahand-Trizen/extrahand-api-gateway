import { Request, Response } from 'express';
import { userService } from '../services/userService.js';
import logger from '../config/logger.js';

export class AuthController {
  /**
   * POST /api/v1/auth/check-phone
   * Public endpoint - checks if phone number exists
   */
  static async checkPhone(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      
      if (!phone || typeof phone !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
        return;
      }

      logger.info('Checking phone existence', { phone });
      
      // Forward to User Service
      const response = await userService.checkPhone(phone);
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Error checking phone', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: 'Failed to check phone number',
        message: error.message
      });
    }
  }

  /**
   * POST /api/v1/auth/signup
   * Public endpoint - creates new user account
   */
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const signupData = req.body;
      
      logger.info('Processing signup request');
      
      // Forward to User Service
      const response = await userService.signup(signupData);
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Error during signup', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: 'Signup failed',
        message: error.message
      });
    }
  }

  /**
   * POST /api/v1/auth/login
   * Public endpoint - authenticates user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body;
      
      logger.info('Processing login request');
      
      // Forward to User Service
      const response = await userService.login(loginData);
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Error during login', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: error.message
      });
    }
  }

  /**
   * POST /api/v1/auth/password/reset
   * Public endpoint - generates password reset link
   */
  static async passwordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email, continueUrl } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      logger.info('Processing password reset request', { email });
      
      // Forward to User Service
      const response = await userService.passwordReset(email, continueUrl);
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Error during password reset', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
        message: error.message
      });
    }
  }

  static async sync(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      logger.info('🔄 [Gateway] Syncing user profile', {
        uid: user.uid,
      });

      // 🔥 Forward request to User Service WITH USER TOKEN
      const response = await userService.syncProfile(req.body, user);

      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('❌ [Gateway] Profile sync failed', {
        error: error.message,
        service: error.service,
        data: error.data,
      });

      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Profile sync failed',
        data: error.data,
      });
    }
  }
}

