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
    // Surface the most useful upstream message, including nested gateway/service payloads.
    const errorData = error.data as Record<string, unknown> | undefined;
    const nestedData = errorData?.data as Record<string, unknown> | undefined;
    const candidates = [
      errorData?.error,
      errorData?.message,
      errorData?.details,
      nestedData?.error,
      nestedData?.message,
      error.message,
    ];
    const displayError = candidates.find(
      (value): value is string =>
        typeof value === 'string' &&
        value.trim() !== '' &&
        value !== 'An unexpected error occurred' &&
        value !== 'Request failed with status code 400' &&
        value !== 'Request failed with status code 401' &&
        value !== 'Request failed with status code 403' &&
        value !== 'Request failed with status code 404' &&
        value !== 'Request failed with status code 409' &&
        value !== 'Request failed with status code 500' &&
        value !== 'Request failed with status code 502' &&
        value !== 'Request failed with status code 503'
    ) || error.message;

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

