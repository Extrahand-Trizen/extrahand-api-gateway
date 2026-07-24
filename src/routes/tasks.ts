import { Router } from "express";
// import rateLimit from "express-rate-limit";
import { taskController } from "../controllers/TaskController.js";
import { optionalAuthMiddleware, authMiddleware } from "../middleware/auth.js";

const router = Router();


// const publicRouteLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 500, // 500 requests per 15 min per key (supports 100–500 concurrent users)
//   message: {
//     success: false,
//     error: "Too many requests, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   // Key by authenticated user when present so many users behind one IP don't share one limit
//   keyGenerator: (req: any) => {
//     if (req.user?.uid) return `user:${req.user.uid}`;
//     return (
//       (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
//       (req.headers['x-real-ip'] as string) ||
//       req.socket?.remoteAddress ||
//       req.ip ||
//       'unknown'
//     );
//   },
// });

// ✅ PUBLIC routes - accessible to users WITHOUT accounts
// Optional auth allows personalization for logged-in users, but route works without authentication
// Get all tasks (with filters) - public route with IP-based rate limiting
router.get("/", optionalAuthMiddleware, taskController.getTasks.bind(taskController));

// ✅ PROTECTED routes (require authentication)
// Get nearby tasks - requires authentication
router.get(
  "/nearby",
  authMiddleware,
  taskController.getNearbyTasks.bind(taskController)
);

// Get my tasks (must come before /:taskId route) - requires authentication
router.get(
  "/my-tasks",
  authMiddleware,
  taskController.getMyTasks.bind(taskController)
);

// Task tracking bundle + scoped application lookup (before /:taskId)
router.get(
  "/:taskId/tracking-bundle",
  authMiddleware,
  taskController.getTrackingBundle.bind(taskController)
);
router.get(
  "/:taskId/my-application",
  authMiddleware,
  taskController.getMyApplicationForTask.bind(taskController)
);

// Task status and completion routes (must come before /:taskId route) - require authentication
router.patch(
  "/:taskId/status",
  authMiddleware,
  taskController.updateTaskStatus.bind(taskController)
);
router.post(
  "/:taskId/start-otp/send",
  authMiddleware,
  taskController.sendStartOtp.bind(taskController)
);
router.post(
  "/:taskId/start-otp/resend",
  authMiddleware,
  taskController.resendStartOtp.bind(taskController)
);
router.post(
  "/:taskId/start-otp/verify",
  authMiddleware,
  taskController.verifyStartOtp.bind(taskController)
);
// Poster reads OTP for Work Progress (must be after /send|/resend|/verify)
router.get(
  "/:taskId/start-otp",
  authMiddleware,
  taskController.getStartOtp.bind(taskController)
);
// Helper marks arrived (requires executionPhase=on_the_way from start-otp/send)
router.post(
  "/:taskId/execution-phase/arrived",
  authMiddleware,
  taskController.markExecutionArrived.bind(taskController)
);
router.post('/:taskId/submit-proof', authMiddleware, taskController.submitCompletionProof.bind(taskController));
router.post(
  "/:taskId/complete",
  authMiddleware,
  taskController.submitCompletionProof.bind(taskController)
);
router.post(
  "/:taskId/approve-completion",
  authMiddleware,
  taskController.approveCompletion.bind(taskController)
);
router.post(
  "/:taskId/reject-completion",
  authMiddleware,
  taskController.rejectCompletion.bind(taskController)
);
router.post(
  "/:taskId/request-changes",
  authMiddleware,
  taskController.requestChanges.bind(taskController)
);
// Reverted: additional quote / selfie-work-evidence tracking flow disabled in gateway.
// router.post(
//   "/:taskId/additional-quote-request",
//   authMiddleware,
//   taskController.createAdditionalQuoteRequest.bind(taskController)
// );
// router.get(
//   "/:taskId/additional-quote-requests",
//   authMiddleware,
//   taskController.getAdditionalQuoteRequests.bind(taskController)
// );
// router.get(
//   "/:taskId/additional-quote-request/active",
//   authMiddleware,
//   taskController.getActiveAdditionalQuoteRequest.bind(taskController)
// );
// router.post(
//   "/:taskId/additional-quote-request/:requestId/accept",
//   authMiddleware,
//   taskController.acceptAdditionalQuoteRequest.bind(taskController)
// );
// router.post(
//   "/:taskId/additional-quote-request/:requestId/reject",
//   authMiddleware,
//   taskController.rejectAdditionalQuoteRequest.bind(taskController)
// );
// router.post(
//   "/:taskId/additional-quote-request/:requestId/withdraw",
//   authMiddleware,
//   taskController.withdrawAdditionalQuoteRequest.bind(taskController)
// );

// Follow routes (must come before /:taskId route) - require authentication
router.post(
  "/:taskId/follow",
  authMiddleware,
  taskController.followTask.bind(taskController)
);
router.delete(
  "/:taskId/follow",
  authMiddleware,
  taskController.unfollowTask.bind(taskController)
);
router.get(
  "/:taskId/follow",
  optionalAuthMiddleware,
  taskController.checkFollowStatus.bind(taskController)
);

// Report routes (must come before /:taskId route) - require authentication
router.post(
  "/:taskId/report",
  authMiddleware,
  taskController.reportTask.bind(taskController)
);
router.get(
  "/:taskId/reports",
  authMiddleware,
  taskController.getTaskReports.bind(taskController)
);

// Get followed tasks (must come before /:taskId route) - require authentication
router.get(
  "/followed",
  authMiddleware,
  taskController.getFollowedTasks.bind(taskController)
);

// Create task (must come before /:taskId route to avoid conflicts) - requires authentication
router.post(
  "/",
  authMiddleware,
  taskController.createTask.bind(taskController)
);

// ✅ PUBLIC route - accessible to users WITHOUT accounts
// Get task by ID - public route with IP-based rate limiting
// Optional auth allows personalization for logged-in users, but route works without authentication
router.get(
  "/:taskId",
  optionalAuthMiddleware,
  taskController.getTaskById.bind(taskController)
);

// Update task - requires authentication
router.put(
  "/:taskId",
  authMiddleware,
  taskController.updateTask.bind(taskController)
);

// Delete task - requires authentication
router.delete(
  "/:taskId",
  authMiddleware,
  taskController.deleteTask.bind(taskController)
);

// Get task applications - public route (optional auth)
router.get(
  "/:taskId/applications",
  optionalAuthMiddleware,
  taskController.getTaskApplications.bind(taskController)
);

// Task questions routes - forward to Task Service
router.get(
  "/:taskId/questions",
  optionalAuthMiddleware,
  taskController.getTaskQuestions.bind(taskController)
);
router.post(
  "/:taskId/questions",
  authMiddleware,
  taskController.askQuestion.bind(taskController)
);
router.post(
  "/:taskId/questions/:questionId/answer",
  authMiddleware,
  taskController.answerQuestion.bind(taskController)
);
router.delete(
  "/:taskId/questions/:questionId",
  authMiddleware,
  taskController.deleteQuestion.bind(taskController)
);

// ── Global Budget Revision ───────────────────────────────────────────────────
// POST /api/v1/tasks/:taskId/revise-budget — Poster revises task budget (max 2 rounds)
router.post(
  "/:taskId/revise-budget",
  authMiddleware,
  taskController.reviseBudget.bind(taskController)
);

// ── Recurring visit plan (must come before /:taskId GET) ─────────────────────
router.get(
  "/:taskId/recurring/visits",
  authMiddleware,
  taskController.getRecurringVisits.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/confirm-payment",
  authMiddleware,
  taskController.confirmRecurringVisitPayment.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/skip",
  authMiddleware,
  taskController.skipRecurringVisit.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/cancel",
  authMiddleware,
  taskController.cancelRecurringVisit.bind(taskController)
);
router.post(
  "/:taskId/recurring/plan/end",
  authMiddleware,
  taskController.endRecurringPlan.bind(taskController)
);
router.post(
  "/:taskId/recurring/plan/resume",
  authMiddleware,
  taskController.resumeRecurringPlan.bind(taskController)
);
router.post(
  "/:taskId/recurring/plan/open-next-payment",
  authMiddleware,
  taskController.openNextRecurringVisitPayment.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/reschedule",
  authMiddleware,
  taskController.rescheduleRecurringVisit.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/reschedule/request",
  authMiddleware,
  taskController.requestRecurringVisitReschedule.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/reschedule/respond",
  authMiddleware,
  taskController.respondRecurringVisitReschedule.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/cancel/request",
  authMiddleware,
  taskController.requestRecurringVisitCancel.bind(taskController)
);
router.post(
  "/:taskId/recurring/visits/:visitId/cancel/respond",
  authMiddleware,
  taskController.respondRecurringVisitCancel.bind(taskController)
);
router.post(
  "/:taskId/recurring/plan/pause",
  authMiddleware,
  taskController.pauseRecurringPlan.bind(taskController)
);
router.post(
  "/:taskId/recurring/plan/leave",
  authMiddleware,
  taskController.leaveRecurringPlan.bind(taskController)
);

export default router;
