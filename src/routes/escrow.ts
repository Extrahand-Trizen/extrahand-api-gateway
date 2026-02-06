import { Router } from 'express';
import { escrowController } from '../controllers/EscrowController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All escrow routes require authentication
router.post('/create', authMiddleware, escrowController.createEscrow.bind(escrowController));
router.get('/status/:escrowId', authMiddleware, escrowController.getEscrowStatus.bind(escrowController));
router.get('/task/:taskId', authMiddleware, escrowController.getEscrowByTaskId.bind(escrowController));
// Escrow release disabled - handled elsewhere
// router.post('/release/:escrowId', authMiddleware, escrowController.releaseEscrow.bind(escrowController));

export default router;


