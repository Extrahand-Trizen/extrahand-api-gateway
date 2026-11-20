import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { validateEnv } from '../config/env.js';
import logger from '../config/logger.js';

const router = Router();
const env = validateEnv();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const response = await axios({
      method: 'GET',
      url: `${env.USER_SERVICE_URL}/api/v1/support-tickets`,
      params: req.query,
      headers: {
        'x-service-auth': env.SERVICE_AUTH_TOKEN,
        'x-service-name': 'api-gateway',
        'x-user-id': uid,
      },
      timeout: 15000,
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    logger.error('Customer support ticket history proxy request failed', {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const response = await axios({
      method: 'POST',
      url: `${env.USER_SERVICE_URL}/api/v1/support-tickets`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN,
        'x-service-name': 'api-gateway',
        'x-user-id': uid,
      },
      timeout: 15000,
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    logger.error('Support ticket proxy request failed', {
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
});

export default router;
