import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/taskService.js';
import { couponService } from '../services/couponService.js';
import { handleServiceError } from '../utils/errorHandler.js';

function catalogLocationQuery(query: Request['query']) {
  return {
    area: typeof query.area === 'string' ? query.area : undefined,
    city: typeof query.city === 'string' ? query.city : undefined,
    state: typeof query.state === 'string' ? query.state : undefined,
    pinCode: typeof query.pinCode === 'string' ? query.pinCode : undefined,
    coordinates: typeof query.coordinates === 'string' ? query.coordinates : undefined,
  };
}

export class CatalogController {
  async getCustomerHomeContent(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service,coupon-service');
      const location = catalogLocationQuery(req.query);
      const previewLimit = Number(req.query.previewLimit);
      const [featuredResponse, promotionsResponse, couponsResponse] = await Promise.all([
        taskService.getBookNowHubCatalog(
          Number.isFinite(previewLimit) && previewLimit > 0 ? previewLimit : 8,
          req.user ?? null,
          location,
          true,
        ),
        taskService.listCustomerHomePromotions(req.user ?? null),
        couponService.listHomeOffers(req.user ?? null),
      ]);
      const featuredPayload = featuredResponse.data as { data?: unknown } | undefined;
      const promotionsPayload = promotionsResponse.data as { data?: unknown } | undefined;
      const couponsPayload = couponsResponse.data as { data?: unknown } | undefined;
      const featuredServices = featuredPayload?.data;
      const promotions = promotionsPayload?.data;
      const couponOffers = couponsPayload?.data;
      if (!Array.isArray(featuredServices) || !Array.isArray(promotions) || !Array.isArray(couponOffers)) {
        throw new Error('A customer home content service returned an invalid response.');
      }
      res.status(200).json({
        success: true,
        data: { featuredServices, promotions, couponOffers },
      });
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getCustomerHomeContent');
    }
  }

  async getBookNowHomeCategories(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      const response = await taskService.getBookNowHomeCategories(req.user ?? null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getBookNowHomeCategories');
    }
  }

  async listCustomerHomePromotions(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');
      const response = await taskService.listCustomerHomePromotions(req.user ?? null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listCustomerHomePromotions');
    }
  }

  async listHomeCouponOffers(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'coupon-service');
      const response = await couponService.listHomeOffers(req.user ?? null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listHomeCouponOffers');
    }
  }

  async getBookNowAvailability(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getBookNowAvailability(
        catalogLocationQuery(req.query),
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getBookNowAvailability');
    }
  }

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
        {
          area: typeof req.query.area === 'string' ? req.query.area : undefined,
          city: typeof req.query.city === 'string' ? req.query.city : undefined,
          state: typeof req.query.state === 'string' ? req.query.state : undefined,
          pinCode: typeof req.query.pinCode === 'string' ? req.query.pinCode : undefined,
          coordinates: typeof req.query.coordinates === 'string' ? req.query.coordinates : undefined,
        },
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getCategory');
    }
  }

  async getHourlyHelperSkusByCategoryId(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getHourlyHelperSkusByCategoryId(
        typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
        req.user ?? null,
        {
          area: typeof req.query.area === 'string' ? req.query.area : undefined,
          city: typeof req.query.city === 'string' ? req.query.city : undefined,
          state: typeof req.query.state === 'string' ? req.query.state : undefined,
          pinCode: typeof req.query.pinCode === 'string' ? req.query.pinCode : undefined,
          coordinates: typeof req.query.coordinates === 'string' ? req.query.coordinates : undefined,
        },
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getHourlyHelperSkusByCategoryId');
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
      const featuredOnly = req.query.featuredOnly === 'true';
      const includeLocationPricing = req.query.includeLocationPricing !== 'false';

      const response = await taskService.getBookNowHubCatalog(
        Number.isFinite(previewLimit) ? previewLimit : undefined,
        req.user ?? null,
        catalogLocationQuery(req.query),
        featuredOnly,
        includeLocationPricing,
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
        catalogLocationQuery(req.query),
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getBookNowCategoryPackages');
    }
  }

  async getBookNowLocationQuote(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const response = await taskService.getBookNowLocationQuote(req.body ?? {}, req.user ?? null);
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.getBookNowLocationQuote');
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
  async listBanners(
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      res.setHeader('X-Served-By', 'api-gateway');
      res.setHeader('X-Target-Service', 'task-service');

      const placement = typeof req.query.placement === 'string' ? req.query.placement : undefined;
      const activeOnly = req.query.activeOnly !== 'false';

      const response = await taskService.getBanners(
        placement,
        activeOnly,
        req.user ?? null,
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      handleServiceError(error, res, 'CatalogController.listBanners');
    }
  }
}

export const catalogController = new CatalogController();
