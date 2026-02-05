import { Router } from 'express';
import { profileController } from '../controllers/ProfileController.js';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../config/logger.js';
// Note: authMiddleware is applied both at app level AND on individual routes for extra security

const router = Router();

// ✨ Log route registration for debugging
logger.info('📋 [Profiles Router] Registering routes:', {
  'GET /me': 'getCurrentProfile',
  'GET /search': 'searchProfiles',
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

// Get current user profile (must come before /:userId)
router.get('/me', authMiddleware, profileController.getCurrentProfile.bind(profileController));

// Delete profile (must come before /:userId)
router.delete('/me', authMiddleware, profileController.deleteProfile.bind(profileController));

// Update current user profile (must come before /:userId)
router.put('/me', authMiddleware, profileController.updateProfile.bind(profileController));

// Get profile by ID (parameterized route - must come last, public access allowed)
router.get('/:userId/stats', profileController.getProfileStats.bind(profileController));

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

// Upsert profile (create or update)
router.post('/', authMiddleware, profileController.upsertProfile.bind(profileController));

export default router;

