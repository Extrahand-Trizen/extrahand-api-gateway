import { Request, Response, NextFunction } from 'express';
import { taskService, TaskFilters } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { Task } from '../types/api.js';

export class TaskController {
  async getTasks(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

      const filters: TaskFilters = {
        category: req.query.category as string,
        status: req.query.status as string,
        minBudget: req.query.minBudget ? parseInt(req.query.minBudget as string, 10) : undefined,
        maxBudget: req.query.maxBudget ? parseInt(req.query.maxBudget as string, 10) : undefined,
        city: req.query.city as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string, 10) : undefined,
      };

      const response = await taskService.getTasks(filters, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.getTasks');
    }
  }

  async getTaskById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      const response = await taskService.getTaskById(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.getTaskById');
    }
  }

  async createTask(req: Request, res: Response, _next: NextFunction): Promise<void> {
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

      const taskData: Partial<Task> = req.body;
      const response = await taskService.createTask(taskData, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.createTask');
    }
  }

  async updateTask(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      const taskData: Partial<Task> = req.body;
      const response = await taskService.updateTask(taskId, taskData, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.updateTask');
    }
  }

  async deleteTask(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      const response = await taskService.deleteTask(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.deleteTask');
    }
  }

  async getTaskApplications(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      const response = await taskService.getTaskApplications(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.getTaskApplications');
    }
  }

  async getTaskQuestions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.getTaskQuestions(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.getTaskQuestions');
    }
  }

  async askQuestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.askQuestion(taskId, req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.askQuestion');
    }
  }

  async answerQuestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId, questionId } = req.params;
      if (!taskId || !questionId) {
        res.status(400).json({
          success: false,
          error: 'Task ID and Question ID are required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.answerQuestion(taskId, questionId, req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.answerQuestion');
    }
  }

  async deleteQuestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId, questionId } = req.params;
      if (!taskId || !questionId) {
        res.status(400).json({
          success: false,
          error: 'Task ID and Question ID are required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.deleteQuestion(taskId, questionId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.deleteQuestion');
    }
  }

  async updateTaskStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const { status, cancellationReason } = req.body;
      
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.updateTaskStatus(taskId, status, req.user, cancellationReason);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.updateTaskStatus');
    }
  }

  async submitCompletionProof(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const { proofUrls, notes } = req.body;
      
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.submitCompletionProof(taskId, { proofUrls, notes }, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.submitCompletionProof');
    }
  }

  async approveCompletion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.approveCompletion(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.approveCompletion');
    }
  }

  async rejectCompletion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const { reason } = req.body;
      
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: 'Task ID is required',
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

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await taskService.rejectCompletion(taskId, { reason }, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'TaskController.rejectCompletion');
    }
  }
}

export const taskController = new TaskController();

