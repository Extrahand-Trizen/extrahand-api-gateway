import jwt, { JwtPayload } from "jsonwebtoken";
import { validateEnv } from "../config/env.js";
import logger from "../config/logger.js";

const env = validateEnv();

interface AccessTokenClaims extends JwtPayload {
   sub: string;
   sid: string;
}

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
      logger.warn("Gateway access token verification failed", {
         error: (error as Error).message,
      });
      throw error;
   }
}
