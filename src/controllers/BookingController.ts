import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { UserToken } from '../types/service.js';

export class BookingController {
  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await taskService.createBooking(req.body, req.user as UserToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.createBooking');
      next(error);
    }
  }

  async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await taskService.getBooking(req.params.orderId, req.user as UserToken);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.getBooking');
      next(error);
    }
  }

  async listMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const response = await taskService.listMyBookings(req.user as UserToken, { limit, page });
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.listMyBookings');
      next(error);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await taskService.cancelBooking(
        req.params.orderId,
        { reason: req.body?.reason },
        req.user as UserToken
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'BookingController.cancelBooking');
      next(error);
    }
  }
}

export const bookingController = new BookingController();
