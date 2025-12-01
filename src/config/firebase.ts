import admin from 'firebase-admin';
import { validateEnv } from './env.js';

const env = validateEnv();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const auth = admin.auth();

