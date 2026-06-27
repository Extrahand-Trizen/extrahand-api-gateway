import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class BookingController {
  async createBooking(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.createBooking(req.body, req.user);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.createBooking');
    }
  }

  async listMyBookings(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : undefined;
      const page = req.query.page
        ? parseInt(String(req.query.page), 10)
        : undefined;

      const response = await taskService.listMyBookings(
        { limit, page },
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.listMyBookings');
    }
  }

  async getSlotAvailability(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const date = String(req.query.date || '').trim();
      const city = String(req.query.city || '').trim();
      if (!date || !city) {
        res.status(400).json({ success: false, error: 'date and city are required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getBookNowSlotAvailability(
        { date, city },
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.getSlotAvailability');
    }
  }

  async getBookingOrderIdForTask(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getBookingOrderIdForTask(
        req.params.taskId,
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.getBookingOrderIdForTask');
    }
  }

  async getBooking(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getBookingOrder(
        req.params.orderId,
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.getBooking');
    }
  }

  async cancelBookingItem(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const taskId = String(req.body?.taskId || '').trim();
      if (!taskId) {
        res.status(400).json({ success: false, error: 'taskId is required' });
        return;
      }

      const response = await taskService.cancelBookingOrderItem(
        req.params.orderId,
        { taskId, reason: req.body?.reason },
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.cancelBookingItem');
    }
  }

  async cancelBooking(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.cancelBookingOrder(
        req.params.orderId,
        { reason: req.body?.reason },
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.cancelBooking');
    }
  }

  async abandonUnpaidBooking(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.abandonUnpaidBookingOrder(
        req.params.orderId,
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.abandonUnpaidBooking');
    }
  }

  async confirmBookingPayment(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.confirmBookingPayment(
        req.params.orderId,
        req.user,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.confirmBookingPayment');
    }
  }
}

export const bookingController = new BookingController();
