import { Request, Response, NextFunction } from "express";
import { taskService, TaskFilters } from "../services/taskService.js";
import { userService } from "../services/userService.js";
import { handleServiceError } from "../utils/errorHandler.js";
import { Task } from "../types/api.js";
import { enrichTaskResponse } from "../services/profileEnrichment.js";
import { getTaskPostingVerificationStatus, getTaskStartVerificationStatus } from "../lib/verificationGate.js";
import { UserToken } from "../types/service.js";

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
      const enrichedTasks = req.user 
        ? await enrichTaskResponse(tasks, req.user)
        : tasks;
      
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

      // Enforce verification (Aadhaar, Bank, PAN) before allowing task creation
      const profileResponse = await userService.getCurrentProfile(req.user);
      const profile = (profileResponse.data as any)?.data ?? profileResponse.data;
      const verificationStatus = getTaskPostingVerificationStatus(profile ?? null);
      if (!verificationStatus.allowed) {
        res.status(403).json({
          success: false,
          error: "Verification required to post a task",
          missing: verificationStatus.missing,
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

      // STEP 3: Check Aadhaar verification before allowing task start
      if (status === "started") {
        try {
          const profileResponse = await userService.getCurrentProfile(req.user);
          const profile = profileResponse?.data?.data ?? null;

          const verificationStatus = getTaskStartVerificationStatus(profile);
          if (!verificationStatus.allowed) {
            res.status(403).json({
              success: false,
              error: "Aadhaar verification required to start the task",
              message: verificationStatus.message,
              missing: verificationStatus.missing,
            });
            return;
          }
        } catch (error) {
          console.error("Failed to fetch user profile for verification check:", error);
          res.status(500).json({
            success: false,
            error: "Failed to verify user credentials",
          });
          return;
        }
      }

      res.setHeader("X-Served-By", "api-gateway");
      res.setHeader("X-Target-Service", "task-service");
      res.setHeader("X-Gateway-Request-ID", req.requestId || "");

      const response = await taskService.updateTaskStatus(
        taskId,
        status,
        req.user,
        cancellationReason
      );
      
      // ✅ Enrich task with Profile data (requesterName, requesterPhotoURL, etc.)
      const enrichedData = await enrichTaskResponse(response.data, req.user);
      
      res.status(response.status).json(enrichedData);
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

      const { lat, lng, radiusKm, status, limit } = req.query;

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
        },
        req.user
      );

      // ✅ Extract tasks from task-service response format: { success, code, message, data }
      const taskServiceResponse = response.data;
      const tasks = taskServiceResponse?.data || taskServiceResponse || [];
      
      // ✅ Enrich tasks with Profile data (requesterName, requesterPhotoURL, etc.)
      const enrichedTasks = await enrichTaskResponse(tasks, req.user);

      // ✅ Return in same format as task-service
      res.status(response.status).json({
        success: true,
        code: 200,
        message: taskServiceResponse?.message || 'Nearby tasks retrieved successfully',
        data: enrichedTasks,
      });
    } catch (error) {
      handleServiceError(error, res, "TaskController.getNearbyTasks");
    }
  }
}

export const taskController = new TaskController();
