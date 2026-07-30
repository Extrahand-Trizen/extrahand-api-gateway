import { Request, Response, NextFunction } from 'express';
import { couponService } from '../services/couponService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class CouponAdminController {
  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const response = await couponService.createCoupon(req.body || {}, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CouponAdminController.create');
    }
  }

  async list(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const query: Record<string, string> = {};
      if (req.query.isActive !== undefined) query.isActive = String(req.query.isActive);
      if (req.query.search) query.search = String(req.query.search);
      const response = await couponService.listCoupons(query, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CouponAdminController.list');
    }
  }

  async getById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const response = await couponService.getCoupon(req.params.id, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CouponAdminController.getById');
    }
  }

  async update(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const response = await couponService.updateCoupon(
        req.params.id,
        req.body || {},
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CouponAdminController.update');
    }
  }

  async setStatus(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const response = await couponService.setCouponStatus(
        req.params.id,
        Boolean(req.body?.isActive),
        req.user || null
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CouponAdminController.setStatus');
    }
  }

  async remove(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const response = await couponService.deleteCoupon(req.params.id, req.user || null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CouponAdminController.remove');
    }
  }
}

export const couponAdminController = new CouponAdminController();
