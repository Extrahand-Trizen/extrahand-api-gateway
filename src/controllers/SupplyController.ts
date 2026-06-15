import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class SupplyController {
  static async proxyProfileSupply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const path = req.path.replace(/^\/profiles/, '') || req.url.replace(/^\/profiles/, '');
      const method = req.method.toLowerCase() as 'get' | 'post' | 'patch';
      const response = await userService.proxySupply(
        method === 'get' ? 'get' : method === 'post' ? 'post' : 'patch',
        path.split('?')[0],
        req.user,
        req.body,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'SupplyController.proxyProfileSupply');
      next(error);
    }
  }

  static async proxyPartnerJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const url = `/api/v1/partner/jobs${req.path === '/' ? '' : req.path}`;
      const method = req.method.toLowerCase();
      const response = await taskService.proxyPartnerJobs(method, url, req.user, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'SupplyController.proxyPartnerJobs');
      next(error);
    }
  }

  static async proxyBookNowAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const url = `/api/v1/admin/assignments${req.path.replace('/assignments', '')}`;
      const method = req.method.toLowerCase();
      const response = await taskService.proxyAdminAssignments(method, url, req.user, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'SupplyController.proxyBookNowAdmin');
      next(error);
    }
  }
}
