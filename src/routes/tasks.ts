import { Router } from 'express';
import { taskController } from '../controllers/TaskController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get all tasks (with filters)
router.get('/', authMiddleware, taskController.getTasks.bind(taskController));

// Task status and completion routes (must come before /:taskId route)
router.patch('/:taskId/status', authMiddleware, taskController.updateTaskStatus.bind(taskController));
router.post('/:taskId/submit-proof', authMiddleware, taskController.submitCompletionProof.bind(taskController));
router.post('/:taskId/complete', authMiddleware, taskController.submitCompletionProof.bind(taskController));
router.post('/:taskId/approve-completion', authMiddleware, taskController.approveCompletion.bind(taskController));
router.post('/:taskId/reject-completion', authMiddleware, taskController.rejectCompletion.bind(taskController));

// Follow routes (must come before /:taskId route)
router.post('/:taskId/follow', authMiddleware, taskController.followTask.bind(taskController));
router.delete('/:taskId/follow', authMiddleware, taskController.unfollowTask.bind(taskController));
router.get('/:taskId/follow', authMiddleware, taskController.checkFollowStatus.bind(taskController));

// Report routes (must come before /:taskId route)
router.post('/:taskId/report', authMiddleware, taskController.reportTask.bind(taskController));
router.get('/:taskId/reports', authMiddleware, taskController.getTaskReports.bind(taskController));

// Get followed tasks (must come before /:taskId route)
router.get('/followed', authMiddleware, taskController.getFollowedTasks.bind(taskController));

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

// Task questions routes - forward to Task Service
router.get('/:taskId/questions', authMiddleware, taskController.getTaskQuestions.bind(taskController));
router.post('/:taskId/questions', authMiddleware, taskController.askQuestion.bind(taskController));
router.post('/:taskId/questions/:questionId/answer', authMiddleware, taskController.answerQuestion.bind(taskController));
router.delete('/:taskId/questions/:questionId', authMiddleware, taskController.deleteQuestion.bind(taskController));

export default router;

