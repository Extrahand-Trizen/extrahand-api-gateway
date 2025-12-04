import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { Profile } from '../types/api.js';

export class ProfileController {
  async getProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.uid;
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getProfile(userId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getProfile');
    }
  }

  async getCurrentProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      console.log('🔍 [ProfileController.getCurrentProfile] Route matched - GET /api/v1/profiles/me', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        hasUser: !!req.user,
        uid: req.user?.uid
      });

      if (!req.user) {
        console.error('❌ [ProfileController.getCurrentProfile] No user in request');
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✨ Enhanced logging
      console.log('🔍 [ProfileController.getCurrentProfile] Starting request:', {
        uid: req.user.uid,
        tokenType: typeof req.user.token,
        tokenLength: typeof req.user.token === 'string' ? req.user.token.length : 'N/A',
        hasToken: !!req.user.token,
      });

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      console.log('🔍 [ProfileController.getCurrentProfile] Calling userService.getCurrentProfile...');
      const startTime = Date.now();
      
      const response = await userService.getCurrentProfile(req.user);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [ProfileController.getCurrentProfile] User Service responded in ${duration}ms:`, {
        status: response.status,
        hasData: !!response.data,
      });
      
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('❌ [ProfileController.getCurrentProfile] Error:', error);
      handleServiceError(error, res, 'ProfileController.getCurrentProfile');
    }
  }

  async updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const profileData: Partial<Profile> = req.body;
      
      // Log the request data for debugging
      console.log('🔍 [ProfileController.updateProfile] Request data:', {
        userId: userId || 'current user',
        uid: req.user.uid,
        hasSavedAddresses: !!profileData.savedAddresses,
        savedAddressesCount: Array.isArray(profileData.savedAddresses) ? profileData.savedAddresses.length : 0,
        savedAddressesPreview: Array.isArray(profileData.savedAddresses) && profileData.savedAddresses.length > 0
          ? {
              firstAddress: {
                label: profileData.savedAddresses[0].label,
                addressLength: profileData.savedAddresses[0].address?.length || 0,
                hasCoordinates: Array.isArray(profileData.savedAddresses[0].coordinates),
                coordinates: profileData.savedAddresses[0].coordinates
              }
            }
          : null
      });
      
      // If userId is provided, update that user's profile
      // Otherwise, update current user's profile
      let response;
      if (userId) {
        response = await userService.updateProfile(userId, profileData, req.user);
      } else {
        response = await userService.updateCurrentProfile(profileData, req.user);
      }
      
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('❌ [ProfileController.updateProfile] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack?.substring(0, 500)
      });
      handleServiceError(error, res, 'ProfileController.updateProfile');
    }
  }

  async upsertProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
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
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const profileData: Partial<Profile> = req.body;
      const response = await userService.upsertProfile(profileData, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.upsertProfile');
    }
  }

  async searchProfiles(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { q, limit = '10' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.searchProfiles(
        q.trim(),
        parseInt(limit as string, 10),
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.searchProfiles');
    }
  }

  async deleteProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
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
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.deleteProfile(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.deleteProfile');
    }
  }
}

export const profileController = new ProfileController();

