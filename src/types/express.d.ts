import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        token: string | DecodedIdToken; // Can be JWT string (for forwarding) or DecodedIdToken (for internal use)
      };
      requestId?: string;
      startTime?: number;
    }
  }
}

export {};

