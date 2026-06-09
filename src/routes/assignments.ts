import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { assignmentController } from '../controllers/AssignmentController.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/pending', assignmentController.listPending.bind(assignmentController));
router.post('/assign', assignmentController.assignHelper.bind(assignmentController));

export default router;
