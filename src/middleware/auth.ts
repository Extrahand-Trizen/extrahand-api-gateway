import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { verifyAccessToken } from "../lib/tokenVerifier.js";

export async function authMiddleware(
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> {
   const header = req.headers.authorization || "";
   const match = /^Bearer (.+)$/.exec(header);

   if (!match) {
      logger.warn("Authentication: Missing Authorization header", {
         path: req.path,
         method: req.method,
         headers: Object.keys(req.headers),
         authorizationHeader: req.headers.authorization
            ? "present but invalid format"
            : "missing",
      });
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
         "🚨 [API GATEWAY] Authentication Failed: Missing Authorization Header"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📍 Path:", req.path);
      console.log("📍 Method:", req.method);
      console.log("📍 Headers present:", Object.keys(req.headers));
      console.log(
         "📍 Authorization header:",
         req.headers.authorization ? "present but invalid" : "missing"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      res.status(401).json({
         success: false,
         error: "Missing Authorization header",
         details:
            "Please ensure you are logged in and the Authorization header is included in the request",
      });
      return;
   }

   try {
      const idToken = match[1];

      const claims = verifyAccessToken(idToken);
      req.user = {
         uid: claims.uid,
         token: idToken,
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
      console.log("📍 Has Token:", !!match?.[1]);
      console.log("📍 Token Length:", match?.[1]?.length || 0);
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
   const header = req.headers.authorization || "";
   const match = /^Bearer (.+)$/.exec(header);

   if (match) {
      try {
         const idToken = match[1];
         const claims = verifyAccessToken(idToken);
         req.user = {
            uid: claims.uid,
            token: idToken,
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
