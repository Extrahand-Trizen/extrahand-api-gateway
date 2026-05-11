import jwt, { JwtPayload } from "jsonwebtoken";
import { validateEnv } from "../config/env.js";
import logger from "../config/logger.js";
import { verifyFirebaseToken, getFirebaseAuth } from "../config/firebase.js";

const env = validateEnv();

// CRITICAL: ACCESS_TOKEN_SECRET and TOKEN_ISSUER/TOKEN_AUDIENCE must match
// extrahand-user-service exactly. User-service signs the JWT; gateway verifies it.
// If you see "invalid signature", copy ACCESS_TOKEN_SECRET from user-service .env to api-gateway .env.

interface AccessTokenClaims extends JwtPayload {
   sub: string;
   sid: string;
}

/**
 * Verify backend-issued access token (HS256)
 */
export function verifyAccessToken(token: string): {
   uid: string;
   sessionId: string;
} {
   try {
      const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
         issuer: env.TOKEN_ISSUER,
         audience: env.TOKEN_AUDIENCE,
      }) as AccessTokenClaims;

      if (!payload.sub || !payload.sid) {
         throw new Error("Missing claims");
      }

      return { uid: payload.sub, sessionId: payload.sid };
   } catch (error) {
      // Local/dev resiliency: accept validly signed backend tokens even when
      // issuer/audience env values are mismatched between services.
      if (env.NODE_ENV !== "production") {
         try {
            const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenClaims;
            if (payload?.sub && payload?.sid) {
               logger.warn("Gateway access token verified with relaxed dev mode checks", {
                  reason: (error as Error).message,
               });
               return { uid: payload.sub, sessionId: payload.sid };
            }
         } catch {
            // Fall through to original error handling.
         }
      }
      logger.warn("Gateway access token verification failed", {
         error: (error as Error).message,
      });
      throw error;
   }
}

/**
 * Verify token - supports both Firebase ID tokens and backend access tokens
 * Tries backend token first, then Firebase token if backend verification fails
 */
export async function verifyToken(token: string): Promise<{
   uid: string;
   sessionId?: string;
   tokenType: 'backend' | 'firebase';
}> {
   // First, try to verify as backend token (HS256)
   try {
      const result = verifyAccessToken(token);
      return {
         uid: result.uid,
         sessionId: result.sessionId,
         tokenType: 'backend',
      };
   } catch (backendError) {
      // If backend token verification fails, try Firebase token (RS256)
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
         // Firebase not initialized - can't verify Firebase tokens
         throw new Error('Token verification failed: neither backend token nor Firebase token (Firebase not initialized)');
      }

      try {
         const result = await verifyFirebaseToken(token);
         return {
            uid: result.uid,
            tokenType: 'firebase',
         };
      } catch (firebaseError) {
         // Both failed - throw a combined error
         logger.warn('Token verification failed for both backend and Firebase tokens', {
            backendError: (backendError as Error).message,
            firebaseError: (firebaseError as Error).message,
         });
         throw new Error('Invalid token: not a valid backend token or Firebase token');
      }
   }
}
