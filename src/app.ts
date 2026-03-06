import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import { loggingMiddleware } from './middleware/logging.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import profilesRouter from './routes/profiles.js';
import tasksRouter from './routes/tasks.js';
import verificationRouter from './routes/verification.js';
import applicationsRouter from './routes/applications.js';
import uploadsRouter from './routes/uploads.js';
import authRouter from './routes/auth.js';
import chatsRouter from './routes/chats.js';
import reviewsRouter from './routes/reviews.js';
import notificationsRouter from './routes/notifications.js';
import paymentRouter from './routes/payment.js';
import { paymentController } from './controllers/PaymentController.js';
import escrowRouter from './routes/escrow.js';
import refundRouter from './routes/refunds.js';
// Payouts disabled - handled elsewhere
// import payoutRouter from './routes/payouts.js';
import earningsRouter from './routes/earnings.js';
import transactionRouter from './routes/transactions.js';
import adminRouter from './routes/admin.js';
import sessionsRouter from './routes/sessions.js';
import businessRouter from './routes/business.js';
import privacyRouter from './routes/privacy.js';
import userRouter from './routes/user.js';
import notificationPreferencesRouter from './routes/notificationPreferences.js';
import logger from './config/logger.js';
import { validateEnv, getCorsConfig } from './config/env.js';

const env = validateEnv();
const app: Express = express();

// Trust proxy
app.set("trust proxy", 1);

// Security middleware
app.use(
   helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
         },
      },
   })
);

// CORS
const corsOptions = getCorsConfig(env);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
console.log("✅ [CORS] CORS middleware applied with credentials:", corsOptions.credentials);

// Body parsing
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());

// Logging
app.use(loggingMiddleware);
if (env.NODE_ENV === "production") {
   app.use(
      morgan("combined", {
         stream: { write: (message: string) => logger.info(message.trim()) },
      })
   );
} else {
   app.use(morgan("dev"));
}

// Rate limiting (commented out for now)
// const limiter = rateLimit({
//    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
//    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10) * 10, // Higher limit for mobile apps
//    message: {
//       success: false,
//       error: "Too many requests from this IP, please try again later.",
//    },
//    standardHeaders: true,
//    legacyHeaders: false,
//    skip: (req: Request) => {
//       return req.path === "/api/v1/health" || req.path === "/health";
//    },
// });

// app.use('/api/', limiter);

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.setHeader('X-Gateway', 'extrahand-api-gateway');
  res.setHeader('X-Gateway-Version', '1.0.0');
  res.json({
    status: 'ok',
    service: 'api-gateway', // ✅ Clear indicator
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      userService: env.USER_SERVICE_URL,
      taskService: env.TASK_SERVICE_URL,
      verificationService: env.VERIFICATION_SERVICE_URL,
      paymentService: env.PAYMENT_SERVICE_URL,
      notificationService: env.NOTIFICATION_SERVICE_URL,
    },
    message: 'This is the API Gateway - requests are routed to microservices',
  });
});

// API routes
// Auth routes (public - no auth middleware)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/sessions", sessionsRouter);
// Protected routes
// Wrap async authMiddleware to handle errors properly
const asyncAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(authMiddleware(req, res, next)).catch(next);
};

app.use('/api/v1/profiles', profilesRouter);
// Tasks router - some routes are public (optional auth), some require auth (handled in routes)
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/verification', asyncAuthMiddleware, verificationRouter);
// Applications router - GET is public (optional auth), mutations require auth (handled in routes)
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/chats', chatsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/notifications', authMiddleware, notificationsRouter);
app.use('/api/v1/payment', authMiddleware, paymentRouter);
app.use('/api/v1/escrow', authMiddleware, escrowRouter);
app.use('/api/v1/refunds', authMiddleware, refundRouter);
// Payouts disabled - handled elsewhere
// app.use('/api/v1/payouts', authMiddleware, payoutRouter);
app.use('/api/v1/earnings', authMiddleware, earningsRouter);
app.use('/api/v1/transactions', authMiddleware, transactionRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/business', asyncAuthMiddleware, businessRouter);
app.use('/api/v1/privacy', asyncAuthMiddleware, privacyRouter);
app.use('/api/v1/notification-preferences', notificationPreferencesRouter);
app.use('/api/v1/user', userRouter);

// Fees route (public - no auth required)
app.get('/api/v1/fees/structure', paymentController.getFeeStructure.bind(paymentController));

// ✨ Log registered routes for debugging
  logger.info('✅ [API Gateway] Routes registered:', {
    profiles: '/api/v1/profiles (with auth)',
    tasks: '/api/v1/tasks (with optional auth)',
    verification: '/api/v1/verification (with auth)',
    applications: '/api/v1/applications (with auth)',
    uploads: '/api/v1/uploads',
    chats: '/api/v1/chats',
    reviews: '/api/v1/reviews',
    notifications: '/api/v1/notifications (with auth)',
    payment: '/api/v1/payment (with auth)',
    escrow: '/api/v1/escrow (with auth)',
    refunds: '/api/v1/refunds (with auth)',
    // payouts: '/api/v1/payouts (with auth)', // disabled
    earnings: '/api/v1/earnings (with auth)',
    transactions: '/api/v1/transactions (with auth)',
    business: '/api/v1/business (with auth)',
    privacy: '/api/v1/privacy (with auth)',
    user: '/api/v1/user (badge, referral, credits, batch-jobs)',
    auth: '/api/v1/auth (public)'
  });

// 404 handler for API routes
app.use("/api", (req: Request, res: Response) => {
   // ✨ Enhanced logging for 404s
   logger.warn("⚠️ [API Gateway] 404 - Route not found", {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      query: req.query,
      body: req.body ? "present" : "absent",
   });

   res.status(404).json({
      success: false,
      error: "API endpoint not found",
      path: req.path,
      method: req.method,
      message: `No route found for ${req.method} ${req.path}`,
   });
});

// Error handler
app.use(errorHandler);

export default app;
