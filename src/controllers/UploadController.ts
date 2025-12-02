import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import FormData from 'form-data';

export class UploadController {
  async uploadProfilePicture(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

  async deleteProfilePicture(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

  async uploadTaskImage(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      // Create FormData to forward to Task Service
      const formData = new FormData();
      formData.append('image', file.buffer, {
        filename: file.originalname || 'task.jpg',
        contentType: file.mimetype,
      });
      
      // Add taskId if provided
      const { taskId } = req.body;
      if (taskId) {
        formData.append('taskId', taskId);
      }

      // Forward to Task Service
      const response = await taskService.uploadTaskImage(formData, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
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


