import { Router } from 'express';
import { profileController } from '../controllers/ProfileController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import logger from '../config/logger.js';
// Note: authMiddleware is applied both at app level AND on individual routes for extra security

const router = Router();

// ✨ Log route registration for debugging
logger.info('📋 [Profiles Router] Registering routes:', {
  'GET /me': 'getCurrentProfile',
  'GET /search': 'searchProfiles',
  'GET /public/id/:profileId': 'getPublicProfileByObjectId',
  'GET /public/:uid': 'getPublicProfile',
  'GET /:userId': 'getProfile',
  'PUT /me': 'updateProfile (current user)',
  'PUT /:userId': 'updateProfile (by ID)',
  'POST /': 'upsertProfile',
  'DELETE /me': 'deleteProfile'
});

// ✨ CRITICAL: Specific routes MUST come before parameterized routes
// Order matters in Express - routes are matched in the order they are defined

// Search profiles (must come before /:userId)
router.get('/search', authMiddleware, profileController.searchProfiles.bind(profileController));

// Nearby helpers — find taskers near the caller's location (must come before /:userId)
router.get('/nearby-helpers', authMiddleware, profileController.getNearbyHelpers.bind(profileController));

router.post(
  '/location-notify',
  authMiddleware,
  profileController.createLocationNotifyRequest.bind(profileController),
);
router.get(
  '/location-notify/me',
  authMiddleware,
  profileController.getLocationNotifyRequestStatus.bind(profileController),
);

router.post(
  '/instant-services-notify',
  authMiddleware,
  profileController.createInstantServicesNotifyRequest.bind(profileController),
);
router.get(
  '/instant-services-notify/me',
  authMiddleware,
  profileController.getInstantServicesNotifyRequestStatus.bind(profileController),
);

// Get current user profile (must come before /:userId)
router.get('/me', authMiddleware, profileController.getCurrentProfile.bind(profileController));

// Delete profile (must come before /:userId)
router.delete('/me', authMiddleware, profileController.deleteProfile.bind(profileController));

// Update current user profile (must come before /:userId)
router.put('/me', authMiddleware, profileController.updateProfile.bind(profileController));

// Category alerts (must come before /:userId)
router.get('/me/category-alerts', authMiddleware, profileController.getCategoryAlerts.bind(profileController));
router.put('/me/category-alerts', authMiddleware, profileController.updateCategoryAlerts.bind(profileController));

// Keyword alerts (must come before /:userId)
router.get('/me/keyword-alerts', authMiddleware, profileController.getKeywordAlerts.bind(profileController));
router.put('/me/keyword-alerts', authMiddleware, profileController.updateKeywordAlerts.bind(profileController));

// Get profile by ID (parameterized route - must come last, public access allowed)
router.get('/:userId/stats', profileController.getProfileStats.bind(profileController));

// Public profile routes — optional auth so visibility rules can use viewer identity
// IMPORTANT: /public/* must come before /:userId to avoid route conflicts
router.get(
  '/public/id/:profileId',
  optionalAuthMiddleware,
  profileController.getPublicProfileByObjectId.bind(profileController)
);
router.get(
  '/public/:uid',
  optionalAuthMiddleware,
  profileController.getPublicProfile.bind(profileController)
);

// Get profile by ID (parameterized route - must come last, public access allowed)
router.get('/:userId', profileController.getProfile.bind(profileController));

// Update profile by ID (parameterized route - must come last)
router.put('/:userId', authMiddleware, profileController.updateProfile.bind(profileController));

// Address Management Routes (must come after /me routes)
router.get('/me/addresses', authMiddleware, profileController.getAddresses.bind(profileController));
router.post('/me/addresses', authMiddleware, profileController.addAddress.bind(profileController));
router.put('/me/addresses/:addressId', authMiddleware, profileController.updateAddress.bind(profileController));
router.patch('/me/addresses/:addressId/default', authMiddleware, profileController.setDefaultAddress.bind(profileController));
router.delete('/me/addresses/:addressId', authMiddleware, profileController.deleteAddress.bind(profileController));

// Profile Stats Routes (must come after /me routes)
router.get('/me/stats', authMiddleware, profileController.getMyStats.bind(profileController));
router.post('/me/stats/recalculate', authMiddleware, profileController.recalculateStats.bind(profileController));

// Check phone availability (must come before /:userId)
router.post('/check-phone', authMiddleware, profileController.checkPhoneAvailability.bind(profileController));

// Change phone number after OTP verification (must come before /:userId)
router.put('/change-phone', authMiddleware, profileController.changePhone.bind(profileController));

router.post('/alternate-phone/send-otp', authMiddleware, profileController.sendAlternatePhoneOtp.bind(profileController));
router.post('/alternate-phone/verify', authMiddleware, profileController.verifyAlternatePhoneOtp.bind(profileController));
router.post('/alternate-phone/verify-firebase', profileController.verifyAlternatePhoneFirebase.bind(profileController));
router.delete('/alternate-phone', authMiddleware, profileController.removeAlternatePhone.bind(profileController));

// Upsert profile (create or update)
router.post('/', authMiddleware, profileController.upsertProfile.bind(profileController));

export default router;

