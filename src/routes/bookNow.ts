import { Router, Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { authMiddleware } from '../middleware/auth.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { UserToken } from '../types/service.js';
import logger from '../config/logger.js';

const router = Router();

/**
 * GET /api/v1/book-now/available-leads
 * Proxy: task-service /api/v1/book-now/available-leads
 *
 * Returns all unassigned Book Now tasks that match the partner's work areas.
 * Tasks marked "overdue" in the admin UI are status === 'open' in the DB and
 * are therefore included — no special handling required here.
 *
 * Optional query params: categories, lat, lng, radiusKm
 */
router.get(
  '/available-leads',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userToken = req.user as UserToken;

      const params: Record<string, any> = {};
      if (req.query.categories) params.categories = String(req.query.categories);
      if (req.query.lat) params.lat = parseFloat(String(req.query.lat));
      if (req.query.lng) params.lng = parseFloat(String(req.query.lng));
      if (req.query.radiusKm) params.radiusKm = parseFloat(String(req.query.radiusKm));

      logger.info('📋 [BookNow] Fetching available leads for partner', {
        profileId: userToken?.profileId,
        params,
      });

      const response = await taskService.getAvailableBookNowLeads(params, userToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookNowController.getAvailableLeads');
    }
  },
);

/**
 * POST /api/v1/book-now/tasks/:id/partner-accept
 * Proxy: task-service /api/v1/book-now/tasks/:id/partner-accept
 *
 * Atomically assigns the unassigned Book Now task to the calling partner.
 * Only the first partner to call wins — subsequent calls receive 400.
 */
router.post(
  '/tasks/:id/partner-accept',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userToken = req.user as UserToken;

      logger.info('✅ [BookNow] Partner accepting lead', {
        taskId: id,
        profileId: userToken?.profileId,
      });

      const response = await taskService.acceptBookNowLead(id, userToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookNowController.acceptLead');
    }
  },
);

/**
 * GET /api/v1/book-now/my-leads
 * Proxy: task-service /api/v1/book-now/my-leads
 *
 * Returns the partner's own accepted/active Book Now tasks.
 */
router.get(
  '/my-leads',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userToken = req.user as UserToken;
      const response = await taskService.getMyBookNowLeads(userToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookNowController.getMyLeads');
    }
  },
);

/**
 * PATCH /api/v1/book-now/tasks/:id/status
 * Proxy: task-service /api/v1/book-now/tasks/:id/status
 *
 * Partner updates the status of their own active Book Now task.
 * Body: { status: 'started' | 'in_progress' | 'review' | 'completed' }
 */
router.patch(
  '/tasks/:id/status',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userToken = req.user as UserToken;

      logger.info('📋 [BookNow] Partner updating lead status', {
        taskId: id,
        profileId: userToken?.profileId,
        status: req.body?.status,
      });

      const response = await taskService.updateBookNowLeadStatus(id, req.body, userToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookNowController.updateLeadStatus');
    }
  },
);

/**
 * POST /api/v1/book-now/tasks/:id/confirm-assignment
 * Proxy: task-service /api/v1/book-now/tasks/:id/confirm-assignment
 *
 * Partner confirms acknowledgement of their auto-assigned Book Now lead.
 */
router.post(
  '/tasks/:id/confirm-assignment',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userToken = req.user as UserToken;

      logger.info('✅ [BookNow] Partner confirming assignment', {
        taskId: id,
        profileId: userToken?.profileId,
      });

      const response = await taskService.confirmBookNowLead(id, userToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookNowController.confirmAssignment');
    }
  },
);

/**
 * GET /api/v1/book-now/cancellation-pass-status
 * Proxy: task-service /api/v1/book-now/cancellation-pass-status
 *
 * Returns the partner's current month cancellation pass status.
 */
router.get(
  '/cancellation-pass-status',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const userToken = req.user as UserToken;
      const response = await taskService.getCancellationPassStatus(userToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookNowController.getCancellationPassStatus');
    }
  },
);

export default router;
