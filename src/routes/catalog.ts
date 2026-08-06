import { Router } from 'express';
import { catalogController } from '../controllers/CatalogController.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

router.get(
  '/categories',
  optionalAuthMiddleware,
  catalogController.listCategories.bind(catalogController),
);
router.get(
  '/book-now/hub',
  optionalAuthMiddleware,
  catalogController.getBookNowHubCatalog.bind(catalogController),
);
router.get(
  '/categories/:slug/packages',
  optionalAuthMiddleware,
  catalogController.getBookNowCategoryPackages.bind(catalogController),
);
router.get(
  '/categories/:slug/content',
  optionalAuthMiddleware,
  catalogController.getCategoryContent.bind(catalogController),
);
router.get(
  '/categories/:slug',
  optionalAuthMiddleware,
  catalogController.getCategory.bind(catalogController),
);
router.get(
  '/skus/content/resolve',
  optionalAuthMiddleware,
  catalogController.resolveSkuContent.bind(catalogController),
);
router.get(
  '/skus/:skuSlug',
  optionalAuthMiddleware,
  catalogController.getSku.bind(catalogController),
);
router.get(
  '/skus/:skuSlug/content',
  optionalAuthMiddleware,
  catalogController.getSkuContent.bind(catalogController),
);
router.get(
  '/help-support/:variant',
  optionalAuthMiddleware,
  catalogController.listHelpSupportCategories.bind(catalogController),
);
router.get(
  '/help-support/:variant/:categoryKey',
  optionalAuthMiddleware,
  catalogController.getHelpSupportCategory.bind(catalogController),
);
router.get(
  '/areas/check',
  optionalAuthMiddleware,
  catalogController.checkPinCode.bind(catalogController),
);

export default router;
