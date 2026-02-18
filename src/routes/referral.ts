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
 * GET /api/v1/referral/code
 * Get user's referral code
 */
router.get('/code', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral-code', 'GET');
    sendSuccess(res, data.data || data, 'Referral code retrieved successfully');
  } catch (error) {
    logger.error('Error fetching referral code:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/referral/dashboard
 * Get referral dashboard
 */
router.get('/dashboard', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral-dashboard', 'GET');
    sendSuccess(res, data.data || data, 'Referral dashboard retrieved successfully');
  } catch (error) {
    logger.error('Error fetching referral dashboard:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/referral/credits/balance
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
 * GET /api/v1/referral/credits/transactions
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

/**
 * GET /api/v1/referral/batch-jobs/logs
 * Get batch job logs
 */
router.get('/batch-jobs/logs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, return mock data
    // In production, this would be fetched from a database
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;

    const logs = [
      {
        jobId: 'job-001-daily-badge-check',
        jobName: 'Daily Badge Auto-Upgrade Check',
        jobType: 'daily_badge_check',
        status: 'completed',
        startedAt: new Date(new Date().setHours(2, 0, 0)),
        completedAt: new Date(new Date().setHours(2, 15, 0)),
        duration: 900000,
        processedCount: 150,
        successCount: 148,
        failureCount: 2,
        logs: [
          '✅ Job started at 02:00 IST',
          '✅ Processed 150 users',
          '✅ Upgraded 25 users to Silver badge',
          '✅ Upgraded 10 users to Gold badge',
          '⚠️  2 users skipped due to verification pending',
          '✅ Job completed successfully',
        ],
      },
      {
        jobId: 'job-002-check-expired-referrals',
        jobName: 'Check Expired Referrals',
        jobType: 'check_expired_referrals',
        status: 'completed',
        startedAt: new Date(new Date().setHours(2, 15, 0)),
        completedAt: new Date(new Date().setHours(2, 20, 0)),
        duration: 300000,
        processedCount: 85,
        successCount: 85,
        failureCount: 0,
        logs: [
          '✅ Job started at 02:15 IST',
          '✅ Scanned 85 pending referrals',
          '✅ 23 referrals marked as expired',
          '✅ Notifications sent to referrers',
          '✅ Job completed successfully',
        ],
      },
    ];

    const start = (page - 1) * limit;
    const paginatedLogs = logs.slice(start, start + limit);

    sendSuccess(res, {
      logs: paginatedLogs,
      total: logs.length,
      page,
      limit,
    }, 'Batch job logs retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/referral/batch-jobs/status
 * Get batch job execution status
 */
router.get('/batch-jobs/status', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const lastRun = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    lastRun.setHours(2, 0, 0);

    const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    nextRun.setHours(2, 0, 0);

    sendSuccess(res, {
      lastDailyBadgeCheck: lastRun,
      lastReferralExpiryCheck: lastRun,
      lastVerificationBatch: lastRun,
      nextScheduledRun: nextRun,
    }, 'Batch job status retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
