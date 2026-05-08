import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { validateEnv } from '../config/env.js';
import logger from '../config/logger.js';

const router = Router();
const env = validateEnv();

// POST /api/v1/inquiries - proxy to user-service
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = (req as any).user?.uid;
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const response = await axios({
      method: 'POST',
      url: `${env.USER_SERVICE_URL}/api/v1/inquiries`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN || '',
        'x-service-name': 'api-gateway',
        'x-user-id': uid,
      },
      timeout: 15000,
    });

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    logger.error('Inquiry proxy request failed', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message,
    });
    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
});

export default router;
