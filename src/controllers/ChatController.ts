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
      res.setHeader('X-Target-Service', 'old-backend');
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
      res.setHeader('X-Target-Service', 'old-backend');
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
      res.setHeader('X-Target-Service', 'old-backend');
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
      res.setHeader('X-Target-Service', 'old-backend');
      res.setHeader('X-Gateway-Request-ID', req.requestId || '');

      const response = await chatService.getUserChats(req.query, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'ChatController.getUserChats');
    }
  }
}

export const chatController = new ChatController();

