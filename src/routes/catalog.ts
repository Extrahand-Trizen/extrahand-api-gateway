import { Router } from 'express';
import { catalogController } from '../controllers/CatalogController.js';

const router = Router();

router.get('/categories', catalogController.listCategories.bind(catalogController));
router.get('/categories/:slug', catalogController.getCategory.bind(catalogController));
router.get('/skus/:skuSlug', catalogController.getSku.bind(catalogController));
router.get('/areas', catalogController.listAreas.bind(catalogController));
router.get('/areas/check', catalogController.checkPinCode.bind(catalogController));

export default router;
