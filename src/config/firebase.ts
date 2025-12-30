import admin from 'firebase-admin';
import logger from './logger.js';

let auth: admin.auth.Auth | null = null;

/**
 * Initialize Firebase Admin SDK
 * Supports both explicit credentials and default credentials (for production)
 */
export function initializeFirebase(): void {
  if (auth) {
    return; // Already initialized
  }

  try {
    // Check if Firebase credentials are provided via environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (projectId && privateKey && clientEmail) {
      // Initialize with explicit credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
      logger.info('Firebase Admin SDK initialized with explicit credentials');
    } else {
      // Try to initialize with default credentials (for production environments)
      // This works if running on GCP or if GOOGLE_APPLICATION_CREDENTIALS is set
      try {
        admin.initializeApp();
        logger.info('Firebase Admin SDK initialized with default credentials');
      } catch (defaultError) {
        logger.warn('Firebase Admin SDK not initialized - Firebase token verification will be disabled', {
          error: (defaultError as Error).message,
          hint: 'Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL to enable Firebase token verification',
        });
        return;
      }
    }

    auth = admin.auth();
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK', {
      error: (error as Error).message,
    });
    // Don't throw - allow the app to continue without Firebase (backend tokens will still work)
  }
}

/**
 * Get Firebase Auth instance
 * Returns null if Firebase is not initialized
 */
export function getFirebaseAuth(): admin.auth.Auth | null {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

/**
 * Verify Firebase ID token
 */
export async function verifyFirebaseToken(idToken: string): Promise<{ uid: string }> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }

  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  return { uid: decodedToken.uid };
}
