import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import { loggingMiddleware } from './middleware/logging.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import profilesRouter from './routes/profiles.js';
import tasksRouter from './routes/tasks.js';
import verificationRouter from './routes/verification.js';
import logger from './config/logger.js';
import { validateEnv, getCorsConfig } from './config/env.js';

const env = validateEnv();
const app: Express = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
const corsOptions = getCorsConfig(env);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// Logging
app.use(loggingMiddleware);
if (env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) }
  }));
} else {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10) * 10, // Higher limit for mobile apps
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.path === '/api/v1/health' || req.path === '/health';
  },
});

app.use('/api/', limiter);

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
    },
    message: 'This is the API Gateway - requests are routed to microservices',
  });
});

// API routes
app.use('/api/v1/profiles', authMiddleware, profilesRouter);
app.use('/api/v1/tasks', authMiddleware, tasksRouter);
app.use('/api/v1/verification', authMiddleware, verificationRouter);

// 404 handler for API routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use(errorHandler);

export default app;

