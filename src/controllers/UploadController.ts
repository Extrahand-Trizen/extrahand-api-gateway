import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../types/express.js';
import FormData from 'form-data';
import axios from 'axios';

export class UploadController {
  async uploadProfilePicture(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const file = (req as any).file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'user-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      // Create FormData to forward to User Service
      const formData = new FormData();
      formData.append('image', file.buffer, {
        filename: file.originalname || 'profile.jpg',
        contentType: file.mimetype,
      });

      // Forward to User Service
      const response = await userService.uploadProfilePicture(formData, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'UploadController.uploadProfilePicture');
    }
  }

  async deleteProfilePicture(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
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

      const response = await userService.deleteProfilePicture(req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'UploadController.deleteProfilePicture');
    }
  }

  async uploadTaskImage(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const file = (req as any).file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
        return;
      }

      const { taskId } = req.body;

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'old-backend');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      // Forward to Old Backend (Task Service doesn't have task-image endpoint yet)
      const oldBackendUrl = process.env.OLD_BACKEND_URL || 'http://localhost:4000';
      const formData = new FormData();
      formData.append('image', file.buffer, {
        filename: file.originalname || 'task.jpg',
        contentType: file.mimetype,
      });
      if (taskId) {
        formData.append('taskId', taskId);
      }

      const config = {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${req.user.token}`,
          'X-Service-Auth': process.env.SERVICE_AUTH_TOKEN || '',
          'X-User-Id': req.user.uid,
        },
      };

      const response = await axios.post(
        `${oldBackendUrl}/api/v1/uploads/task-image`,
        formData,
        config
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      handleServiceError(error, res, 'UploadController.uploadTaskImage');
    }
  }

  async healthCheck(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.json({
        success: true,
        service: 'api-gateway-uploads',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      handleServiceError(error, res, 'UploadController.healthCheck');
    }
  }
}

export const uploadController = new UploadController();

