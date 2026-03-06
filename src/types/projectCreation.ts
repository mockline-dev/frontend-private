/**
 * Type definitions for project creation error handling system.
 * This module provides all TypeScript types, interfaces, and constants
 * used throughout the project creation flow.
 */

import type { Project } from '@/services/api/projects'

/**
 * Enumeration of all possible error types that can occur during project creation.
 * Each type represents a category of errors with similar recovery strategies.
 */
export enum ErrorType {
  /** Network-related errors (offline, timeout, connection issues) */
  NETWORK = 'network',
  /** Validation errors (invalid input, missing fields) */
  VALIDATION = 'validation',
  /** Authentication and authorization errors */
  AUTHENTICATION = 'authentication',
  /** Rate limiting errors */
  RATE_LIMIT = 'rate_limit',
  /** Server-side errors (5xx errors) */
  SERVER = 'server',
  /** Timeout errors during creation or initialization */
  TIMEOUT = 'timeout',
  /** Unknown or unclassified errors */
  UNKNOWN = 'unknown'
}

/**
 * Error codes for all specific error scenarios that can occur during project creation.
 * These codes are used to identify and categorize errors for proper handling and display.
 */
export const ERROR_CODES = {
  // Network errors
  /** User's device is offline */
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  /** Network request timed out */
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  /** Generic network error occurred */
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Validation errors
  /** Invalid framework selected */
  INVALID_FRAMEWORK: 'INVALID_FRAMEWORK',
  /** Invalid language selected */
  INVALID_LANGUAGE: 'INVALID_LANGUAGE',
  /** Required field is missing */
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication errors
  /** User is not authorized to create projects */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** User session has expired */
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Rate limiting
  /** Too many requests, rate limit exceeded */
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors
  /** Internal server error occurred */
  SERVER_ERROR: 'SERVER_ERROR',
  /** Service is temporarily unavailable */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Timeout errors
  /** Project creation took longer than expected */
  CREATION_TIMEOUT: 'CREATION_TIMEOUT',
  /** Project initialization took longer than expected */
  READY_TIMEOUT: 'READY_TIMEOUT',

  // Unknown errors
  /** An unexpected error occurred */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

/**
 * Type alias for error code values.
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

/**
 * Represents a structured error that occurs during project creation.
 * This interface provides all necessary information for error display,
 * recovery, and logging.
 */
export interface ProjectCreationError {
  /** The type/category of the error */
  type: ErrorType
  /** The specific error code from ERROR_CODES */
  code: ErrorCode
  /** User-friendly error message */
  message: string
  /** Additional error details (optional) */
  details?: string
  /** Actionable suggestion for recovery */
  suggestion: string
  /** Whether the error is recoverable via retry */
  recoverable: boolean
  /** Timestamp when the error occurred (Unix epoch in milliseconds) */
  timestamp: number
  /** Original error object for debugging (optional) */
  originalError?: unknown
}

/**
 * Represents the state of the project creation process.
 * This is a discriminated union where the status field determines the available properties.
 */
export type ProjectCreationState =
  | /** Initial state, no project creation in progress */
    { status: 'idle' }
  | /** Project is being created via API */
    { status: 'creating'; startTime: number; retryCount: number }
  | /** Project created, waiting for it to become ready */
    { status: 'waiting'; projectId: string; startTime: number }
  | /** Creation or waiting phase timed out */
    { status: 'timeout'; projectId: string; elapsed: number }
  | /** An error occurred during creation */
    { status: 'error'; error: ProjectCreationError; retryCount: number }
  | /** Waiting for retry attempt with countdown */
    { status: 'retrying'; error: ProjectCreationError; retryCount: number; nextAttemptIn: number }
  | /** Project created successfully and ready */
    { status: 'success'; projectId: string }
  | /** Project creation was cancelled by user */
    { status: 'cancelled' }

/**
 * Timeout configuration for different phases of project creation.
 * All values are in milliseconds.
 */
export const TIMEOUT_CONFIG = {
  /** Maximum time to wait for initial project creation API call */
  CREATION_TIMEOUT: 60_000,      // 60 seconds
  /** Maximum time to wait for project to become 'ready' after creation */
  WAITING_TIMEOUT: 120_000,      // 120 seconds
  /** Delays for retry attempts with exponential backoff */
  RETRY_DELAYS: [2_000, 5_000, 10_000],  // 2s, 5s, 10s
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3
} as const

/**
 * Type alias for project creation status values.
 */
export type ProjectCreationStatus = ProjectCreationState['status']

/**
 * Context information about the project creation operation.
 * Used for tracking and debugging purposes.
 */
export interface ProjectCreationContext {
  /** Unique identifier for this creation attempt */
  attemptId: string
  /** User ID who initiated the creation */
  userId?: string
  /** Project name being created */
  projectName: string
  /** Framework selected for the project */
  framework: string
  /** Language selected for the project */
  language: string
  /** Timestamp when creation was initiated */
  startTime: number
  /** Current retry count */
  retryCount: number
  /** Total number of files generated (if available) */
  filesGenerated?: number
  /** Total number of files expected (if available) */
  totalFiles?: number
}

/**
 * Options for configuring project creation behavior.
 */
export interface ProjectCreationOptions {
  /** Callback invoked when state changes */
  onStateChange?: (state: ProjectCreationState) => void
  /** Callback invoked when an error occurs */
  onError?: (error: ProjectCreationError) => void
  /** Callback invoked when project creation succeeds */
  onSuccess?: (project: Project) => void
  /** Custom timeout configuration (overrides defaults) */
  timeoutConfig?: Partial<typeof TIMEOUT_CONFIG>
  /** Whether to enable automatic retry for recoverable errors */
  enableAutoRetry?: boolean
}

/**
 * Progress information during project creation.
 */
export interface ProjectCreationProgress {
  /** Progress percentage (0-100) */
  progress: number
  /** Number of files generated so far */
  filesGenerated: number
  /** Total number of files expected */
  totalFiles: number
  /** Current phase of creation */
  phase: 'initializing' | 'generating' | 'finalizing'
}

/**
 * Retry configuration options.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Array of delays between retries (in milliseconds) */
  delays?: number[]
  /** Function to determine if an error should be retried */
  shouldRetry?: (error: ProjectCreationError) => boolean
  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: ProjectCreationError) => void
  /** Callback invoked when max retries are reached */
  onMaxRetriesReached?: (error: ProjectCreationError) => void
}

/**
 * Status of retry operations.
 */
export interface RetryStatus {
  /** Whether a retry is currently in progress */
  isRetrying: boolean
  /** Current retry attempt number */
  attempt: number
  /** Time until next retry (in milliseconds, if retrying) */
  nextRetryIn?: number
}
