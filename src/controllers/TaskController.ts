import { Request, Response, NextFunction } from "express";
import { taskService, TaskFilters } from "../services/taskService.js";
import { handleServiceError } from "../utils/errorHandler.js";
import { Task } from "../types/api.js";
import { enrichTaskResponse } from "../services/profileEnrichment.js";

import { UserToken } from "../types/service.js";
import logger from "../config/logger.js";

/**
 * Task-service responses are usually `{ success, message, data: <task or payload> }`.
 * Some mutations nest the document as `data.task`. Match getTaskById-style unwrapping before enrichment.
 */
function extractTaskPayloadFromServiceBody(body: any): any {
  if (body == null || typeof body !== "object") {
    return body;
  }
  const nested = body.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const innerTask = (nested as any).task;
    if (innerTask && typeof innerTask === "object") {
      return innerTask;
    }
    if ((nested as any)._id || (nested as any).id) {
      return nested;
    }
  }
  if (body.task && typeof body.task === "object") {
    return body.task;
  }
  if (body._id || body.id) {
    return body;
  }
  return nested ?? body;
}

export class TaskController {
  async getTasks(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      // ✅ Public endpoint - req.user is optional (populated by optionalAuthMiddleware)
      // If user is authenticated, we can show personalized data, otherwise show public data
      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const filters: TaskFilters = {
        category: req.query.category as string,
        status: req.query.status as string,
        search: req.query.search as string,
        suburb: req.query.suburb as string,
        remotely: req.query.remotely as string,
        sortBy: req.query.sortBy as string,
        excludeRequesterId: req.user?.profileId,
        minBudget: req.query.minBudget
          ? parseInt(req.query.minBudget as string, 10)
          : undefined,
        maxBudget: req.query.maxBudget
          ? parseInt(req.query.maxBudget as string, 10)
          : undefined,
        city: req.query.city as string,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        page: req.query.page
          ? parseInt(req.query.page as string, 10)
          : undefined,
      };

      const response = await taskService.getTasks(filters, req.user);
      
      // ✅ Extract tasks from task-service response format: { success, code, message, data, meta }
      // task-service returns: { success: true, code: 200, message: string, data: Task[], meta: { pagination } }
      const taskServiceResponse = response.data;
      const tasks = taskServiceResponse?.data || taskServiceResponse || [];
      const pagination = (taskServiceResponse as any)?.meta?.pagination;
      
      // ✅ Enrich tasks with Profile data (requesterName, requesterPhotoURL, etc.)
      // Always enrich, even for unauthenticated (public) requests so profile images show in cards
      const userToken: UserToken = (req.user as UserToken) || { uid: 'system', token: null };
      const enrichedTasks = await enrichTaskResponse(tasks, userToken);
      
      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: 200,
        message: taskServiceResponse?.message || 'Tasks retrieved successfully',
        data: enrichedTasks,
        ...(pagination && { meta: { pagination } }),
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.getTasks");
    }
  }

  async getMyTasks(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const filters = {
        status: req.query.status as string,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        page: req.query.page
          ? parseInt(req.query.page as string, 10)
          : undefined,
      };

      const response = await taskService.getMyTasks(filters, req.user);
      
      // ✅ Extract tasks from task-service response format: { success, code, message, data, meta }
      const taskServiceResponse = response.data;
      const tasks = taskServiceResponse?.data?.tasks || taskServiceResponse?.data || taskServiceResponse || [];
      const pagination = taskServiceResponse?.data?.pagination || (taskServiceResponse as any)?.meta?.pagination;
      
      // ✅ Enrich tasks with Profile data (requesterName, requesterPhotoURL, etc.)
      const enrichedTasks = await enrichTaskResponse(tasks, req.user);
      
      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: 200,
        message: taskServiceResponse?.message || 'Your tasks retrieved successfully',
        data: enrichedTasks,
        ...(pagination && { meta: { pagination } }),
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.getMyTasks");
    }
  }

  async getTaskById(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      // ✅ PUBLIC endpoint - accessible to users WITHOUT accounts
      // req.user is optional (populated by optionalAuthMiddleware if user is logged in)
      // If user is authenticated, we can show personalized data, otherwise show public data
      // No authentication required - route works for unauthenticated users
      
      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.getTaskById(taskId, req.user as any);
      
      // ✅ Extract task from task-service response format: { success, code, message, data }
      const taskServiceResponse = response.data;
      const task = taskServiceResponse?.data || taskServiceResponse;
      
      // ✅ Enrich task with Profile data (requesterName, requesterPhotoURL, etc.)
      // For public routes we still want names even if the caller is not authenticated,
      // so fall back to a system-level token when req.user is undefined.
      const userToken: UserToken = (req.user as UserToken) || {
        uid: "system",
        token: null,
      };
      const enrichedTask = await enrichTaskResponse(task, userToken);
      
      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: 200,
        message: taskServiceResponse?.message || 'Task retrieved successfully',
        data: enrichedTask,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.getTaskById");
    }
  }

  async createTask(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const taskData: Partial<Task> = req.body;
      const response = await taskService.createTask(taskData, req.user);
      
      // ✅ Extract task from task-service response format: { success, code, message, data }
      const taskServiceResponse = response.data;
      const task = taskServiceResponse?.data || taskServiceResponse;
      
      // ✅ Enrich task with Profile data (requesterName, requesterPhotoURL, etc.)
      const enrichedTask = await enrichTaskResponse(task, req.user);
      
      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: response.status,
        message: taskServiceResponse?.message || 'Task created successfully',
        data: enrichedTask,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.createTask");
    }
  }

  async updateTask(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const taskData: Partial<Task> = req.body;
      const response = await taskService.updateTask(taskId, taskData, req.user);
      
      // ✅ Extract task from task-service response format: { success, code, message, data }
      const taskServiceResponse = response.data;
      const task = taskServiceResponse?.data || taskServiceResponse;
      
      // ✅ Enrich task with Profile data (requesterName, requesterPhotoURL, etc.)
      const enrichedTask = await enrichTaskResponse(task, req.user);
      
      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: 200,
        message: taskServiceResponse?.message || 'Task updated successfully',
        data: enrichedTask,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.updateTask");
    }
  }

  async deleteTask(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.deleteTask(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.deleteTask");
    }
  }

  async getTaskApplications(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // ✅ Add headers to show it's from gateway
      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.getTaskApplications(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.getTaskApplications");
    }
  }

  async getTaskQuestions(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.getTaskQuestions(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.getTaskQuestions");
    }
  }

  async askQuestion(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.askQuestion(
        taskId,
        req.body,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.askQuestion");
    }
  }

  async answerQuestion(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, questionId } = req.params;
      if (!taskId || !questionId) {
        res.status(400).json({
          success: false,
          error: "Task ID and Question ID are required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.answerQuestion(
        taskId,
        questionId,
        req.body,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.answerQuestion");
    }
  }

  async deleteQuestion(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, questionId } = req.params;
      if (!taskId || !questionId) {
        res.status(400).json({
          success: false,
          error: "Task ID and Question ID are required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.deleteQuestion(
        taskId,
        questionId,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.deleteQuestion");
    }
  }

  async updateTaskStatus(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      const { status, cancellationReason } = req.body;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: "Status is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      logger.info("➡️ Gateway: update-task-status called", {
        taskId,
        userUid: req.user.uid,
        status,
      });

      const response = await taskService.updateTaskStatus(
        taskId,
        status,
        req.user,
        cancellationReason
      );

      const taskServiceResponse = response.data as any;
      const taskPayload = extractTaskPayloadFromServiceBody(taskServiceResponse);
      const enrichedTask = await enrichTaskResponse(taskPayload, req.user);

      res.status(response.status).json({
        success: true,
        code: response.status,
        message: taskServiceResponse?.message || "Work status updated successfully",
        data: enrichedTask,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.updateTaskStatus");
    }
  }

  async submitCompletionProof(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      const { proofUrls, notes } = req.body;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.submitCompletionProof(
        taskId,
        { proofUrls, notes },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.submitCompletionProof");
    }
  }

  async sendStartOtp(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.sendStartOtp(taskId, req.user);
      const taskServiceResponse = response.data as any;
      const payload =
        taskServiceResponse?.data ??
        (taskServiceResponse?.expiresAt != null || taskServiceResponse?.sentTo != null
          ? taskServiceResponse
          : null) ??
        taskServiceResponse;
      res.status(response.status).json({
        success: true,
        code: response.status,
        message: taskServiceResponse?.message || "Start OTP sent",
        data: payload,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.sendStartOtp");
    }
  }

  async resendStartOtp(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.resendStartOtp(taskId, req.user);
      const taskServiceResponse = response.data as any;
      const payload =
        taskServiceResponse?.data ??
        (taskServiceResponse?.expiresAt != null || taskServiceResponse?.sentTo != null
          ? taskServiceResponse
          : null) ??
        taskServiceResponse;
      res.status(response.status).json({
        success: true,
        code: response.status,
        message: taskServiceResponse?.message || "Start OTP resent",
        data: payload,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.resendStartOtp");
    }
  }

  async verifyStartOtp(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      const { otp } = req.body;

      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }

      if (!otp) {
        res.status(400).json({ success: false, error: "OTP is required" });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.verifyStartOtp(taskId, String(otp), req.user);
      const taskServiceResponse = response.data as any;
      const taskPayload = extractTaskPayloadFromServiceBody(taskServiceResponse);
      const enrichedTask = await enrichTaskResponse(taskPayload, req.user);

      res.status(response.status).json({
        success: true,
        code: response.status,
        message: taskServiceResponse?.message || "Task started successfully",
        data: enrichedTask,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.verifyStartOtp");
    }
  }

  async approveCompletion(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      logger.info("➡️ Gateway: approve-completion called", {
        taskId,
        userUid: req.user.uid,
      });

      const response = await taskService.approveCompletion(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.approveCompletion");
    }
  }

  async rejectCompletion(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      const { reason } = req.body;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.rejectCompletion(
        taskId,
        { reason },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.rejectCompletion");
    }
  }

  async requestChanges(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      const { message } = req.body;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.requestChanges(
        taskId,
        { message },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.requestChanges");
    }
  }

  // Reverted: additional quote / selfie-work-evidence tracking flow disabled in gateway.
  // async createAdditionalQuoteRequest(...) {}
  // async getAdditionalQuoteRequests(...) {}
  // async getActiveAdditionalQuoteRequest(...) {}
  // async acceptAdditionalQuoteRequest(...) {}
  // async rejectAdditionalQuoteRequest(...) {}
  // async withdrawAdditionalQuoteRequest(...) {}

  async followTask(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.followTask(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.followTask");
    }
  }

  async unfollowTask(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.unfollowTask(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.unfollowTask");
    }
  }

  async checkFollowStatus(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.checkFollowStatus(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.checkFollowStatus");
    }
  }

  async getFollowedTasks(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const { page, limit } = req.query;

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.getFollowedTasks(
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 20,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.getFollowedTasks");
    }
  }

  async reportTask(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      const { reason, description } = req.body;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: "Reason is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.reportTask(
        taskId,
        reason,
        description,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.reportTask");
    }
  }

    async getTaskReports(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.getTaskReports(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.getTaskReports");
    }
  }

  async getNearbyTasks(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const {
        lat,
        lng,
        radiusKm,
        status,
        limit,
        page,
        category,
        city,
        search,
        minBudget,
        maxBudget,
        remotely,
        sortBy,
      } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: "Latitude and longitude are required",
        });
        return;
      }

      const response = await taskService.getNearbyTasks(
        {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
          radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
          status: status as string,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          page: page ? parseInt(page as string, 10) : undefined,
          category: category as string,
          city: city as string,
          search: search as string,
          minBudget: minBudget ? parseFloat(minBudget as string) : undefined,
          maxBudget: maxBudget ? parseFloat(maxBudget as string) : undefined,
          remotely: remotely as string,
          sortBy: sortBy as string,
        },
        req.user
      );

      // ✅ Extract tasks from task-service response format.
      // Supports both:
      // - data: Task[]
      // - data: { tasks: Task[], pagination?: any, location?: any }
      const taskServiceResponse = response.data;
      const nearbyPayload: unknown = taskServiceResponse?.data;
      const hasTasksObjectShape =
        !!nearbyPayload &&
        typeof nearbyPayload === "object" &&
        !Array.isArray(nearbyPayload) &&
        Array.isArray((nearbyPayload as any).tasks);
      const tasks = hasTasksObjectShape
        ? (nearbyPayload as any).tasks
        : Array.isArray(nearbyPayload)
          ? nearbyPayload
          : [];
      const pagination = hasTasksObjectShape
        ? (nearbyPayload as any).pagination
        : undefined;
      const locationMeta = hasTasksObjectShape
        ? (nearbyPayload as any).location
        : undefined;
      
      // ✅ Enrich tasks with Profile data (requesterName, requesterPhotoURL, etc.)
      const enrichedTasks = await enrichTaskResponse(tasks, req.user);

      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: 200,
        message: taskServiceResponse?.message || 'Nearby tasks retrieved successfully',
        data: enrichedTasks,
        ...(pagination && { meta: { pagination } }),
        ...(locationMeta && { location: locationMeta }),
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.getNearbyTasks");
    }
  }

  // ── Global Budget Revision ─────────────────────────────────────────────────

  async reviseBudget(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      const { newAmount, reason } = req.body;
      if (newAmount === undefined || newAmount === null) {
        res.status(400).json({ success: false, error: "newAmount is required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.reviseBudget(
        taskId,
        { newAmount: Number(newAmount), reason },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.reviseBudget");
    }
  }

  async getRecurringVisits(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const syncPayments = String(req.query.sync || '').toLowerCase() === 'true';

      const response = await taskService.getRecurringVisits(taskId, req.user, {
        syncPayments,
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.getRecurringVisits");
    }
  }

  async confirmRecurringVisitPayment(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      const { escrowId } = req.body;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      if (!escrowId || typeof escrowId !== "string") {
        res.status(400).json({ success: false, error: "escrowId is required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.confirmRecurringVisitPayment(
        taskId,
        visitId,
        escrowId,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.confirmRecurringVisitPayment");
    }
  }

  async skipRecurringVisit(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.skipRecurringVisit(
        taskId,
        visitId,
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.skipRecurringVisit");
    }
  }

  async cancelRecurringVisit(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.cancelRecurringVisit(
        taskId,
        visitId,
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.cancelRecurringVisit");
    }
  }

  async endRecurringPlan(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.endRecurringPlan(
        taskId,
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.endRecurringPlan");
    }
  }

  async resumeRecurringPlan(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.resumeRecurringPlan(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.resumeRecurringPlan");
    }
  }

  async openNextRecurringVisitPayment(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.openNextRecurringVisitPayment(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.openNextRecurringVisitPayment");
    }
  }

  async rescheduleRecurringVisit(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      const newDate = req.body?.newDate;
      if (!newDate) {
        res.status(400).json({ success: false, error: "newDate is required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.rescheduleRecurringVisit(
        taskId,
        visitId,
        {
          newDate: String(newDate),
          scheduledTimeStart:
            typeof req.body?.scheduledTimeStart === "string"
              ? req.body.scheduledTimeStart
              : undefined,
          scheduledTimeEnd:
            typeof req.body?.scheduledTimeEnd === "string"
              ? req.body.scheduledTimeEnd
              : undefined,
          reason: typeof req.body?.reason === "string" ? req.body.reason : undefined,
        },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.rescheduleRecurringVisit");
    }
  }

  async requestRecurringVisitReschedule(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      const newDate = req.body?.newDate;
      if (!newDate) {
        res.status(400).json({ success: false, error: "newDate is required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.requestRecurringVisitReschedule(
        taskId,
        visitId,
        {
          newDate: String(newDate),
          scheduledTimeStart:
            typeof req.body?.scheduledTimeStart === "string"
              ? req.body.scheduledTimeStart
              : undefined,
          scheduledTimeEnd:
            typeof req.body?.scheduledTimeEnd === "string"
              ? req.body.scheduledTimeEnd
              : undefined,
          reason: typeof req.body?.reason === "string" ? req.body.reason : undefined,
        },
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.requestRecurringVisitReschedule");
    }
  }

  async respondRecurringVisitReschedule(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.respondRecurringVisitReschedule(
        taskId,
        visitId,
        req.body?.approved === true,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.respondRecurringVisitReschedule");
    }
  }

  async requestRecurringVisitCancel(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.requestRecurringVisitCancel(
        taskId,
        visitId,
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.requestRecurringVisitCancel");
    }
  }

  async respondRecurringVisitCancel(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId, visitId } = req.params;
      if (!taskId || !visitId) {
        res.status(400).json({ success: false, error: "Task ID and visit ID are required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.respondRecurringVisitCancel(
        taskId,
        visitId,
        req.body?.approved === true,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.respondRecurringVisitCancel");
    }
  }

  async pauseRecurringPlan(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.pauseRecurringPlan(
        taskId,
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.pauseRecurringPlan");
    }
  }

  async leaveRecurringPlan(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const { taskId } = req.params;
      if (!taskId) {
        res.status(400).json({ success: false, error: "Task ID is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.leaveRecurringPlan(
        taskId,
        typeof req.body?.reason === "string" ? req.body.reason : undefined,
        req.user
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, "TaskController.leaveRecurringPlan");
    }
  }
}

export const taskController = new TaskController();
