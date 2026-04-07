import { Router } from "express";
import { applicationController } from "../controllers/ApplicationController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /api/v1/applications - Get applications (with query params: mine, taskId, status, etc.)
// Using optionalAuthMiddleware to allow public access to view task applications
router.get(
  "/",
  optionalAuthMiddleware,
  applicationController.getApplications.bind(applicationController)
);

// POST /api/v1/applications - Submit application
router.post(
  "/",
  authMiddleware,
  applicationController.submitApplication.bind(applicationController)
);

// GET /api/v1/applications/:id - Get application by ID
router.get(
  "/:id",
  authMiddleware,
  applicationController.getApplication.bind(applicationController)
);

// PUT /api/v1/applications/:id - Update application status
router.put(
  "/:id",
  authMiddleware,
  applicationController.updateApplication.bind(applicationController)
);

// POST /api/v1/applications/:id/negotiate - Counter/accept/reject negotiation
router.post(
  "/:id/negotiate",
  authMiddleware,
  applicationController.negotiateApplication.bind(applicationController)
);

// POST /api/v1/applications/:id/withdraw-pending - Withdraw pending application
router.post(
  "/:id/withdraw-pending",
  authMiddleware,
  applicationController.withdrawPendingApplication.bind(applicationController)
);

// POST /api/v1/applications/:id/withdraw-accepted - Withdraw accepted application
router.post(
  "/:id/withdraw-accepted",
  authMiddleware,
  applicationController.withdrawAcceptedApplication.bind(applicationController)
);

// DELETE /api/v1/applications/:id - Withdraw application (Legacy)
router.delete(
  "/:id",
  authMiddleware,
  applicationController.withdrawPendingApplication.bind(applicationController)
);

export default router;
