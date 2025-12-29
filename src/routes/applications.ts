import { Router } from "express";
import { applicationController } from "../controllers/ApplicationController.js";

const router = Router();

// GET /api/v1/applications - Get applications (with query params: mine, taskId, status, etc.)
// Note: authMiddleware is applied at app level, so no need to apply here
router.get(
  "/",
  applicationController.getApplications.bind(applicationController)
);

// POST /api/v1/applications - Submit application
router.post(
  "/",
  applicationController.submitApplication.bind(applicationController)
);

// GET /api/v1/applications/:id - Get application by ID
router.get(
  "/:id",
  applicationController.getApplication.bind(applicationController)
);

// PUT /api/v1/applications/:id - Update application status
router.put(
  "/:id",
  applicationController.updateApplication.bind(applicationController)
);

// POST /api/v1/applications/:id/withdraw-pending - Withdraw pending application
router.post(
  "/:id/withdraw-pending",
  applicationController.withdrawPendingApplication.bind(applicationController)
);

// POST /api/v1/applications/:id/withdraw-accepted - Withdraw accepted application
router.post(
  "/:id/withdraw-accepted",
  applicationController.withdrawAcceptedApplication.bind(applicationController)
);

// DELETE /api/v1/applications/:id - Withdraw application (Legacy)
router.delete(
  "/:id",
  applicationController.withdrawPendingApplication.bind(applicationController)
);

export default router;
