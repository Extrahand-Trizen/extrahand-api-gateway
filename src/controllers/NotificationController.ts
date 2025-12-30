import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';
import { handleServiceError } from '../utils/errorHandler';

const notificationService = new NotificationService();

export class NotificationController {
  async registerToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { token, platform, deviceId } = req.body;
      const userToken = req.user ? { uid: req.user.uid, token: req.user.token } : null;

      const response = await notificationService.registerToken(
        token,
        platform,
        deviceId,
        userToken
      );

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.registerToken');
    }
  }

  async removeToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const userToken = req.user ? { uid: req.user.uid, token: req.user.token } : null;

      const response = await notificationService.removeToken(token, userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.removeToken');
    }
  }

  async getPreferences(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userToken = req.user ? { uid: req.user.uid, token: req.user.token } : null;

      const response = await notificationService.getPreferences(userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.getPreferences');
    }
  }

  async updatePreferences(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const userToken = req.user ? { uid: req.user.uid, token: req.user.token } : null;

      const response = await notificationService.updatePreferences(
        req.body,
        userToken
      );

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.updatePreferences');
    }
  }
}

export const notificationController = new NotificationController();



























