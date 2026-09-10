import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import { validateEnv } from '../config/env.js';
import logger from '../config/logger.js';

const router = Router();
const env = validateEnv();
const QC_BASE = env.QUICK_COMMERCE_SERVICE_URL;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Proxy all /api/v1/qc/* requests to Quick Commerce service.
 * Strips /qc prefix: /api/v1/qc/categories → /api/v1/categories
 *
 * Auth tokens are forwarded as-is:
 * - QC admin JWT for admin portal routes
 * - Platform user-service JWT for seller routes
 */
async function proxyToQc(req: Request, res: Response, next: NextFunction) {
  try {
    const originalUrl = req.originalUrl || req.url;
    const qcPath = originalUrl.replace(/^\/api\/v1\/qc/, '/api/v1').split('?')[0];
    const targetUrl = `${QC_BASE}${qcPath}`;

    const headers: Record<string, string> = {
      'X-Service-Auth': env.SERVICE_AUTH_TOKEN,
      'X-Service-Name': 'api-gateway',
    };

    const authHeader = req.headers.authorization;
    if (authHeader) headers.Authorization = authHeader as string;
    if (req.headers['x-user-id']) headers['X-User-Id'] = req.headers['x-user-id'] as string;
    if (req.headers['x-profile-id']) headers['X-Profile-Id'] = req.headers['x-profile-id'] as string;

    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');

    if (isMultipart && (req as Request & { file?: Express.Multer.File }).file) {
      const form = new FormData();
      const file = (req as Request & { file: Express.Multer.File }).file;
      form.append(file.fieldname || 'file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      Object.entries(req.body || {}).forEach(([key, val]) => {
        if (val != null) form.append(key, String(val));
      });

      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: form,
        headers: { ...headers, ...form.getHeaders() },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
        validateStatus: () => true,
      });
      return res.status(response.status).json(response.data);
    }

    if (isMultipart && (req as Request & { files?: Express.Multer.File[] }).files) {
      const form = new FormData();
      const files = (req as Request & { files: Express.Multer.File[] }).files;
      files.forEach((f) => {
        form.append(f.fieldname || 'file', f.buffer, {
          filename: f.originalname,
          contentType: f.mimetype,
        });
      });
      Object.entries(req.body || {}).forEach(([key, val]) => {
        if (val != null) form.append(key, String(val));
      });

      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: form,
        headers: { ...headers, ...form.getHeaders() },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
        validateStatus: () => true,
      });
      return res.status(response.status).json(response.data);
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      params: req.query,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('QC proxy request failed', {
      path: req.originalUrl,
      status: axiosError.response?.status,
      message: axiosError.message,
    });
    if (axiosError.response) {
      return res.status(axiosError.response.status).json(axiosError.response.data);
    }
    return next(error);
  }
}

// Multipart upload routes
router.post(
  '/master-products/upload-image',
  upload.single('image'),
  proxyToQc
);
router.post(
  '/sellers/documents/upload',
  upload.single('document'),
  proxyToQc
);

// Catch-all proxy for all QC routes
router.all('/*', proxyToQc);

export default router;
