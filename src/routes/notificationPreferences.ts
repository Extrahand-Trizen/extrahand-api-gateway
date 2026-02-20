/**
 * Notification Preferences - Proxy to user-service
 * The web app uses /api/v1/notification-preferences for email/task notification settings.
 * The email service checks user-service's notification-preferences before sending task emails.
 */
import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { validateEnv } from '../config/env.js';
import logger from '../config/logger.js';

const router = Router();
const env = validateEnv();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const response = await axios({
      method: 'GET',
      url: `${env.USER_SERVICE_URL}/api/v1/notification-preferences`,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN || '',
        'x-service-name': 'api-gateway',
        'x-user-id': userId,
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError<{ error?: string }>;
    logger.error('Notification preferences GET failed', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });
    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
});

router.put('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const response = await axios({
      method: 'PUT',
      url: `${env.USER_SERVICE_URL}/api/v1/notification-preferences`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN || '',
        'x-service-name': 'api-gateway',
        'x-user-id': userId,
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError<{ error?: string }>;
    logger.error('Notification preferences PUT failed', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });
    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
});

export default router;
