/**
 * Error message mappings for project creation errors.
 * This module provides user-friendly error messages and recovery suggestions
 * for all error types that can occur during project creation.
 */

import { ERROR_CODES, type ErrorCode } from '@/types/projectCreation'

/**
 * Interface for error message details.
 */
export interface ErrorMessage {
  /** User-friendly error title */
  title: string
  /** Detailed error description */
  message: string
  /** Actionable suggestion for recovery */
  suggestion: string
  /** Whether the error is recoverable via retry */
  recoverable: boolean
}

/**
 * Mapping of error codes to user-friendly error messages and recovery suggestions.
 * Each entry provides clear communication about what went wrong and how to fix it.
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // Network errors
  [ERROR_CODES.NETWORK_OFFLINE]: {
    title: "You're offline",
    message: "Please check your internet connection.",
    suggestion: "Check your network settings and try again.",
    recoverable: true
  },

  [ERROR_CODES.NETWORK_TIMEOUT]: {
    title: "Network request timed out",
    message: "The request took too long to complete.",
    suggestion: "Your connection may be slow. Try again.",
    recoverable: true
  },

  [ERROR_CODES.NETWORK_ERROR]: {
    title: "Network error occurred",
    message: "A network error prevented the request from completing.",
    suggestion: "Check your internet connection and try again.",
    recoverable: true
  },

  // Validation errors
  [ERROR_CODES.INVALID_FRAMEWORK]: {
    title: "Invalid framework selected",
    message: "The selected framework is not supported.",
    suggestion: "Please choose a valid framework (fast-api, feathers).",
    recoverable: false
  },

  [ERROR_CODES.INVALID_LANGUAGE]: {
    title: "Invalid language selected",
    message: "The selected language is not supported.",
    suggestion: "Please choose a valid language (python, typescript).",
    recoverable: false
  },

  [ERROR_CODES.MISSING_REQUIRED_FIELD]: {
    title: "Missing required field",
    message: "One or more required fields are missing.",
    suggestion: "Please fill in all required fields and try again.",
    recoverable: false
  },

  // Authentication errors
  [ERROR_CODES.UNAUTHORIZED]: {
    title: "Unauthorized",
    message: "You're not authorized to create projects.",
    suggestion: "Please log in and try again.",
    recoverable: false
  },

  [ERROR_CODES.SESSION_EXPIRED]: {
    title: "Session expired",
    message: "Your session has expired. Please log in again.",
    suggestion: "Please log in and try again.",
    recoverable: false
  },

  // Rate limiting
  [ERROR_CODES.RATE_LIMITED]: {
    title: "Too many requests",
    message: "You've made too many requests. Please wait before trying again.",
    suggestion: "Wait a few minutes before trying again.",
    recoverable: true
  },

  // Server errors
  [ERROR_CODES.SERVER_ERROR]: {
    title: "Server error occurred",
    message: "An internal server error occurred while creating your project.",
    suggestion: "Our team has been notified. Please try again later.",
    recoverable: true
  },

  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    title: "Service unavailable",
    message: "The service is temporarily unavailable.",
    suggestion: "Our team has been notified. Please try again later.",
    recoverable: true
  },

  // Timeout errors
  [ERROR_CODES.CREATION_TIMEOUT]: {
    title: "Project creation timeout",
    message: "Project creation is taking longer than expected.",
    suggestion: "You can wait longer or try creating again.",
    recoverable: true
  },

  [ERROR_CODES.READY_TIMEOUT]: {
    title: "Project initialization timeout",
    message: "Project initialization is taking longer than expected.",
    suggestion: "The project may still complete. Check your dashboard.",
    recoverable: true
  },

  // Unknown errors
  [ERROR_CODES.UNKNOWN_ERROR]: {
    title: "An unexpected error occurred",
    message: "Something went wrong while creating your project.",
    suggestion: "Please try again. If the problem persists, contact support.",
    recoverable: true
  }
}

/**
 * Get error message details for a specific error code.
 *
 * @param code - The error code to look up
 * @returns The error message details for the given code
 *
 * @example
 * ```typescript
 * const errorDetails = getErrorMessage('NETWORK_OFFLINE')
 * console.log(errorDetails.title) // "You're offline"
 * console.log(errorDetails.suggestion) // "Check your network settings and try again."
 * ```
 */
export function getErrorMessage(code: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code]
}

/**
 * Check if an error is recoverable based on its error code.
 *
 * @param code - The error code to check
 * @returns true if the error is recoverable, false otherwise
 *
 * @example
 * ```typescript
 * if (isRecoverable('NETWORK_OFFLINE')) {
 *   // Show retry button
 * }
 * ```
 */
export function isRecoverable(code: ErrorCode): boolean {
  return ERROR_MESSAGES[code].recoverable
}

/**
 * Get the maximum number of retries allowed for a specific error code.
 *
 * @param code - The error code to check
 * @returns The maximum number of retries (0 for non-recoverable errors)
 *
 * @example
 * ```typescript
 * const maxRetries = getMaxRetries('NETWORK_OFFLINE')
 * console.log(maxRetries) // 3 (or based on configuration)
 * ```
 */
export function getMaxRetries(code: ErrorCode): number {
  // Non-recoverable errors have 0 retries
  if (!isRecoverable(code)) {
    return 0
  }

  // Recoverable errors typically allow 3 retries
  // Specific error types may have different limits
  const retryLimits: Partial<Record<ErrorCode, number>> = {
    [ERROR_CODES.NETWORK_OFFLINE]: Infinity, // Unlimited retries for offline
    [ERROR_CODES.CREATION_TIMEOUT]: 2,       // 2 retries for creation timeout
    [ERROR_CODES.READY_TIMEOUT]: 1            // 1 retry for ready timeout
  }

  return retryLimits[code] ?? 3
}

/**
 * Format an error message for display in the UI.
 *
 * @param code - The error code
 * @param details - Optional additional details to include
 * @returns A formatted error message string
 *
 * @example
 * ```typescript
 * const message = formatErrorMessage('NETWORK_OFFLINE', 'Failed to connect to API')
 * console.log(message)
 * // "You're offline: Failed to connect to API. Check your network settings and try again."
 * ```
 */
export function formatErrorMessage(code: ErrorCode, details?: string): string {
  const error = ERROR_MESSAGES[code]
  let message = error.message

  if (details) {
    message += `: ${details}`
  }

  return `${error.title}. ${message} ${error.suggestion}`
}

/**
 * Get all error codes for a specific error type.
 *
 * @param type - The error type to filter by
 * @returns Array of error codes that match the given type
 *
 * @example
 * ```typescript
 * const networkErrors = getErrorCodesByType('network')
 * console.log(networkErrors)
 * // ['NETWORK_OFFLINE', 'NETWORK_TIMEOUT', 'NETWORK_ERROR']
 * ```
 */
export function getErrorCodesByType(type: string): ErrorCode[] {
  const typePrefixes: Record<string, string[]> = {
    network: ['NETWORK_OFFLINE', 'NETWORK_TIMEOUT', 'NETWORK_ERROR'],
    validation: ['INVALID_FRAMEWORK', 'INVALID_LANGUAGE', 'MISSING_REQUIRED_FIELD'],
    authentication: ['UNAUTHORIZED', 'SESSION_EXPIRED'],
    rate_limit: ['RATE_LIMITED'],
    server: ['SERVER_ERROR', 'SERVICE_UNAVAILABLE'],
    timeout: ['CREATION_TIMEOUT', 'READY_TIMEOUT'],
    unknown: ['UNKNOWN_ERROR']
  }

  return (typePrefixes[type] || []) as ErrorCode[]
}
