import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { SupplyController } from '../controllers/SupplyController.js';

const router = Router();

router.use(authMiddleware);
router.get('/', SupplyController.proxyPartnerJobs.bind(SupplyController));
router.get('/:taskId', SupplyController.proxyPartnerJobs.bind(SupplyController));
router.post('/:taskId/respond', SupplyController.proxyPartnerJobs.bind(SupplyController));
router.patch('/:taskId/milestone', SupplyController.proxyPartnerJobs.bind(SupplyController));

export default router;
