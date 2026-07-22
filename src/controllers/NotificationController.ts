import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { handleServiceError } from '../utils/errorHandler.js';

const notificationService = new NotificationService();

export class NotificationController {
  async registerToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { token, platform, deviceId } = req.body;
      
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const userToken = { uid: req.user.uid, token: req.user.token };

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
      
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const userToken = { uid: req.user.uid, token: req.user.token };

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
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const userToken = { uid: req.user.uid, token: req.user.token };

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
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const userToken = { uid: req.user.uid, token: req.user.token };

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

  /**
   * In-app notifications (polling)
   */

  async getInAppNotifications(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userToken = { uid: req.user.uid, token: req.user.token };
      const { limit, skip, unreadOnly } = req.query;

      const response = await notificationService.getInAppNotifications(userToken, {
        limit: limit ? Number(limit) : undefined,
        skip: skip ? Number(skip) : undefined,
        unreadOnly: unreadOnly === 'true',
      });

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.getInAppNotifications');
    }
  }

  async getUnreadInAppCount(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userToken = { uid: req.user.uid, token: req.user.token };

      const response = await notificationService.getUnreadInAppCount(userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.getUnreadInAppCount');
    }
  }

  async markAllInAppRead(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const uid = req.user.uid != null && String(req.user.uid).trim() !== '' ? req.user.uid : undefined;
      if (!uid) {
        res.status(400).json({ success: false, error: 'User ID is required (missing from token)' });
        return;
      }

      const userToken = { uid, token: req.user.token };

      const response = await notificationService.markAllInAppRead(userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.markAllInAppRead');
    }
  }

  async markInAppRead(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        res.status(400).json({ error: 'Notification ID is required' });
        return;
      }

      const userToken = { uid: req.user.uid, token: req.user.token };

      const response = await notificationService.markInAppRead(notificationId, userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.markInAppRead');
    }
  }

  async deleteInAppNotification(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        res.status(400).json({ error: 'Notification ID is required' });
        return;
      }

      const userToken = { uid: req.user.uid, token: req.user.token };

      const response = await notificationService.deleteInAppNotification(notificationId, userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.deleteInAppNotification');
    }
  }

  async clearAllInAppNotifications(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userToken = { uid: req.user.uid, token: req.user.token };

      const response = await notificationService.clearAllInAppNotifications(userToken);

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'notification-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'NotificationController.clearAllInAppNotifications');
    }
  }
}

export const notificationController = new NotificationController();



























