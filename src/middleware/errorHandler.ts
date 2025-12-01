import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    userId: req.user?.uid,
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
}

