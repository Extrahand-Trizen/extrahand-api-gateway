import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/UploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Configure multer for memory storage (needed to proxy multipart/form-data)
const multerMemoryStorage = multer.memoryStorage();
const upload = multer({
  storage: multerMemoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (gateway can handle larger than individual services)
  },
  fileFilter: (_req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All upload routes require authentication
router.use(authMiddleware);

// POST /api/v1/uploads/profile-picture - Routes to User Service
router.post('/profile-picture', upload.single('image'), uploadController.uploadProfilePicture.bind(uploadController));

// DELETE /api/v1/uploads/profile-picture - Routes to User Service
router.delete('/profile-picture', uploadController.deleteProfilePicture.bind(uploadController));

// POST /api/v1/uploads/task-image - Routes to Old Backend (Task Service doesn't have this yet)
router.post('/task-image', upload.single('image'), uploadController.uploadTaskImage.bind(uploadController));

// Health check
router.get('/health', uploadController.healthCheck.bind(uploadController));

export default router;

