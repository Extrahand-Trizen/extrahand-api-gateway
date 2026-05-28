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

/** Send error response; for AxiosError, forward upstream status and message when present */
const sendError = (res: Response, error: any, statusCode = 500) => {
  const axiosErr = error as AxiosError<{ error?: string; message?: string }>;
  const upstream = axiosErr.response?.data;
  const code = axiosErr.response?.status ?? statusCode;
  const raw =
    upstream && typeof upstream === 'object'
      ? (upstream.error ?? upstream.message)
      : undefined;
  const message =
    typeof raw === 'string'
      ? raw
      : error?.message || (typeof error === 'string' ? error : 'Internal server error');
  res.status(code).json({
    success: false,
    error: message,
  });
};

const getUserServiceUrl = () => env.USER_SERVICE_URL;

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
    const userServiceUrl = getUserServiceUrl();
    const url = `${userServiceUrl}/api${path}`;
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
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;
    logger.error(`❌ Proxy error to user service:`, {
      path,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
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
 * GET /api/v1/user/referral-code/preview?code=XXXX
 * Public preview of referral code channel (no PII)
 */
router.get('/referral-code/preview', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral-code/preview', 'GET');
    sendSuccess(res, data.data || data, 'Referral code preview retrieved');
  } catch (error) {
    logger.error('Error previewing referral code:', error);
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
 * GET /api/v1/user/referral-program
 * Active referral program marketing numbers (coin amounts)
 */
router.get('/referral-program', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral-program', 'GET');
    sendSuccess(res, data.data || data, 'Referral program retrieved successfully');
  } catch (error) {
    logger.error('Error fetching referral program:', error);
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

/**
 * POST /api/v1/user/referral/apply
 * Apply a referral code
 */
router.post('/referral/apply', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral/apply', 'POST');
    sendSuccess(res, data.data || data, 'Referral code applied');
  } catch (error) {
    logger.error('Error applying referral code:', error);
    sendError(res, error, 500);
  }
});

/**
 * POST /api/v1/user/referral/retry-grants
 * Re-attempt referral ExtraCoin grants for the signed-in user
 */
router.post('/referral/retry-grants', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral/retry-grants', 'POST');
    sendSuccess(res, data.data || data, data.message || 'Referral grants retried');
  } catch (error) {
    logger.error('Error retrying referral grants:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/credits/withdrawals
 * Get withdrawal history
 */
router.get('/credits/withdrawals', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/credits/withdrawals', 'GET');
    sendSuccess(res, data.data || data, 'Withdrawal history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching withdrawal history:', error);
    sendError(res, error, 500);
  }
});

/**
 * POST /api/v1/user/credits/use-payment
 * Use credits for payment
 */
router.post('/credits/use-payment', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/credits/use-payment', 'POST');
    sendSuccess(res, data.data || data, 'Credits used');
  } catch (error) {
    logger.error('Error using credits:', error);
    sendError(res, error, 500);
  }
});

/**
 * POST /api/v1/user/credits/gift
 * Gift credits to another user
 */
router.post('/credits/gift', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/credits/gift', 'POST');
    sendSuccess(res, data.data || data, 'Credits gifted');
  } catch (error) {
    logger.error('Error gifting credits:', error);
    sendError(res, error, 500);
  }
});

/**
 * POST /api/v1/user/credits/withdraw
 * Request credit withdrawal
 */
router.post('/credits/withdraw', authMiddleware, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/credits/withdraw', 'POST');
    sendSuccess(res, data.data || data, 'Withdrawal requested');
  } catch (error) {
    logger.error('Error requesting withdrawal:', error);
    sendError(res, error, 500);
  }
});

/**
 * POST /api/v1/user/referral/qualify
 * Service-to-service: qualify a referral (no auth)
 */
router.post('/referral/qualify', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral/qualify', 'POST');
    sendSuccess(res, data.data || data, 'Referral qualified');
  } catch (error) {
    logger.error('Error qualifying referral:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/referral/check-qualification
 * Check if referral code can qualify (proxy to user service)
 */
router.get('/referral/check-qualification', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const data = await proxyToUserService(req, res, '/v1/user/referral/check-qualification', 'GET');
    sendSuccess(res, data.data || data, 'Qualification check completed');
  } catch (error) {
    logger.error('Error checking referral qualification:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/referral/public/:code
 * Get public referral info by code (proxy to user service)
 */
router.get('/referral/public/:code', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { code } = req.params;
    const data = await proxyToUserService(req, res, `/v1/user/referral/public/${encodeURIComponent(code)}`, 'GET');
    sendSuccess(res, data.data || data, 'Public referral info retrieved');
  } catch (error) {
    logger.error('Error fetching public referral info:', error);
    sendError(res, error, 500);
  }
});

/**
 * GET /api/v1/user/batch-jobs/logs
 * Batch job logs (mock – not implemented in user service yet)
 */
router.get('/batch-jobs/logs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
    sendSuccess(
      res,
      { logs: paginatedLogs, total: logs.length, page, limit },
      'Batch job logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/user/batch-jobs/status
 * Batch job execution status (mock)
 */
router.get('/batch-jobs/status', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const lastRun = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    lastRun.setHours(2, 0, 0);
    const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    nextRun.setHours(2, 0, 0);
    sendSuccess(
      res,
      {
        lastDailyBadgeCheck: lastRun,
        lastReferralExpiryCheck: lastRun,
        lastVerificationBatch: lastRun,
        nextScheduledRun: nextRun,
      },
      'Batch job status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

export default router;
