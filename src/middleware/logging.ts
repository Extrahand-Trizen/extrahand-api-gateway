import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/requestId.js';
import logger from '../config/logger.js';

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID
  req.requestId = generateRequestId();
  req.startTime = Date.now();

  // Set request ID in response header
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Gateway', 'extrahand-api-gateway'); // ✅ Clear indicator
  res.setHeader('X-Gateway-Version', '1.0.0');

  // ✅ Clear console banner for API Gateway
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚪 [API GATEWAY] Request Received');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`📍 Request ID: ${req.requestId}`);
  console.log(`📍 User ID: ${req.user?.uid || 'Not authenticated'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Log request
  logger.info('Request received', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    
    // ✅ Clear console banner for completion
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [API GATEWAY] Request Completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Status: ${res.statusCode}`);
    console.log(`📍 Duration: ${duration}ms`);
    console.log(`📍 Request ID: ${req.requestId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.uid,
    });
  });

  next();
}

