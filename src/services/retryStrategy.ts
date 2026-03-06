/**
 * Retry Strategy Service
 * 
 * This service provides retry logic with exponential backoff for project creation.
 * It manages retry attempts, tracks retry status, and provides cancellation support.
 * The retry strategy is configurable and can be customized per use case.
 */

import {
    ProjectCreationError,
    TIMEOUT_CONFIG,
    type RetryOptions,
    type RetryStatus
} from '@/types/projectCreation'
import { errorHandler } from './errorHandler'

/**
 * Retry Strategy class for executing operations with automatic retry logic.
 * 
 * @example
 * ```typescript
 * const retryStrategy = new RetryStrategy()
 * 
 * try {
 *   const result = await retryStrategy.executeWithRetry(
 *     () => createProject(data),
 *     {
 *       maxRetries: 3,
 *       onRetry: (attempt, error) => {
 *         console.log(`Retry attempt ${attempt}:`, error.message)
 *       }
 *     }
 *   )
 * } catch (error) {
 *   console.error('All retries failed:', error)
 * }
 * ```
 */
export class RetryStrategy {
  private retryTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map()
  private currentAttempt = 0
  private isRetrying = false
  private nextRetryTime: number | null = null
  private timeoutIdCounter = 0

  /**
   * Executes a function with retry logic and exponential backoff.
   * 
   * This method will attempt to execute the provided function, and if it fails,
   * will retry based on the configured options. The retry delays follow an
   * exponential backoff pattern.
   * 
   * @param fn - The async function to execute with retry logic
   * @param options - Optional retry configuration options
   * @returns A promise that resolves with the function result or rejects with the last error
   * 
   * @example
   * ```typescript
   * const result = await retryStrategy.executeWithRetry(
   *   async () => {
   *     return await apiCall()
   *   },
   *   {
   *     maxRetries: 3,
   *     delays: [2_000, 5_000, 10_000],
   *     shouldRetry: (error) => error.recoverable
   *   }
   * )
   * ```
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = TIMEOUT_CONFIG.MAX_RETRIES,
      delays = TIMEOUT_CONFIG.RETRY_DELAYS,
      shouldRetry = () => true,
      onRetry,
      onMaxRetriesReached
    } = options
    
    this.currentAttempt = 0
    this.isRetrying = true
    
    while (this.currentAttempt <= maxRetries) {
      try {
        const result = await fn()
        this.cleanup()
        return result
      } catch (error) {
        const classifiedError = errorHandler.classifyError(error)
        
        // Check if we should retry
        if (this.currentAttempt >= maxRetries || !shouldRetry(classifiedError)) {
          this.cleanup()
          
          if (this.currentAttempt >= maxRetries && onMaxRetriesReached) {
            onMaxRetriesReached(classifiedError)
          }
          
          throw classifiedError
        }
        
        // Calculate delay
        const delayIndex = Math.min(this.currentAttempt, delays.length - 1)
        const delay = delays[delayIndex]!
        
        // Notify retry attempt
        if (onRetry) {
          onRetry(this.currentAttempt + 1, classifiedError)
        }
        
        // Wait for delay
        await this.waitForDelay(delay)
        
        this.currentAttempt++
      }
    }
    
    this.cleanup()
    throw new Error('Max retries exceeded')
  }

  /**
   * Waits for a specified delay before continuing.
   * 
   * This method creates a timeout that resolves after the specified delay.
   * The timeout is tracked and can be cancelled if needed.
   * 
   * @param delay - The delay in milliseconds to wait
   * @returns A promise that resolves after the delay
   * 
   * @private
   */
  private async waitForDelay(delay: number): Promise<void> {
    this.nextRetryTime = Date.now() + delay
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.retryTimeouts.delete(timeoutId)
        this.nextRetryTime = null
        resolve()
      }, delay)
      
      this.retryTimeouts.set(timeoutId, timeoutId)
    })
  }

  /**
   * Cancels all pending retry operations.
   * 
   * This method clears all pending timeouts and resets the retry state.
   * It should be called when the component unmounts or when the user
   * cancels the operation.
   * 
   * @example
   * ```typescript
   * useEffect(() => {
   *   return () => {
   *     retryStrategy.cancel()
   *   }
   * }, [])
   * ```
   */
  cancel(): void {
    this.cleanup()
  }

  /**
   * Gets the current retry status.
   * 
   * This method returns information about the current retry operation,
   * including whether a retry is in progress, the current attempt number,
   * and the time until the next retry.
   * 
   * @returns The current retry status
   * 
   * @example
   * ```typescript
   * const status = retryStrategy.getRetryStatus()
   * if (status.isRetrying && status.nextRetryIn) {
   *   console.log(`Next retry in ${status.nextRetryIn}ms`)
   * }
   * ```
   */
  getRetryStatus(): RetryStatus {
    const status: RetryStatus = {
      isRetrying: this.isRetrying,
      attempt: this.currentAttempt
    }
    
    // Only include nextRetryIn if it has a value
    if (this.nextRetryTime) {
      status.nextRetryIn = Math.max(0, this.nextRetryTime - Date.now())
    }
    
    return status
  }

  /**
   * Cleans up all retry-related resources.
   * 
   * This method clears all pending timeouts and resets the retry state.
   * It is called automatically when a retry operation completes or is cancelled.
   * 
   * @private
   */
  private cleanup(): void {
    this.isRetrying = false
    this.nextRetryTime = null
    
    // Clear all timeouts
    this.retryTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.retryTimeouts.clear()
  }

  /**
   * Checks if an error is recoverable based on its type and properties.
   * 
   * This method uses the ErrorHandler to determine if an error can be retried.
   * It's a convenience method that can be used with the shouldRetry option.
   * 
   * @param error - The error to check
   * @returns true if the error is recoverable, false otherwise
   * 
   * @example
   * ```typescript
   * const retryStrategy = new RetryStrategy()
   * 
   * await retryStrategy.executeWithRetry(
   *   () => apiCall(),
   *   {
   *     shouldRetry: (error) => retryStrategy.isRecoverable(error)
   *   }
   * )
   * ```
   */
  isRecoverable(error: ProjectCreationError): boolean {
    return errorHandler.isRecoverable(error)
  }

  /**
   * Gets the retry delay for a specific error type and attempt number.
   * 
   * This method calculates the appropriate delay before the next retry attempt
   * based on the error type and the current attempt number. It uses the
   * ErrorHandler to determine the delay.
   * 
   * @param error - The error to get the retry delay for
   * @param attempt - The current attempt number (0-indexed)
   * @returns The delay in milliseconds before the next retry
   * 
   * @example
   * ```typescript
   * const delay = retryStrategy.getRetryDelay(classifiedError, 0)
   * console.log(`Retry in ${delay}ms`)
   * ```
   */
  getRetryDelay(error: ProjectCreationError, attempt: number): number {
    return errorHandler.getRetryDelay(error, attempt)
  }

  /**
   * Resets the retry strategy to its initial state.
   * 
   * This method clears all pending operations and resets the retry counters.
   * It can be used to prepare the strategy for a new retry operation.
   * 
   * @example
   * ```typescript
   * retryStrategy.reset()
   * // Now ready for a new retry operation
   * ```
   */
  reset(): void {
    this.cancel()
    this.currentAttempt = 0
  }
}

/**
 * Singleton instance of the RetryStrategy class.
 * Use this for consistent retry behavior across the application.
 */
export const retryStrategy = new RetryStrategy()
