import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { verifyToken } from "../lib/tokenVerifier.js";
import { getCachedProfileId, setCachedProfileId } from "../lib/profileIdCache.js";
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

function extractProfileIdFromResponse(data: unknown): string | undefined {
   const root = data as Record<string, unknown> | null | undefined;
   const profileDoc = (root?.data ?? root) as Record<string, unknown> | null | undefined;
   const id = profileDoc?._id ?? profileDoc?.id;
   if (id == null) return undefined;
   return typeof id === 'string' ? id : String(id);
}

/**
 * Resolve profileId: JWT `pid` claim → in-memory cache → lightweight user-service lookup.
 */
async function resolveProfileId(
  uid: string,
  token: string,
  jwtProfileId?: string,
): Promise<string | undefined> {
  if (jwtProfileId) {
    setCachedProfileId(uid, jwtProfileId);
    return jwtProfileId;
  }

  const cached = getCachedProfileId(uid);
  if (cached) {
    return cached;
  }

  try {
    const response = await userService.getCurrentProfile({ uid, token });
    const profileId = extractProfileIdFromResponse(response?.data);
    if (profileId) {
      setCachedProfileId(uid, profileId);
      logger.debug('Profile ID resolved via user-service fallback', { uid, profileId });
    }
    return profileId;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number }; status?: number; message?: string };
    logger.debug('User-service profile lookup failed (user may need onboarding)', {
      uid,
      status: error?.response?.status ?? error?.status,
      message: error?.message,
    });
    return undefined;
  }
}

/**
 * Shared helper: verify token and resolve user + profileId.
 */
async function verifyTokenAndGetUser(token: string): Promise<{ uid: string; tokenType: string; profileId?: string }> {
  logger.debug('Token Verification: Verifying token', {
    tokenPrefix: token.substring(0, 20) + '...',
    tokenLength: token.length,
  });

  const { uid, tokenType, profileId: jwtProfileId } = await verifyToken(token);
  const profileId = await resolveProfileId(uid, token, jwtProfileId);

  return { uid, tokenType, profileId };
}

export async function authMiddleware(
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> {
   // Idempotent: skip if a prior auth layer already populated the user (safety net).
   if (req.user?.uid && req.user?.token) {
      next();
      return;
   }

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
    logger.error('Authentication: Token verification failed', {
      path: req.path,
      method: req.method,
      errorCode: error.code,
      errorMessage: error.message,
      errorStack: error.stack,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });
    
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
 */
export async function optionalAuthMiddleware(
   req: Request,
   _res: Response,
   next: NextFunction
): Promise<void> {
  const token = getAccessToken(req);

  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  if (req.user?.uid && req.user?.token) {
    next();
    return;
  }

  try {
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
    logger.warn('Optional Auth: Token verification failed, allowing public access', {
      path: req.path,
      method: req.method,
      errorCode: error.code,
      errorMessage: error.message,
      hasToken: !!token,
    });
    
    req.user = undefined;
    next();
  }
}
