import { Router } from 'express';
import { applicationController } from '../controllers/ApplicationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/applications - Get applications (with query params: mine, taskId, status, etc.)
router.get('/', authMiddleware, applicationController.getApplications.bind(applicationController));

// POST /api/v1/applications - Submit application
router.post('/', authMiddleware, applicationController.submitApplication.bind(applicationController));

// GET /api/v1/applications/:id - Get application by ID
router.get('/:id', authMiddleware, applicationController.getApplication.bind(applicationController));

// PUT /api/v1/applications/:id - Update application status
router.put('/:id', authMiddleware, applicationController.updateApplication.bind(applicationController));

// DELETE /api/v1/applications/:id - Withdraw application
router.delete('/:id', authMiddleware, applicationController.withdrawApplication.bind(applicationController));

export default router;

