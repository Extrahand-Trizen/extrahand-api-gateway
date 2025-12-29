import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        token: string | DecodedIdToken; // Can be JWT string (for forwarding) or DecodedIdToken (for internal use)
        profileId?: mongoose.Types.ObjectId; // ObjectId reference to Profile for database operations
      };
      requestId?: string;
      startTime?: number;
    }
  }
}

export {};

