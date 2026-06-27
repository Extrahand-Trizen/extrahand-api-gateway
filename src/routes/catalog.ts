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
  '/categories/:slug',
  optionalAuthMiddleware,
  catalogController.getCategory.bind(catalogController),
);
router.get(
  '/skus/:skuSlug',
  optionalAuthMiddleware,
  catalogController.getSku.bind(catalogController),
);
router.get(
  '/areas/check',
  optionalAuthMiddleware,
  catalogController.checkPinCode.bind(catalogController),
);

export default router;
