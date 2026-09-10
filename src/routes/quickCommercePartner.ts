import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleServiceError } from '../utils/errorHandler.js';
import { validateEnv } from '../config/env.js';

const router = Router();
const env = validateEnv();

async function proxyQcPartner(
  req: Request,
  res: Response,
  path: string,
  controllerName: string,
): Promise<void> {
  try {
    const response = await fetch(
      `${env.QCOMMERCE_SERVICE_URL.replace(/\/$/, '')}/api/v1/partner${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: String(req.headers.authorization || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body ?? {}),
      },
    );
    const body = await response.text();
    res
      .status(response.status)
      .type(response.headers.get('content-type') || 'application/json')
      .send(body);
  } catch (error) {
    handleServiceError(error, res, controllerName);
  }
}

router.post(
  '/orders/pickup/verify-qr',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await proxyQcPartner(
      req,
      res,
      '/orders/pickup/verify-qr',
      'QuickCommercePartnerController.verifyPickupQr',
    );
  },
);

router.post(
  '/orders/:orderId/complete',
  authMiddleware,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await proxyQcPartner(
      req,
      res,
      `/orders/${encodeURIComponent(String(req.params.orderId))}/complete`,
      'QuickCommercePartnerController.completeOrder',
    );
  },
);

export default router;
