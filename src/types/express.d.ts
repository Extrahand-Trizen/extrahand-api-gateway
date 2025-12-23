import { Request } from "express";

declare global {
   namespace Express {
      interface Request {
         user?: {
            uid: string;
            token: string;
            sessionId?: string;
         };
         requestId?: string;
         startTime?: number;
      }
   }
}

export {};
