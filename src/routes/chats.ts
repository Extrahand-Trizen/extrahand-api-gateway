import { Router } from 'express';
import { chatController } from '../controllers/ChatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All chat routes require authentication
router.use(authMiddleware);

// Start a chat
router.post('/start', chatController.startChat.bind(chatController));

// Start a task-based chat (with permission validation)
router.post('/task/:taskId/start', chatController.startChatForTask.bind(chatController));
router.get('/task/:taskId', chatController.getTaskChatForUser.bind(chatController));

// List user chats — must be registered before /:chatId routes
router.get('/', chatController.getUserChats.bind(chatController));

// Get chat messages
router.get('/:chatId/messages', chatController.getMessages.bind(chatController));

// Get chat details
router.get('/:chatId', chatController.getChatById.bind(chatController));

// Send a message
router.post('/:chatId/messages', chatController.sendMessage.bind(chatController));

// Mark chat as read
router.post('/:chatId/read', chatController.markChatAsRead.bind(chatController));

// Delete a chat
router.delete('/:chatId', chatController.deleteChat.bind(chatController));

export default router;


