import { Router } from 'express';
import { taskController } from '../controllers/TaskController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get all tasks (with filters)
router.get('/', authMiddleware, taskController.getTasks.bind(taskController));

// Get task by ID
router.get('/:taskId', authMiddleware, taskController.getTaskById.bind(taskController));

// Create task
router.post('/', authMiddleware, taskController.createTask.bind(taskController));

// Update task
router.put('/:taskId', authMiddleware, taskController.updateTask.bind(taskController));

// Delete task
router.delete('/:taskId', authMiddleware, taskController.deleteTask.bind(taskController));

// Get task applications
router.get('/:taskId/applications', authMiddleware, taskController.getTaskApplications.bind(taskController));

export default router;

