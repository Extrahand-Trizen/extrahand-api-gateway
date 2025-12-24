import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { verifyAccessToken } from "../lib/tokenVerifier.js";
import { ACCESS_COOKIE_NAME } from "../utils/cookies.js";

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
      const claims = verifyAccessToken(token);
      req.user = {
         uid: claims.uid,
         token,
         sessionId: claims.sessionId,
      };

      logger.info("Authentication: User authenticated", {
         uid: claims.uid,
         path: req.path,
      });
      next();
   } catch (error: any) {
      // Enhanced error logging
      logger.error("Authentication: Token verification failed", {
         path: req.path,
         method: req.method,
         errorMessage: error.message,
         errorStack: error.stack,
         hasToken: !!match?.[1],
         tokenLength: match?.[1]?.length || 0,
      });

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
         "🚨 [API GATEWAY] Authentication Failed: Token Verification Error"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📍 Path:", req.path);
      console.log("📍 Method:", req.method);
      console.log("📍 Error Message:", error.message);
      console.log("📍 Has Token:", !!token);
      console.log("📍 Token Length:", token?.length || 0);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // More detailed error response in development
      const errorMessage =
         process.env.NODE_ENV === "development"
            ? `Invalid token: ${error.message || "Unknown error"}`
            : "Invalid token";

      res.status(401).json({
         success: false,
         error: errorMessage,
         ...(process.env.NODE_ENV === "development" && {
            details: {
               message: error.message,
            },
         }),
      });
   }
}

export async function optionalAuthMiddleware(
   req: Request,
   _res: Response,
   next: NextFunction
): Promise<void> {
   const token = getAccessToken(req);

   if (token) {
      try {
         const claims = verifyAccessToken(token);
         req.user = {
            uid: claims.uid,
            token,
            sessionId: claims.sessionId,
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
