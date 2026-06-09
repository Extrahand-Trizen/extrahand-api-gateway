import { Response, NextFunction } from 'express';
import { AdminRequest } from '../middleware/adminAuth.js';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { UserToken } from '../types/service.js';

export class AssignmentController {
  async listPending(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const token: UserToken = {
        uid: req.adminToken!.uid,
        token: req.adminToken!.token,
      };
      const response = await taskService.listPendingAssignments(token, { limit, page });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'AssignmentController.listPending');
      next(error);
    }
  }

  async assignHelper(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const token: UserToken = {
        uid: req.adminToken!.uid,
        token: req.adminToken!.token,
      };
      const response = await taskService.assignBookingHelper(req.body, token);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'AssignmentController.assignHelper');
      next(error);
    }
  }
}

export const assignmentController = new AssignmentController();
