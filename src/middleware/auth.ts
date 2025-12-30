import { Request, Response, NextFunction } from "express";
import mongoose from 'mongoose';
import logger from "../config/logger.js";
import { verifyToken } from "../lib/tokenVerifier.js";
import { ACCESS_COOKIE_NAME } from "../utils/cookies.js";
import { getConnectionStatus } from '../config/database.js';

function getAccessToken(req: Request): string | undefined {
   const header = req.headers.authorization || "";
   const match = /^Bearer (.+)$/.exec(header);
   if (match?.[1]) return match[1];

   const headerToken = req.headers["x-access-token"] as string | undefined;
   if (headerToken) return headerToken;

   const cookieHeader = req.headers.cookie;
   if (cookieHeader) {
      const token = cookieHeader
         .split(";")
         .map((p) => p.trim())
         .find((p) => p.startsWith(`${ACCESS_COOKIE_NAME}=`));
      if (token) {
         const [, value] = token.split("=");
         return decodeURIComponent(value || "");
      }
   }

   const parsedCookies = (req as any).cookies as
      | Record<string, string>
      | undefined;
   if (parsedCookies && parsedCookies[ACCESS_COOKIE_NAME]) {
      return parsedCookies[ACCESS_COOKIE_NAME];
   }

   return undefined;
}

/**
 * Shared helper function to verify token and get user info
 * Used by both authMiddleware and optionalAuthMiddleware
 */
async function verifyTokenAndGetUser(token: string): Promise<{ uid: string; tokenType: string; profileId?: mongoose.Types.ObjectId }> {
  // Log token info (first 20 chars only for security)
  logger.debug('Token Verification: Verifying token', {
    tokenPrefix: token.substring(0, 20) + '...',
    tokenLength: token.length,
  });
  
  // ✨ CRITICAL: Verify the token (supports both backend tokens and Firebase tokens)
  const { uid, tokenType } = await verifyToken(token);
  
  // ✨ Enrich with profileId (ObjectId) for database references
  let profileId: mongoose.Types.ObjectId | undefined;
  
  if (getConnectionStatus()) {
    try {
      // Direct MongoDB query (no model needed) - just get _id for profileId
      const db = mongoose.connection.db;
      if (db) {
        const profilesCollection = db.collection('profiles');
        const profile = await profilesCollection.findOne(
          { uid },
          { projection: { _id: 1 } }
        );
        
        if (profile && profile._id) {
          profileId = profile._id;
          logger.debug('Token Verification: Profile found', {
            uid,
            profileId: profileId.toString(),
          });
        } else {
          logger.debug('Token Verification: Profile not found (new user?)', { uid });
        }
      }
    } catch (error: any) {
      logger.warn('Token Verification: Failed to lookup Profile', {
        uid,
        error: error.message,
      });
      // Continue without profileId - service will handle it
    }
  } else {
    logger.debug('Token Verification: MongoDB not connected, skipping profileId lookup', { uid });
  }
  
  return { uid, tokenType, profileId };
}

export async function authMiddleware(
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> {
   const token = getAccessToken(req);

   if (!token) {
      logger.warn("Authentication: Missing access token", {
         path: req.path,
         method: req.method,
         headers: Object.keys(req.headers),
         hasCookies: Boolean(req.headers.cookie),
      });
      res.status(401).json({
         success: false,
         error: "Missing access token",
         details:
            "Please ensure you are logged in and your cookies or Authorization header are sent with the request",
      });
      return;
   }

  try {
    // ✨ Use shared helper function to verify token and get user info
    const { uid, tokenType, profileId } = await verifyTokenAndGetUser(token);
    
    // ✨ CRITICAL: Store the ORIGINAL JWT string, not the decoded object
    // The User Service expects the raw JWT string in the Authorization header
    req.user = { 
      uid, 
      token: token, // Store the original JWT string, not the decoded object
      profileId, // ✅ ObjectId reference for database operations
    };
    
    logger.info('Authentication: User authenticated', {
      uid,
      tokenType,
      profileId: profileId?.toString() || 'not found',
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
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 [API GATEWAY] Authentication Failed: Token Verification Error');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Path:', req.path);
    console.log('📍 Method:', req.method);
    console.log('📍 Error Code:', error.code);
    console.log('📍 Error Message:', error.message);
    console.log('📍 Has Token:', !!token);
    console.log('📍 Token Length:', token?.length || 0);
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

/**
 * Optional auth middleware for PUBLIC routes
 * 
 * ✅ PUBLIC ACCESS: Users WITHOUT accounts can access these routes
 * ✅ TOKEN VERIFICATION: If token is present, verifies it (same as authMiddleware)
 * ✅ OPTIONAL PERSONALIZATION: If user is authenticated, extracts user info for personalization
 * 
 * Flow:
 * - No token → req.user = undefined → Public access (works for users without accounts)
 * - Token present → Verify token → req.user populated → Personalized access (for logged-in users)
 * - Token invalid → req.user = undefined → Public access (doesn't block, allows access)
 * 
 * Rate limiting should be applied separately based on IP address to prevent abuse
 */
export async function optionalAuthMiddleware(
   req: Request,
   _res: Response,
   next: NextFunction
): Promise<void> {
  const token = getAccessToken(req);

  // ✅ If no token, allow public access (users without accounts)
  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  // ✅ If token is present, verify it using shared helper (same as authMiddleware)
  try {
    // ✨ Use shared helper function to verify token and get user info
    const { uid, tokenType, profileId } = await verifyTokenAndGetUser(token);
    
    // ✨ Store the ORIGINAL JWT string, not the decoded object
    req.user = { 
      uid, 
      token: token, // Store the original JWT string, not the decoded object
      profileId, // ✅ ObjectId reference for database operations
    };
    
    logger.info('Optional Auth: User authenticated', {
      uid,
      tokenType,
      profileId: profileId?.toString() || 'not found',
      path: req.path,
    });
    
    next();
  } catch (error: any) {
    // ✅ Token verification failed - but this is a public route, so allow access without user info
    logger.warn('Optional Auth: Token verification failed, allowing public access', {
      path: req.path,
      method: req.method,
      errorCode: error.code,
      errorMessage: error.message,
      hasToken: !!token,
    });
    
    // Continue without user info (public access)
    req.user = undefined;
    next();
  }
}
