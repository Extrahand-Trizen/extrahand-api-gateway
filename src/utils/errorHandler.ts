import { Response } from 'express';
import logger from '../config/logger.js';
import { ServiceError } from '../types/service.js';

export function handleServiceError(
  error: unknown,
  res: Response,
  context: string
): void {
  logger.error(`[${context}] Error:`, error);

  // Check for connection/timeout errors
  if (error instanceof Error) {
    // Check for ECONNREFUSED, ETIMEDOUT, or network errors
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('connect econnrefused') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('enotfound')
    ) {
      // Extract service name from context if possible
      const serviceMatch = context.match(/(UserService|TaskService|VerificationService)/);
      const serviceName = serviceMatch ? serviceMatch[1] : 'microservice';
      
      res.status(503).json({
        success: false,
        error: `Cannot connect to ${serviceName}. Please ensure the service is running.`,
        details: error.message,
        troubleshooting: [
          `1. Check if ${serviceName} is running`,
          `2. Verify the service URL in API Gateway .env file`,
          `3. Check network connectivity`,
          `4. Review API Gateway logs for more details`
        ],
        context,
      });
      return;
    }
  }

  if (isServiceError(error)) {
    // When Task Service returns 500, surface the actual error message from data if available
    const errorData = error.data as Record<string, unknown> | undefined;
    const upstreamMessage = errorData?.message as string | undefined;
    const displayError = upstreamMessage && typeof upstreamMessage === 'string' && upstreamMessage !== 'An unexpected error occurred'
      ? upstreamMessage
      : error.message;

    res.status(error.status).json({
      success: false,
      error: displayError,
      data: error.data,
      service: error.service,
    });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({
      success: false,
      error: error.message,
      context,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    context,
  });
}

function isServiceError(error: unknown): error is ServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    'service' in error
  );
}

