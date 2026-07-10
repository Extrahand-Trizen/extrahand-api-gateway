import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chatService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class ChatController {
  async startChat(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.startChat(req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.startChat');
    }
  }

  async getMessages(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      if (!chatId) {
        res.status(400).json({
          success: false,
          error: 'Chat ID is required',
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.getMessages(chatId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.getMessages');
    }
  }

  async sendMessage(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      if (!chatId) {
        res.status(400).json({
          success: false,
          error: 'Chat ID is required',
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.sendMessage(chatId, req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.sendMessage');
    }
  }

  async getUserChats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.getUserChats(req.query, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.getUserChats');
    }
  }

  async getChatById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      if (!chatId) {
        res.status(400).json({
          success: false,
          error: 'Chat ID is required',
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.getChatDetails(chatId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.getChatById');
    }
  }

  /**
   * Mark chat as read
   * POST /api/v1/chats/:chatId/read
   */
  async markChatAsRead(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      if (!chatId) {
        res.status(400).json({
          success: false,
          error: 'Chat ID is required',
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.markChatAsRead(chatId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.markChatAsRead');
    }
  }

  /**
   * Start a chat for a specific task (with permission validation)
   * POST /api/v1/chats/task/:taskId/start
   */
  async startChatForTask(req: Request, res: Response, _next: NextFunction): Promise<void> {
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.startChatForTask(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.startChatForTask');
    }
  }

  /**
   * Get existing task chat without creating one
   * GET /api/v1/chats/task/:taskId
   */
  async getTaskChatForUser(req: Request, res: Response, _next: NextFunction): Promise<void> {
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.getTaskChatForUser(taskId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.getTaskChatForUser');
    }
  }

  /**
   * DELETE /api/v1/chats/:chatId
   */
  async deleteChat(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      if (!chatId) {
        res.status(400).json({
          success: false,
          error: 'Chat ID is required',
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
      res.setHeader('X-Target-Service', 'chat-service');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.deleteChat(chatId, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.deleteChat');
    }
  }
}

export const chatController = new ChatController();


