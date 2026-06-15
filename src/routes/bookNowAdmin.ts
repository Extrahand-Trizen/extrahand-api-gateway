import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { SupplyController } from '../controllers/SupplyController.js';

const router = Router();

router.use(authMiddleware);
router.get('/assignments/pending', SupplyController.proxyBookNowAdmin.bind(SupplyController));
router.post('/assignments/assign', SupplyController.proxyBookNowAdmin.bind(SupplyController));

export default router;
