import dotenv from 'dotenv';
import app from './app.js';
import logger from './config/logger.js';
import { validateEnv } from './config/env.js';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv();
const PORT = parseInt(env.PORT, 10);

let server: any;
let isShuttingDown = false;

async function start(): Promise<void> {
  try {
    logger.info('🚀 Starting ExtraHand API Gateway...');
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Port: ${PORT}`);

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`✅ API Gateway listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
      logger.info('Services configured:');
      logger.info(`  - User Service: ${env.USER_SERVICE_URL}`);
      logger.info(`  - Task Service: ${env.TASK_SERVICE_URL}`);
      logger.info(`  - Verification Service: ${env.VERIFICATION_SERVICE_URL}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('✅ HTTP server closed');
    });
  }

  logger.info('✅ Graceful shutdown completed');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start().catch((error) => {
  logger.error('💥 Failed to start application:', error);
  process.exit(1);
});

