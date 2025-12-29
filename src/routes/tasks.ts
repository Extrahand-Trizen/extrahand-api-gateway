import { Router } from "express";
import { taskController } from "../controllers/TaskController.js";

const router = Router();

// Get all tasks (with filters)
// Note: authMiddleware is applied at app level, so no need to apply here
router.get("/", taskController.getTasks.bind(taskController));

// Get nearby tasks
router.get(
  "/nearby",
  taskController.getNearbyTasks.bind(taskController)
);

// Get my tasks (must come before /:taskId route)
router.get(
  "/my-tasks",
  taskController.getMyTasks.bind(taskController)
);

// Task status and completion routes (must come before /:taskId route)
router.patch(
  "/:taskId/status",
  taskController.updateTaskStatus.bind(taskController)
);
router.post(
  "/:taskId/complete",
  taskController.submitCompletionProof.bind(taskController)
);
router.post(
  "/:taskId/approve-completion",
  taskController.approveCompletion.bind(taskController)
);
router.post(
  "/:taskId/reject-completion",
  taskController.rejectCompletion.bind(taskController)
);

// Follow routes (must come before /:taskId route)
router.post(
  "/:taskId/follow",
  taskController.followTask.bind(taskController)
);
router.delete(
  "/:taskId/follow",
  taskController.unfollowTask.bind(taskController)
);
router.get(
  "/:taskId/follow",
  taskController.checkFollowStatus.bind(taskController)
);

// Report routes (must come before /:taskId route)
router.post(
  "/:taskId/report",
  taskController.reportTask.bind(taskController)
);
router.get(
  "/:taskId/reports",
  taskController.getTaskReports.bind(taskController)
);

// Get followed tasks (must come before /:taskId route)
router.get(
  "/followed",
  taskController.getFollowedTasks.bind(taskController)
);

// Create task (must come before /:taskId route to avoid conflicts)
router.post(
  "/",
  taskController.createTask.bind(taskController)
);

// Get task by ID
router.get(
  "/:taskId",
  taskController.getTaskById.bind(taskController)
);

// Update task
router.put(
  "/:taskId",
  taskController.updateTask.bind(taskController)
);

// Delete task
router.delete(
  "/:taskId",
  taskController.deleteTask.bind(taskController)
);

// Get task applications
router.get(
  "/:taskId/applications",
  taskController.getTaskApplications.bind(taskController)
);

// Task questions routes - forward to Task Service
router.get(
  "/:taskId/questions",
  taskController.getTaskQuestions.bind(taskController)
);
router.post(
  "/:taskId/questions",
  taskController.askQuestion.bind(taskController)
);
router.post(
  "/:taskId/questions/:questionId/answer",
  taskController.answerQuestion.bind(taskController)
);
router.delete(
  "/:taskId/questions/:questionId",
  taskController.deleteQuestion.bind(taskController)
);

export default router;
