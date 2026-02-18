import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = Router();

// Inline sendSuccess function for consistency
const sendSuccess = (res: Response, data: any, message: string, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * GET /api/v1/batch-jobs/logs
 * Get batch job logs
 */
router.get('/logs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const jobType = req.query.jobType as string;
    const status = req.query.status as string;

    // For now, return empty logs - in production this would query a logs collection
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
          '⚠️ 2 users skipped due to verification pending',
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

    const filtered = logs.filter(log => {
      if (jobType && log.jobType !== jobType) return false;
      if (status && log.status !== status) return false;
      return true;
    });

    const start = (page - 1) * limit;
    const paginatedLogs = filtered.slice(start, start + limit);

    sendSuccess(res, {
      logs: paginatedLogs,
      total: filtered.length,
      page,
      limit,
    }, 'Batch job logs retrieved successfully');
  } catch (error) {
    logger.error('Error fetching batch job logs:', error);
    next(error);
  }
});

/**
 * GET /api/v1/batch-jobs/status
 * Get batch job status and last execution times
 */
router.get('/status', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, return mock status - in production this would query job execution history
    const now = new Date();
    const lastRun = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
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
    logger.error('Error fetching batch job status:', error);
    next(error);
  }
});

export default router;
