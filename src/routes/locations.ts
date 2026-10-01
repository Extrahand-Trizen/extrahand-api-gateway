import { Router, Request, Response } from 'express';
import { adminService } from '../services/adminService.js';
import logger from '../config/logger.js';

const router = Router();

router.get('/active', async (_req: Request, res: Response) => {
  try {
    const response = await adminService.getPartnerRegistrationLocations();
    res.setHeader('Cache-Control', 'no-store');
    res.status(response.status).json(response.data);
  } catch (error) {
    const upstream = error as { status?: number };
    logger.error('Partner registration location proxy failed:', error);
    res.status(upstream.status || 503).json({ success: false, error: 'Location service is unavailable' });
  }
});

export default router;