/**
 * Error Handler Service
 * 
 * This service provides centralized error classification and handling for project creation.
 * It parses different types of errors (network, validation, authentication, etc.) and
 * converts them into standardized ProjectCreationError objects with appropriate messages,
 * suggestions, and recoverability flags.
 */

import {
  ERROR_CODES,
  ErrorType,
  ProjectCreationError,
  type ErrorCode
} from '@/types/projectCreation'
import { ERROR_MESSAGES } from '@/utils/errorMessages'

/**
 * Error Handler class for classifying and managing project creation errors.
 * 
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler()
 * const error = errorHandler.classifyError(caughtError)
 * if (errorHandler.isRecoverable(error)) {
 *   // Show retry button
 * }
 * ```
 */
export class ErrorHandler {
  /**
   * Classifies an unknown error into a structured ProjectCreationError.
   * 
   * This method determines the error type, extracts relevant information,
   * and generates user-friendly messages and recovery suggestions.
   * 
   * @param error - The unknown error to classify
   * @returns A structured ProjectCreationError object
   * 
   * @example
   * ```typescript
   * try {
   *   await createProject(data)
   * } catch (err) {
   *   const classifiedError = errorHandler.classifyError(err)
   *   console.log(classifiedError.type, classifiedError.message)
   * }
   * ```
   */
  classifyError(error: unknown): ProjectCreationError {
    // Network errors
    if (this.isNetworkError(error)) {
      return this.createNetworkError(error)
    }
    
    // Feathers.js errors
    if (this.isFeathersError(error)) {
      return this.createFeathersError(error)
    }
    
    // Validation errors
    if (this.isValidationError(error)) {
      return this.createValidationError(error)
    }
    
    // Default to unknown error
    return this.createUnknownError(error)
  }

  /**
   * Checks if an error is a network-related error.
   * 
   * @param error - The error to check
   * @returns true if the error is a network error, false otherwise
   */
  private isNetworkError(error: unknown): boolean {
    // Check for TypeError with fetch-related messages
    if (error instanceof TypeError) {
      const message = error.message.toLowerCase()
      if (message.includes('fetch') ||
          message.includes('network') ||
          message.includes('failed to fetch') ||
          message.includes('network request failed')) {
        return true
      }
    }
    
    // Check for Error with NetworkError name
    if (error instanceof Error && error.name === 'NetworkError') {
      return true
    }
    
    // Check for offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true
    }
    
    // Check for specific error codes from Feathers.js
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>
      const code = String(err.code || err.name || '')
      if (code === 'ENOTFOUND' ||
          code === 'ECONNREFUSED' ||
          code === 'ETIMEDOUT' ||
          code === 'ECONNRESET' ||
          code === 'EAI_AGAIN') {
        return true
      }
      
      // Check for HTTP status codes that indicate network issues
      const statusCode = Number(err.statusCode || err.status || err.code)
      if (statusCode >= 500 && statusCode < 600) {
        return true
      }
    }
    
    return false
  }

  /**
   * Checks if an error is a Feathers.js error response.
   * 
   * @param error - The error to check
   * @returns true if the error is a Feathers.js error, false otherwise
   */
  private isFeathersError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      'code' in error &&
      'message' in error
    )
  }

  /**
   * Checks if an error is a validation error.
   * 
   * @param error - The error to check
   * @returns true if the error is a validation error, false otherwise
   */
  private isValidationError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as Record<string, unknown>).name === 'BadRequest'
    )
  }

  /**
   * Creates a network error from an unknown error.
   * 
   * @param error - The error to convert
   * @returns A ProjectCreationError with type NETWORK
   */
  private createNetworkError(error: unknown): ProjectCreationError {
    const err = error as Error
    const isOffline = !navigator.onLine
    const isTimeout = err.message.toLowerCase().includes('timeout')
    
    const errorCode: ErrorCode = isOffline 
      ? ERROR_CODES.NETWORK_OFFLINE 
      : isTimeout 
        ? ERROR_CODES.NETWORK_TIMEOUT 
        : ERROR_CODES.NETWORK_ERROR
    
    const errorMessage = ERROR_MESSAGES[errorCode]
    
    return {
      type: ErrorType.NETWORK,
      code: errorCode,
      message: errorMessage.message,
      details: err.message,
      suggestion: errorMessage.suggestion,
      recoverable: errorMessage.recoverable,
      timestamp: Date.now(),
      originalError: error
    }
  }

  /**
   * Creates a Feathers.js error from an unknown error.
   * 
   * @param error - The error to convert
   * @returns A ProjectCreationError with appropriate type based on the Feathers error code
   */
  private createFeathersError(error: unknown): ProjectCreationError {
    const feathersError = error as Record<string, unknown>
    const code = (feathersError.code || feathersError.name) as string
    
    // Map Feathers.js error codes to our error codes
    const errorMapping: Record<string, ErrorCode> = {
      '401': ERROR_CODES.UNAUTHORIZED,
      '429': ERROR_CODES.RATE_LIMITED,
      '500': ERROR_CODES.SERVER_ERROR,
      '503': ERROR_CODES.SERVICE_UNAVAILABLE
    }
    
    const errorCode = errorMapping[code] || ERROR_CODES.SERVER_ERROR
    const errorMessage = ERROR_MESSAGES[errorCode]
    
    return {
      type: this.getErrorTypeFromCode(errorCode),
      code: errorCode,
      message: errorMessage.message,
      details: String(feathersError.message || ''),
      suggestion: errorMessage.suggestion,
      recoverable: errorMessage.recoverable,
      timestamp: Date.now(),
      originalError: error
    }
  }

  /**
   * Creates a validation error from an unknown error.
   * 
   * @param error - The error to convert
   * @returns A ProjectCreationError with type VALIDATION
   */
  private createValidationError(error: unknown): ProjectCreationError {
    const validationError = error as Record<string, unknown>
    const errors = (validationError.errors || 
      (validationError.data as Record<string, unknown> | undefined)?.errors || 
      {}) as Record<string, unknown>
    
    // Determine specific validation error
    let errorCode: ErrorCode = ERROR_CODES.MISSING_REQUIRED_FIELD
    if (errors.framework) {
      errorCode = ERROR_CODES.INVALID_FRAMEWORK
    } else if (errors.language) {
      errorCode = ERROR_CODES.INVALID_LANGUAGE
    }
    
    const errorMessage = ERROR_MESSAGES[errorCode]
    
    return {
      type: ErrorType.VALIDATION,
      code: errorCode,
      message: errorMessage.message,
      details: JSON.stringify(errors),
      suggestion: errorMessage.suggestion,
      recoverable: errorMessage.recoverable,
      timestamp: Date.now(),
      originalError: error
    }
  }

  /**
   * Creates an unknown error from an unknown error.
   * 
   * @param error - The error to convert
   * @returns A ProjectCreationError with type UNKNOWN
   */
  private createUnknownError(error: unknown): ProjectCreationError {
    const errorMessage = ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
    
    return {
      type: ErrorType.UNKNOWN,
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: errorMessage.message,
      details: error instanceof Error ? error.message : String(error),
      suggestion: errorMessage.suggestion,
      recoverable: errorMessage.recoverable,
      timestamp: Date.now(),
      originalError: error
    }
  }

  /**
   * Determines the ErrorType from an error code.
   * 
   * @param code - The error code to convert
   * @returns The corresponding ErrorType
   */
  private getErrorTypeFromCode(code: string): ErrorType {
    if (code.startsWith('NETWORK')) return ErrorType.NETWORK
    if (code === ERROR_CODES.UNAUTHORIZED || code === ERROR_CODES.SESSION_EXPIRED) {
      return ErrorType.AUTHENTICATION
    }
    if (code === ERROR_CODES.RATE_LIMITED) return ErrorType.RATE_LIMIT
    if (code.startsWith('SERVER') || code === ERROR_CODES.SERVICE_UNAVAILABLE) {
      return ErrorType.SERVER
    }
    if (code.includes('TIMEOUT')) return ErrorType.TIMEOUT
    if (code.startsWith('INVALID') || code === ERROR_CODES.MISSING_REQUIRED_FIELD) {
      return ErrorType.VALIDATION
    }
    return ErrorType.UNKNOWN
  }

  /**
   * Gets the user-friendly error message for a ProjectCreationError.
   * 
   * @param error - The error to get the message from
   * @returns The user-friendly error message
   * 
   * @example
   * ```typescript
   * const message = errorHandler.getErrorMessage(classifiedError)
   * toast.error(message)
   * ```
   */
  getErrorMessage(error: ProjectCreationError): string {
    return error.message
  }

  /**
   * Gets the recovery suggestion for a ProjectCreationError.
   * 
   * @param error - The error to get the suggestion from
   * @returns The recovery suggestion
   * 
   * @example
   * ```typescript
   * const suggestion = errorHandler.getRecoverySuggestion(classifiedError)
   * console.log('What to do:', suggestion)
   * ```
   */
  getRecoverySuggestion(error: ProjectCreationError): string {
    return error.suggestion
  }

  /**
   * Checks if an error is recoverable via retry.
   * 
   * @param error - The error to check
   * @returns true if the error is recoverable, false otherwise
   * 
   * @example
   * ```typescript
   * if (errorHandler.isRecoverable(classifiedError)) {
   *   // Show retry button
   * }
   * ```
   */
  isRecoverable(error: ProjectCreationError): boolean {
    return error.recoverable
  }

  /**
   * Gets the retry delay for a specific error type and attempt number.
   * 
   * Different error types have different retry strategies:
   * - Network errors: [2s, 5s, 10s]
   * - Rate limit errors: [5s, 10s, 30s]
   * - Server errors: [2s, 5s, 10s]
   * - Timeout errors: [5s, 10s, 15s]
   * - Unknown errors: [2s, 5s, 10s]
   * 
   * @param error - The error to get the retry delay for
   * @param attempt - The current attempt number (0-indexed)
   * @returns The delay in milliseconds before the next retry
   * 
   * @example
   * ```typescript
   * const delay = errorHandler.getRetryDelay(classifiedError, 0)
   * console.log(`Retry in ${delay}ms`)
   * ```
   */
  getRetryDelay(error: ProjectCreationError, attempt: number): number {
    // Different delays based on error type
    const baseDelays: Record<ErrorType, number[]> = {
      [ErrorType.NETWORK]: [2_000, 5_000, 10_000],
      [ErrorType.RATE_LIMIT]: [5_000, 10_000, 30_000],
      [ErrorType.SERVER]: [2_000, 5_000, 10_000],
      [ErrorType.TIMEOUT]: [5_000, 10_000, 15_000],
      [ErrorType.UNKNOWN]: [2_000, 5_000, 10_000],
      [ErrorType.VALIDATION]: [],
      [ErrorType.AUTHENTICATION]: []
    }
    
    const delays = baseDelays[error.type] || baseDelays[ErrorType.UNKNOWN]
    
    // If there are no delays defined for this error type, return a default delay
    if (delays.length === 0) {
      return 0
    }
    
    // TypeScript knows delays is not empty here, but we need to help it
    const delayIndex = Math.min(attempt, delays.length - 1)
    const delay = delays[delayIndex]!
    
    return delay
  }
}

/**
 * Singleton instance of the ErrorHandler class.
 * Use this for consistent error handling across the application.
 */
export const errorHandler = new ErrorHandler()
