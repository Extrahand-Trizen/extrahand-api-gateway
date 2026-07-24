import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import axios from 'axios';
import { validateEnv } from '../config/env.js';
import logger from '../config/logger.js';

const router = Router();
const env = validateEnv();

// Forward all business requests to user service
router.all('*', authMiddleware, async (req, res, next) => {
  try {
    const userServiceUrl = env.USER_SERVICE_URL;
    const path = req.path;
    
    logger.info(`🔀 [Business Router] Forwarding ${req.method} /api/v1/business${path} to user service`);
    
    const response = await axios({
      method: req.method,
      url: `${userServiceUrl}/api/v1/business${path}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN,
        'x-service-name': 'api-gateway',
        'x-user-id': (req as any).user?.uid,
        'x-forwarded-for': req.ip,
      },
      params: req.query,
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error(`❌ [Business Router] Error forwarding request:`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

export default router;
