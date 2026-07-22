import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        token: string | DecodedIdToken;
        sessionId?: string;
        profileId?: string; // Profile ID from user-service, forwarded as X-Profile-Id
      };
      requestId?: string;
      startTime?: number;
    }
  }
}

export {};
