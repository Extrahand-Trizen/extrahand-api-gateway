import { Router } from 'express';
import { bookServicesAssistantController } from '../controllers/BookServicesAssistantController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post(
  '/conversations',
  authMiddleware,
  bookServicesAssistantController.createConversation.bind(bookServicesAssistantController),
);
router.get(
  '/conversations/:conversationId',
  authMiddleware,
  bookServicesAssistantController.getConversation.bind(bookServicesAssistantController),
);
router.post(
  '/conversations/:conversationId/messages',
  authMiddleware,
  bookServicesAssistantController.sendMessage.bind(bookServicesAssistantController),
);
router.post(
  '/conversations/:conversationId/end',
  authMiddleware,
  bookServicesAssistantController.endConversation.bind(bookServicesAssistantController),
);

export default router;
