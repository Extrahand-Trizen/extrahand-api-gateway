import express from 'express';
import multer from 'multer';
import { AdminController } from '../controllers/AdminController.js';
import { adminAuthMiddleware, requireRole } from '../middleware/adminAuth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require admin authentication
router.use(adminAuthMiddleware);

// Bulk upload (Super Admin only)
router.post(
  '/bulk-upload',
  requireRole('super_admin'),
  upload.single('file'),
  AdminController.bulkUploadUsers
);

router.get(
  '/bulk-upload/template',
  requireRole('super_admin'),
  AdminController.getBulkUploadTemplate
);

router.get(
  '/bulk-upload/history',
  requireRole('super_admin'),
  AdminController.getImportHistory
);

router.get(
  '/bulk-upload/:importId',
  requireRole('super_admin'),
  AdminController.getImportDetails
);

router.post(
  '/customer-campaigns/whatsapp',
  requireRole('super_admin'),
  AdminController.sendPromotionalWhatsAppCampaign
);

export default router;

