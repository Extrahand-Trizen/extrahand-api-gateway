import { Router } from 'express';
import { chatController } from '../controllers/ChatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

// Start a chat
router.post('/start', chatController.startChat.bind(chatController));

// Get chat messages
router.get('/:chatId/messages', chatController.getMessages.bind(chatController));

// Send a message
router.post('/:chatId/messages', chatController.sendMessage.bind(chatController));

// Get user chats
router.get('/', chatController.getUserChats.bind(chatController));

export default router;


