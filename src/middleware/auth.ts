import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { verifyToken } from "../lib/tokenVerifier.js";
import { ACCESS_COOKIE_NAME } from "../utils/cookies.js";
import { userService } from '../services/userService.js';

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
 * Shared helper: verify token and get user info.
 * profileId is resolved only via user-service (no DB in gateway).
 */
async function verifyTokenAndGetUser(token: string): Promise<{ uid: string; tokenType: string; profileId?: string }> {
  logger.debug('Token Verification: Verifying token', {
    tokenPrefix: token.substring(0, 20) + '...',
    tokenLength: token.length,
  });

  const { uid, tokenType } = await verifyToken(token);

  // Resolve profileId from user-service only (single source of truth)
  let profileId: string | undefined;
  try {
    const userToken = { uid, token };
    const response = await userService.getCurrentProfile(userToken);
    const data = response?.data as any;
    const profileDoc = data?.data ?? data;
    const id = profileDoc?._id ?? profileDoc?.id;
    if (id != null) {
      profileId = typeof id === 'string' ? id : String(id);
      logger.debug('Token Verification: Profile resolved via user-service', {
        uid,
        profileId,
      });
    }
  } catch (err: any) {
    logger.debug('Token Verification: User-service profile lookup failed (user may need onboarding)', {
      uid,
      status: err?.response?.status ?? err?.status,
      message: err?.message ?? err?.response?.data?.error,
    });
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

    req.user = {
      uid,
      token,
      profileId,
    } as Express.Request['user'];

    logger.info('Authentication: User authenticated', {
      uid,
      tokenType,
      profileId: profileId ?? 'not found',
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

    req.user = {
      uid,
      token,
      profileId,
    } as Express.Request['user'];

    logger.info('Optional Auth: User authenticated', {
      uid,
      tokenType,
      profileId: profileId ?? 'not found',
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
