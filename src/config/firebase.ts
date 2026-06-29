import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const MOBILE_FIREBASE_APP_NAME = 'extrahand-mobile-firebase';

let primaryAuth: admin.auth.Auth | null = null;
let mobileAuthInstance: admin.auth.Auth | null = null;

function loadCredentialFromEnv(projectId?: string, clientEmail?: string, privateKey?: string) {
  if (!projectId || !clientEmail || !privateKey) return undefined;
  return admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  });
}

function loadCredentialFromFile(candidatePath?: string) {
  if (!candidatePath || !fs.existsSync(candidatePath)) return undefined;
  const serviceAccount = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
  return admin.credential.cert(serviceAccount);
}

function initPrimaryFirebase(): admin.auth.Auth | null {
  let credential: admin.credential.Credential | undefined;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_SERVICE_ACCOUNT_PATH,
  } = process.env;

  try {
    credential =
      loadCredentialFromEnv(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) ??
      loadCredentialFromFile(
        FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '..', '..', 'serviceAccountKey.json'),
      );
    if (credential) {
      logger.info('Firebase primary project initialized from env/file');
    }
  } catch (e) {
    logger.warn('Failed to load primary Firebase credentials from env/file, falling back to ADC');
  }

  if (credential) {
    admin.initializeApp({ credential });
    return admin.auth();
  }

  try {
    admin.initializeApp();
    logger.info('Firebase primary project initialized with Application Default Credentials');
    return admin.auth();
  } catch (error) {
    logger.error('Failed to initialize primary Firebase:', error);
    return null;
  }
}

function initMobileFirebase(): admin.auth.Auth | null {
  const {
    FIREBASE_MOBILE_PROJECT_ID,
    FIREBASE_MOBILE_CLIENT_EMAIL,
    FIREBASE_MOBILE_PRIVATE_KEY,
    FIREBASE_MOBILE_SERVICE_ACCOUNT_PATH,
  } = process.env;

  try {
    const credential =
      loadCredentialFromEnv(
        FIREBASE_MOBILE_PROJECT_ID,
        FIREBASE_MOBILE_CLIENT_EMAIL,
        FIREBASE_MOBILE_PRIVATE_KEY,
      ) ??
      loadCredentialFromFile(
        FIREBASE_MOBILE_SERVICE_ACCOUNT_PATH ||
          path.join(__dirname, '..', '..', 'serviceAccountKey-mobile.json'),
      );

    if (!credential) {
      logger.info(
        'Mobile Firebase project not configured (optional). ' +
          'Set FIREBASE_MOBILE_* or serviceAccountKey-mobile.json for extrahand-ca02c mobile apps.',
      );
      return null;
    }

    admin.initializeApp({ credential }, MOBILE_FIREBASE_APP_NAME);
    logger.info('Firebase mobile project initialized', {
      projectId: FIREBASE_MOBILE_PROJECT_ID || 'from service account file',
    });
    const app = admin.apps.find(
      (app): app is admin.app.App => app != null && app.name === MOBILE_FIREBASE_APP_NAME,
    );
    return app ? admin.auth(app) : null;
  } catch (error) {
    logger.warn('Failed to initialize mobile Firebase project:', error);
    return null;
  }
}

export function initializeFirebase(): void {
  if (primaryAuth) return;

  if (!admin.apps.length) {
    primaryAuth = initPrimaryFirebase();
    mobileAuthInstance = initMobileFirebase();
  } else {
    const existingApp = admin.apps[0];
    if (existingApp) {
      primaryAuth = admin.auth(existingApp);
    }
    mobileAuthInstance = initMobileFirebase();
  }
}

export function getFirebaseAuth(): admin.auth.Auth | null {
  if (!primaryAuth && !mobileAuthInstance) {
    initializeFirebase();
  }
  return primaryAuth || mobileAuthInstance;
}

export function getMobileFirebaseAuth(): admin.auth.Auth | null {
  if (!mobileAuthInstance) {
    initializeFirebase();
  }
  return mobileAuthInstance;
}

export async function verifyFirebaseToken(idToken: string): Promise<{ uid: string }> {
  if (!primaryAuth && !mobileAuthInstance) {
    initializeFirebase();
  }

  if (primaryAuth) {
    try {
      const decodedToken = await primaryAuth.verifyIdToken(idToken);
      return { uid: decodedToken.uid };
    } catch (primaryError) {
      // Fall through to mobile
    }
  }

  if (mobileAuthInstance) {
    try {
      const decodedToken = await mobileAuthInstance.verifyIdToken(idToken);
      return { uid: decodedToken.uid };
    } catch (mobileError) {
      throw new Error('Token verification failed for both primary and mobile Firebase projects');
    }
  }

  throw new Error('Firebase Admin SDK not initialized');
}
