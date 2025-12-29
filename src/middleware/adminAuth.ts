import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
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
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Admin token required'
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    // TODO: Check admin status in User Service or Admin Service
    // For now, we'll just verify the token and attach it
    // In production, you should check if the user is an admin
    
    req.adminToken = {
      uid: decodedToken.uid,
      token,
      role: 'super_admin' // TODO: Get from admin service or profile
    };

    next();
  } catch (error: any) {
    logger.error('Admin auth failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid admin token'
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.adminToken || !allowedRoles.includes(req.adminToken.role || '')) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.adminToken?.role
      });
    }
    next();
  };
};

