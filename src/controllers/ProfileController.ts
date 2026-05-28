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

      // Public profiles are accessible without authentication
      // req.user will be undefined for unauthenticated requests

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      // Check if userId is a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(userId);
      
      let response;
      if (isMongoId) {
        // Route to MongoDB ID endpoint (public profile)
        response = await userService.getPublicProfileById(userId, req.user);
      } else {
        // Route to Firebase UID endpoint  
        response = await userService.getProfile(userId, req.user);
      }
      
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

  async getProfileStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getProfileStats(userId);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getProfileStats');
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

  // Address Management Methods
  async getAddresses(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getAddresses(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getAddresses');
    }
  }

  async addAddress(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.addAddress(req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.addAddress');
    }
  }

  async updateAddress(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const addressId = req.params.addressId;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.updateAddress(addressId, req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.updateAddress');
    }
  }

  async deleteAddress(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const addressId = req.params.addressId;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.deleteAddress(addressId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.deleteAddress');
    }
  }

  async setDefaultAddress(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const addressId = req.params.addressId;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.setDefaultAddress(addressId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.setDefaultAddress');
    }
  }

  // Profile Stats Methods
  async getMyStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getMyStats(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getMyStats');
    }
  }

  async recalculateStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.recalculateStats(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.recalculateStats');
    }
  }

  async getCategoryAlerts(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getCategoryAlerts(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getCategoryAlerts');
    }
  }

  async updateCategoryAlerts(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const categories = Array.isArray(req.body?.categories) ? req.body.categories : [];
      const response = await userService.updateCategoryAlerts(categories, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.updateCategoryAlerts');
    }
  }

  async getKeywordAlerts(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getKeywordAlerts(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getKeywordAlerts');
    }
  }

  async updateKeywordAlerts(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const keywords = Array.isArray(req.body?.keywords) ? req.body.keywords : [];
      const response = await userService.updateKeywordAlerts(keywords, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.updateKeywordAlerts');
    }
  }
  async getPublicProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const uid = req.params.uid;
      if (!uid) {
        res.status(400).json({ success: false, error: 'User ID is required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      // Forward optional auth so user-service can check registered/connections rules
      const response = await userService.getPublicProfileByUid(uid, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getPublicProfile');
    }
  }

  async getPublicProfileByObjectId(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const profileId = req.params.profileId;
      if (!profileId) {
        res.status(400).json({ success: false, error: 'Profile ID is required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await userService.getPublicProfileById(profileId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.getPublicProfileByObjectId');
    }
  }

  async checkPhoneAvailability(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { phone } = req.body;
      if (!phone) {
        res.status(400).json({ success: false, error: 'Phone number is required' });
        return;
      }
      const response = await userService.checkPhoneAvailability(phone, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.checkPhoneAvailability');
    }
  }

  async changePhone(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { phone } = req.body;
      if (!phone) {
        res.status(400).json({ success: false, error: 'Phone number is required' });
        return;
      }
      const response = await userService.changePhone(phone, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ProfileController.changePhone');
    }
  }
}

export const profileController = new ProfileController();

