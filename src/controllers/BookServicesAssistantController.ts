import { Request, Response } from 'express';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class BookServicesAssistantController {
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const bookingOrderId = String(req.body?.bookingOrderId || '').trim();
      const taskId = String(req.body?.taskId || '').trim();
      if (!bookingOrderId) {
        res.status(400).json({ success: false, error: 'bookingOrderId is required' });
        return;
      }

      const response = await taskService.createBookServicesAssistantConversation(
        { bookingOrderId, ...(taskId ? { taskId } : {}) },
        req.user,
      );
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookServicesAssistantController.createConversation');
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const conversationId = String(req.params.conversationId || '').trim();
      if (!conversationId) {
        res.status(400).json({ success: false, error: 'conversationId is required' });
        return;
      }

      const response = await taskService.getBookServicesAssistantConversation(
        conversationId,
        req.user,
      );
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookServicesAssistantController.getConversation');
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const conversationId = String(req.params.conversationId || '').trim();
      const text = String(req.body?.text || '').trim();
      const optionId = String(req.body?.optionId || '').trim();
      const clientMessageId = String(req.body?.clientMessageId || '').trim();
      if (!conversationId || !text) {
        res.status(400).json({
          success: false,
          error: 'conversationId and text are required',
        });
        return;
      }

      const response = await taskService.sendBookServicesAssistantMessage(
        conversationId,
        {
          text,
          ...(optionId ? { optionId } : {}),
          ...(clientMessageId ? { clientMessageId } : {}),
        },
        req.user,
      );
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookServicesAssistantController.sendMessage');
    }
  }

  async endConversation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const conversationId = String(req.params.conversationId || '').trim();
      if (!conversationId) {
        res.status(400).json({ success: false, error: 'conversationId is required' });
        return;
      }

      const response = await taskService.endBookServicesAssistantConversation(
        conversationId,
        req.user,
      );
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookServicesAssistantController.endConversation');
    }
  }
}

export const bookServicesAssistantController = new BookServicesAssistantController();
