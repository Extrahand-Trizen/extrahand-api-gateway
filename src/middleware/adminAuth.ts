import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/tokenVerifier.js';
import logger from '../config/logger.js';

export interface AdminRequest extends Request {
  adminToken?: {
    uid: string;
    token: string;
    role?: string;
  };
}

export const adminAuthMiddleware = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Admin token required'
      });
      return;
    }

    // ✅ Use verifyAccessToken instead of Firebase Admin SDK
    const { uid } = verifyAccessToken(token);
    
    // TODO: Check admin status in User Service or Admin Service
    // For now, we'll just verify the token and attach it
    // In production, you should check if the user is an admin
    
    req.adminToken = {
      uid,
      token,
      role: 'super_admin' // TODO: Get from admin service or profile
    };

    next();
  } catch (error: any) {
    logger.error('Admin auth failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid admin token'
    });
    return;
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.adminToken || !allowedRoles.includes(req.adminToken.role || '')) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.adminToken?.role
      });
      return;
    }
    next();
  };
};

