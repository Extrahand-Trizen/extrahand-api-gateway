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

  async getBookNowHubCatalog(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const previewLimit =
        req.query.previewLimit !== undefined
          ? Number(req.query.previewLimit)
          : undefined;

      const response = await taskService.getBookNowHubCatalog(
        Number.isFinite(previewLimit) ? previewLimit : undefined,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getBookNowHubCatalog');
    }
  }

  async getBookNowCategoryPackages(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getBookNowCategoryPackages(
        req.params.slug,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getBookNowCategoryPackages');
    }
  }

  async getCategoryContent(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getCatalogCategoryContent(
        req.params.slug,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getCategoryContent');
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

  async getSkuContent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const categorySlug =
        typeof req.query.categorySlug === 'string'
          ? req.query.categorySlug
          : undefined;

      const response = await taskService.getCatalogSkuContent(
        req.params.skuSlug,
        categorySlug,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getSkuContent');
    }
  }

  async resolveSkuContent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const categorySlug = String(req.query.categorySlug || '').trim();
      const taskTitle =
        typeof req.query.taskTitle === 'string'
          ? req.query.taskTitle
          : undefined;
      const skuSlug =
        typeof req.query.skuSlug === 'string'
          ? req.query.skuSlug
          : undefined;

      const response = await taskService.resolveCatalogSkuContent(
        { categorySlug, taskTitle, skuSlug },
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.resolveSkuContent');
    }
  }

  async listHelpSupportCategories(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.listHelpSupportCategories(
        req.params.variant as 'customer' | 'helper',
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listHelpSupportCategories');
    }
  }

  async getHelpSupportCategory(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getHelpSupportCategory(
        req.params.variant as 'customer' | 'helper',
        req.params.categoryKey,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getHelpSupportCategory');
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
