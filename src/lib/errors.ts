/**
 * User-friendly error messages and error handling utilities
 */

export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  SERVER = 'server',
  RATE_LIMIT = 'rate_limit',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

export interface AppError {
  type: ErrorType;
  message: string;
  action?: string;
}

/**
 * Parse HTTP response into a user-friendly error
 */
export async function parseApiError(response: Response): Promise<AppError> {
  const status = response.status;

  // Rate limiting
  if (status === 429) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'Too many requests. Please wait a moment.',
      action: 'Try again in a few seconds',
    };
  }

  // Authentication errors
  if (status === 401) {
    return {
      type: ErrorType.AUTH,
      message: 'Your session has expired.',
      action: 'Please sign in again',
    };
  }

  // Not found
  if (status === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      message: 'Resource not found.',
      action: 'Please try refreshing the page',
    };
  }

  // Validation errors
  if (status === 400 || status === 422) {
    try {
      const body = await response.json();
      const detail = body.detail || 'Invalid request';
      return {
        type: ErrorType.VALIDATION,
        message: typeof detail === 'string' ? detail : 'Invalid request data',
        action: 'Please check your input',
      };
    } catch {
      return {
        type: ErrorType.VALIDATION,
        message: 'Invalid request data',
        action: 'Please check your input',
      };
    }
  }

  // Server errors
  if (status >= 500) {
    return {
      type: ErrorType.SERVER,
      message: 'Server error. Our team has been notified.',
      action: 'Please try again later',
    };
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: 'Something went wrong',
    action: 'Please try again',
  };
}

/**
 * Parse network error (fetch failed)
 */
export function parseNetworkError(): AppError {
  return {
    type: ErrorType.NETWORK,
    message: 'Network error. Please check your connection.',
    action: 'Try again when connected',
  };
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: AppError): string {
  if (error.action) {
    return `${error.message} ${error.action}.`;
  }
  return error.message;
}

/**
 * Friendly error messages for common operations
 */
export const ErrorMessages = {
  LOAD_COUNTRIES: {
    type: ErrorType.SERVER,
    message: 'Failed to load countries',
    action: 'Please refresh the page',
  },
  LOAD_SCENARIOS: {
    type: ErrorType.SERVER,
    message: 'Failed to load scenarios',
    action: 'Please try selecting the country again',
  },
  CREATE_SESSION: {
    type: ErrorType.SERVER,
    message: 'Failed to start conversation',
    action: 'Please try again',
  },
  LOAD_MESSAGES: {
    type: ErrorType.SERVER,
    message: 'Failed to load conversation',
    action: 'Please refresh the page',
  },
  SEND_MESSAGE: {
    type: ErrorType.SERVER,
    message: 'Failed to send message',
    action: 'Please try again',
  },
  LOAD_FEEDBACK: {
    type: ErrorType.SERVER,
    message: 'Failed to generate feedback',
    action: 'Please try again in a moment',
  },
  LOAD_HISTORY: {
    type: ErrorType.SERVER,
    message: 'Failed to load conversation history',
    action: 'Please refresh the page',
  },
  LOAD_PROFILE: {
    type: ErrorType.SERVER,
    message: 'Failed to load profile',
    action: 'Please refresh the page',
  },
  UPDATE_PROFILE: {
    type: ErrorType.SERVER,
    message: 'Failed to update profile',
    action: 'Please try again',
  },
} as const;
