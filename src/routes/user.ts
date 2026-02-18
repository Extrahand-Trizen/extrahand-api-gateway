import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../config/logger.js';
import { validateEnv } from '../config/env.js';

const router = Router();
const env = validateEnv();

// Inline sendSuccess function for consistency
const sendSuccess = (res: Response, data: any, message: string, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res: Response, error: any, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: error?.message || error || 'Internal server error',
  });
};

// Get the user service URL from environment
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

/**
 * Utility function to proxy requests to user service
 */
const proxyToUserService = async (
  req: Request,
  _res: Response,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) => {
  try {
    const url = `${USER_SERVICE_URL}/api${path}`;
    const userId = (req as any).user?.uid;
    
    const config: any = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': env.SERVICE_AUTH_TOKEN,
        'x-service-name': 'api-gateway',
        'x-user-id': userId,
        'x-forwarded-for': req.ip,
      },
      withCredentials: true,
    };

    if (method !== 'GET' && req.body) {
      config.data = req.body;
    }

    if (method === 'GET' && Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    logger.debug(`🔄 Proxying ${method} ${url}`, { userId, hasServiceAuth: !!env.SERVICE_AUTH_TOKEN });
    
    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    const axiosError = error as AxiosError;
    logger.error(`❌ Proxy error to ${USER_SERVICE_URL}:`, {
      path,
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    throw axiosError;
  }
};

/**
 * GET /api/v1/user/badge
 * Get user's badge information
 */
router.get('/badge', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/badge', 'GET');
    sendSuccess(res, data.data || data, 'Badge information retrieved successfully');
  } catch (error) {
    logger.error('Error fetching badge info:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/badge/progress
 * Get badge progress details
 */
router.get('/badge/progress', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/badge/progress', 'GET');
    sendSuccess(res, data.data || data, 'Badge progress retrieved successfully');
  } catch (error) {
    logger.error('Error fetching badge progress:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/reputation-score
 * Get reputation score
 */
router.get('/reputation-score', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/reputation-score', 'GET');
    sendSuccess(res, data.data || data, 'Reputation score retrieved successfully');
  } catch (error) {
    logger.error('Error fetching reputation score:', error);
    sendError(res, error, 500);
  }
});

/**
 * POST /api/v1/user/badge/check-upgrade
 * Check and upgrade badge if eligible
 */
router.post('/badge/check-upgrade', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/badge/check-upgrade', 'POST');
    sendSuccess(res, data.data || data, 'Badge check completed');
  } catch (error) {
    logger.error('Error checking badge upgrade:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/badge/tier-config/:badgeLevel
 * Get badge tier configuration (public)
 */
router.get('/badge/tier-config/:badgeLevel', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { badgeLevel } = req.params;
    const data = await proxyToUserService(req, res, `/v1/user/badge/tier-config/${badgeLevel}`, 'GET');
    sendSuccess(res, data.data || data, 'Badge tier config retrieved successfully');
  } catch (error) {
    logger.error('Error fetching badge tier config:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/badge/public/:uid
 * Get public badge info for any user (public endpoint)
 */
router.get('/badge/public/:uid', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { uid } = req.params;
    const data = await proxyToUserService(req, res, `/v1/user/badge/public/${uid}`, 'GET');
    sendSuccess(res, data.data || data, 'Public badge info retrieved successfully');
  } catch (error) {
    logger.error('Error fetching public badge info:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/referral-code
 * Get user's referral code
 */
router.get('/referral-code', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral-code', 'GET');
    sendSuccess(res, data.data || data, 'Referral code retrieved successfully');
  } catch (error) {
    logger.error('Error fetching referral code:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/referral-dashboard
 * Get referral dashboard
 */
router.get('/referral-dashboard', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral-dashboard', 'GET');
    sendSuccess(res, data.data || data, 'Referral dashboard retrieved successfully');
  } catch (error) {
    logger.error('Error fetching referral dashboard:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/credits/balance
 * Get credit balance
 */
router.get('/credits/balance', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/credits/balance', 'GET');
    sendSuccess(res, data.data || data, 'Credit balance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching credit balance:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/credits/transactions
 * Get credit transactions
 */
router.get('/credits/transactions', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/credits/transactions', 'GET');
    sendSuccess(res, data.data || data, 'Credit transactions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching credit transactions:', error);
    sendError(res, error, 500);
  }
});

export default router;
