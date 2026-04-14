import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/auth.js';
import { inquiryController } from '../controllers/InquiryController.js';

const router = Router();

router.post(
  '/',
  optionalAuthMiddleware,
  inquiryController.createInquiry.bind(inquiryController),
);

export default router;

