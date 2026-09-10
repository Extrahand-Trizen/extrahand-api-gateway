import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { validateEnv } from '../config/env.js';

const router = Router();
const env = validateEnv();

router.post(
  '/orders/pickup/verify-qr',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const response = await fetch(
        `${env.QCOMMERCE_SERVICE_URL.replace(/\/$/, '')}/api/v1/partner/orders/pickup/verify-qr`,
        {
          method: 'POST',
          headers: {
            Authorization: String(req.headers.authorization || ''),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        },
      );
      const body = await response.text();
      res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(body);
    } catch (error) {
      handleServiceError(error, res, 'QuickCommercePartnerController.verifyPickupQr');
    }
  },
);

export default router;
