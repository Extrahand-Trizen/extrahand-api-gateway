import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import logger from '../config/logger.js';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  
  if (!match) {
    logger.warn('Authentication: Missing Authorization header', {
      path: req.path,
      method: req.method,
      headers: Object.keys(req.headers),
      authorizationHeader: req.headers.authorization ? 'present but invalid format' : 'missing',
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 [API GATEWAY] Authentication Failed: Missing Authorization Header');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Path:', req.path);
    console.log('📍 Method:', req.method);
    console.log('📍 Headers present:', Object.keys(req.headers));
    console.log('📍 Authorization header:', req.headers.authorization ? 'present but invalid' : 'missing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    res.status(401).json({ 
      success: false,
      error: 'Missing Authorization header',
      details: 'Please ensure you are logged in and the Authorization header is included in the request'
    });
    return;
  }

  try {
    const idToken = match[1];
    
    // Log token info (first 20 chars only for security)
    logger.debug('Authentication: Verifying token', {
      path: req.path,
      method: req.method,
      tokenPrefix: idToken.substring(0, 20) + '...',
      tokenLength: idToken.length,
    });
    
    // ✨ CRITICAL: Verify the token first
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // ✨ CRITICAL: Store the ORIGINAL JWT string, not the decoded object
    // The User Service expects the raw JWT string in the Authorization header
    req.user = { 
      uid: decodedToken.uid, 
      token: idToken // Store the original JWT string, not the decoded object
    };
    
    logger.info('Authentication: User authenticated', {
      uid: decodedToken.uid,
      path: req.path,
      tokenStored: 'JWT string (original)',
    });
    next();
  } catch (error: any) {
    // Enhanced error logging
    logger.error('Authentication: Token verification failed', {
      path: req.path,
      method: req.method,
      errorCode: error.code,
      errorMessage: error.message,
      errorStack: error.stack,
      hasToken: !!match?.[1],
      tokenLength: match?.[1]?.length || 0,
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 [API GATEWAY] Authentication Failed: Token Verification Error');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Path:', req.path);
    console.log('📍 Method:', req.method);
    console.log('📍 Error Code:', error.code);
    console.log('📍 Error Message:', error.message);
    console.log('📍 Has Token:', !!match?.[1]);
    console.log('📍 Token Length:', match?.[1]?.length || 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // More detailed error response in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Invalid token: ${error.message || error.code || 'Unknown error'}`
      : 'Invalid token';
    
    res.status(401).json({ 
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          code: error.code,
          message: error.message,
        }
      })
    });
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  
  if (match) {
    try {
      const idToken = match[1];
      const token = await auth.verifyIdToken(idToken);
      req.user = { 
        uid: token.uid, 
        token 
      };
    } catch (error) {
      // Invalid token - continue without user
      req.user = undefined;
    }
  } else {
    req.user = undefined;
  }
  
  next();
}

