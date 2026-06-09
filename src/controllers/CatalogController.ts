import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { handleServiceError } from '../utils/errorHandler.js';

export class CatalogController {
  async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await taskService.listCatalogCategories();
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listCategories');
      next(error);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response = await taskService.getCatalogCategory(req.params.slug);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getCategory');
      next(error);
    }
  }

  async getSku(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categorySlug = req.query.categorySlug as string | undefined;
      const response = await taskService.getCatalogSku(req.params.skuSlug, categorySlug);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getSku');
      next(error);
    }
  }

  async listAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const city = req.query.city as string | undefined;
      const response = await taskService.listServiceAreas(city);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listAreas');
      next(error);
    }
  }

  async checkPinCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pinCode = String(req.query.pinCode || '');
      const city = req.query.city as string | undefined;
      const response = await taskService.checkServicePinCode(pinCode, city);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.checkPinCode');
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
