import { Router } from 'express';
import { profileController } from '../controllers/ProfileController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get current user profile
router.get('/me', authMiddleware, profileController.getCurrentProfile.bind(profileController));

// Get profile by ID
router.get('/:userId', authMiddleware, profileController.getProfile.bind(profileController));

// Update profile
router.put('/:userId', authMiddleware, profileController.updateProfile.bind(profileController));

// Upsert profile (create or update)
router.post('/', authMiddleware, profileController.upsertProfile.bind(profileController));

// Search profiles
router.get('/search', authMiddleware, profileController.searchProfiles.bind(profileController));

// Delete profile
router.delete('/me', authMiddleware, profileController.deleteProfile.bind(profileController));

export default router;

