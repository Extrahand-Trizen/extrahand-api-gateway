import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class CatalogController {
  async listCategories(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.listCatalogCategories(req.user ?? null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listCategories');
    }
  }

  async getCategory(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getCatalogCategory(
        req.params.slug,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getCategory');
    }
  }

  async getSku(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const categorySlug =
        typeof req.query.categorySlug === 'string'
          ? req.query.categorySlug
          : undefined;

      const response = await taskService.getCatalogSku(
        req.params.skuSlug,
        categorySlug,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getSku');
    }
  }

  async checkPinCode(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const pinCode = String(req.query.pinCode || '');
      const city =
        typeof req.query.city === 'string' ? req.query.city : undefined;

      const response = await taskService.checkCatalogPinCode(
        pinCode,
        city,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.checkPinCode');
    }
  }
}

export const catalogController = new CatalogController();
