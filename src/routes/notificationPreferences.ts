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

function ensureServiceAuth(req: Request, res: Response): boolean {
  const providedToken = (req.headers['x-service-auth'] as string) || '';
  const expectedToken = env.SERVICE_AUTH_TOKEN || '';

  if (!providedToken) {
    res.status(401).json({
      success: false,
      error: 'Service authentication required',
    });
    return false;
  }

  if (!expectedToken || providedToken !== expectedToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid service authentication token',
    });
    return false;
  }

  return true;
}

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    logger.info('Notification preferences GET requested', {
      uid: userId,
    });

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

    logger.info('Notification preferences GET response', {
      uid: userId,
      status: response.status,
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

    logger.info('Notification preferences PUT requested', {
      uid: userId,
      bodyKeys: Object.keys(req.body || {}),
    });

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

    logger.info('Notification preferences PUT response', {
      uid: userId,
      status: response.status,
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

// Service-to-service proxy: check if a notification can be sent
router.get('/:uid/can-send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!ensureServiceAuth(req, res)) {
      return;
    }

    const { uid } = req.params;
    const { channel, category } = req.query;

    if (!uid || !channel || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: uid, channel, category',
      });
    }

    const callerServiceName = (req.headers['x-service-name'] as string) || 'api-gateway';

    const response = await axios({
      method: 'GET',
      url: `${env.USER_SERVICE_URL}/api/v1/notification-preferences/${encodeURIComponent(uid)}/can-send`,
      params: {
        channel,
        category,
      },
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN || '',
        'x-service-name': callerServiceName,
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError<{ error?: string }>;
    logger.error('Notification preferences can-send proxy failed', {
      uid: req.params.uid,
      channel: req.query.channel,
      category: req.query.category,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });

    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
});

// Service-to-service proxy: batch check notification permissions
router.post('/can-send-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!ensureServiceAuth(req, res)) {
      return;
    }

    const { uids, channel, category } = req.body || {};
    if (!Array.isArray(uids) || !channel || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: uids (array), channel, category',
      });
    }

    const callerServiceName = (req.headers['x-service-name'] as string) || 'api-gateway';

    const response = await axios({
      method: 'POST',
      url: `${env.USER_SERVICE_URL}/api/v1/notification-preferences/can-send-batch`,
      data: { uids, channel, category },
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN || '',
        'x-service-name': callerServiceName,
      },
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError<{ error?: string }>;
    logger.error('Notification preferences can-send-batch proxy failed', {
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
