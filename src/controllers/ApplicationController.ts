import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class ApplicationController {
  async getApplications(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Extract query parameters
      const queryParams: Record<string, any> = {};
      if (req.query.mine) queryParams.mine = req.query.mine;
      if (req.query.taskId) queryParams.taskId = req.query.taskId;
      if (req.query.status) queryParams.status = req.query.status;
      if (req.query.limit) queryParams.limit = req.query.limit;
      if (req.query.page) queryParams.page = req.query.page;

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.getApplications(queryParams, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ApplicationController.getApplications');
    }
  }

  async submitApplication(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.submitApplication(req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ApplicationController.submitApplication');
    }
  }

  async getApplication(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Application ID is required',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.getApplication(id, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ApplicationController.getApplication');
    }
  }

  async updateApplication(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Application ID is required',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.updateApplication(id, req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ApplicationController.updateApplication');
    }
  }

  async withdrawApplication(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Application ID is required',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.withdrawApplication(id, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ApplicationController.withdrawApplication');
    }
  }
}

export const applicationController = new ApplicationController();


