/**
 * Timeout Manager Service
 * 
 * This service provides timeout management for project creation operations.
 * It manages multiple timeouts with unique keys, supports timeout warnings,
 * and provides elapsed time calculations. The service ensures proper cleanup
 * of timeouts to prevent memory leaks.
 */


/**
 * Timeout Manager class for managing multiple timeouts with unique keys.
 * 
 * @example
 * ```typescript
 * const timeoutManager = new TimeoutManager()
 * 
 * // Set a timeout for project creation
 * timeoutManager.setTimeout('creation', () => {
 *   console.log('Project creation timeout')
 * }, TIMEOUT_CONFIG.CREATION_TIMEOUT)
 * 
 * // Clear the timeout if needed
 * timeoutManager.clearTimeout('creation')
 * 
 * // Clear all timeouts on unmount
 * useEffect(() => {
 *   return () => timeoutManager.clearTimeoutAll()
 * }, [])
 * ```
 */
export class TimeoutManager {
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private startTimes: Map<string, number> = new Map()

  /**
   * Sets a timeout with a unique key.
   * 
   * If a timeout with the same key already exists, it will be cleared
   * before setting the new timeout. This ensures that only one timeout
   * is active for a given key at any time.
   * 
   * @param key - A unique identifier for this timeout
   * @param callback - The function to execute when the timeout expires
   * @param delay - The delay in milliseconds before the callback is executed
   * 
   * @example
   * ```typescript
   * timeoutManager.setTimeout('creation', () => {
   *   handleCreationTimeout()
   * }, 60_000)
   * ```
   */
  setTimeout(key: string, callback: () => void, delay: number): void {
    // Clear existing timeout for the same key
    this.clearTimeout(key)
    
    // Record the start time for this timeout
    this.startTimes.set(key, Date.now())
    
    // Set the new timeout
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(key)
      this.startTimes.delete(key)
      callback()
    }, delay)
    
    this.timeouts.set(key, timeoutId)
  }

  /**
   * Clears a specific timeout by its key.
   * 
   * This method removes the timeout and its associated start time
   * from the internal maps. If no timeout exists for the given key,
   * the method does nothing.
   * 
   * @param key - The key of the timeout to clear
   * 
   * @example
   * ```typescript
   * // Clear the creation timeout when project is ready
   * if (project.status === 'ready') {
   *   timeoutManager.clearTimeout('creation')
   * }
   * ```
   */
  clearTimeout(key: string): void {
    const timeoutId = this.timeouts.get(key)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(key)
      this.startTimes.delete(key)
    }
  }

  /**
   * Clears all active timeouts.
   * 
   * This method removes all timeouts and their associated start times
   * from the internal maps. It should be called when cleaning up
   * resources, such as when a component unmounts.
   * 
   * @example
   * ```typescript
   * useEffect(() => {
   *   // Set up timeouts
   *   timeoutManager.setTimeout('creation', callback, 60_000)
   *   
   *   // Clean up on unmount
   *   return () => {
   *     timeoutManager.clearTimeoutAll()
   *   }
   * }, [])
   * ```
   */
  clearTimeoutAll(): void {
    this.timeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.timeouts.clear()
    this.startTimes.clear()
  }

  /**
   * Calculates the elapsed time since a timeout was started.
   * 
   * This method returns the time in milliseconds that has elapsed
   * since the timeout with the given key was started. If no timeout
   * exists for the key, it returns 0.
   * 
   * @param key - The key of the timeout to check
   * @returns The elapsed time in milliseconds
   * 
   * @example
   * ```typescript
   * const elapsed = timeoutManager.getElapsedTimeForKey('creation')
   * console.log(`Elapsed: ${elapsed}ms`)
   * ```
   */
  getElapsedTimeForKey(key: string): number {
    const startTime = this.startTimes.get(key)
    if (!startTime) {
      return 0
    }
    return Date.now() - startTime
  }

  /**
   * Calculates the elapsed time since a specific start time.
   * 
   * This method returns the time in milliseconds that has elapsed
   * since the provided start time. It's useful for tracking
   * elapsed time for operations that don't use the timeout manager.
   * 
   * @param startTime - The start time in milliseconds (Unix epoch)
   * @returns The elapsed time in milliseconds
   * 
   * @example
   * ```typescript
   * const startTime = Date.now()
   * // ... do some work ...
   * const elapsed = timeoutManager.getElapsedTime(startTime)
   * console.log(`Operation took ${elapsed}ms`)
   * ```
   */
  getElapsedTime(startTime: number): number {
    return Date.now() - startTime
  }

  /**
   * Checks if a timeout with the given key is currently active.
   * 
   * @param key - The key of the timeout to check
   * @returns true if a timeout with the key is active, false otherwise
   * 
   * @example
   * ```typescript
   * if (timeoutManager.hasTimeout('creation')) {
   *   console.log('Creation timeout is active')
   * }
   * ```
   */
  hasTimeout(key: string): boolean {
    return this.timeouts.has(key)
  }

  /**
   * Gets the number of active timeouts.
   * 
   * @returns The count of active timeouts
   * 
   * @example
   * ```typescript
   * const count = timeoutManager.getTimeoutCount()
   * console.log(`Active timeouts: ${count}`)
   * ```
   */
  getTimeoutCount(): number {
    return this.timeouts.size
  }

  /**
   * Gets the remaining time before a timeout expires.
   * 
   * This method calculates the time remaining before the timeout
   * with the given key expires. If no timeout exists for the key,
   * it returns 0.
   * 
   * @param key - The key of the timeout to check
   * @param delay - The original delay in milliseconds
   * @returns The remaining time in milliseconds
   * 
   * @example
   * ```typescript
   * const remaining = timeoutManager.getRemainingTime('creation', 60_000)
   * console.log(`Time remaining: ${remaining}ms`)
   * ```
   */
  getRemainingTime(key: string, delay: number): number {
    const elapsed = this.getElapsedTimeForKey(key)
    return Math.max(0, delay - elapsed)
  }

  /**
   * Checks if a timeout warning should be shown.
   * 
   * This method determines if the timeout has exceeded a warning threshold.
   * The warning threshold is typically 80% of the total timeout duration.
   * 
   * @param key - The key of the timeout to check
   * @param delay - The original delay in milliseconds
   * @param warningThreshold - The warning threshold as a fraction (default: 0.8)
   * @returns true if a warning should be shown, false otherwise
   * 
   * @example
   * ```typescript
   * const shouldWarn = timeoutManager.shouldShowWarning(
   *   'creation',
   *   TIMEOUT_CONFIG.CREATION_TIMEOUT
   * )
   * if (shouldWarn) {
   *   console.log('Project creation is taking longer than expected')
   * }
   * ```
   */
  shouldShowWarning(key: string, delay: number, warningThreshold: number = 0.8): boolean {
    const elapsed = this.getElapsedTimeForKey(key)
    return elapsed >= delay * warningThreshold
  }

  /**
   * Sets a timeout with a warning callback.
   * 
   * This method sets a timeout that will execute a warning callback
   * before the actual timeout expires. The warning callback is
   * executed at the warning threshold (default: 80% of the delay).
   * 
   * @param key - A unique identifier for this timeout
   * @param callback - The function to execute when the timeout expires
   * @param delay - The delay in milliseconds before the callback is executed
   * @param warningCallback - The function to execute when the warning threshold is reached
   * @param warningThreshold - The warning threshold as a fraction (default: 0.8)
   * 
   * @example
   * ```typescript
   * timeoutManager.setTimeoutWithWarning(
   *   'creation',
   *   () => handleCreationTimeout(),
   *   TIMEOUT_CONFIG.CREATION_TIMEOUT,
   *   () => showTimeoutWarning(),
   *   0.8
   * )
   * ```
   */
  setTimeoutWithWarning(
    key: string,
    callback: () => void,
    delay: number,
    warningCallback: () => void,
    warningThreshold: number = 0.8
  ): void {
    // Clear existing timeout for the same key
    this.clearTimeout(key)
    
    // Record the start time for this timeout
    this.startTimes.set(key, Date.now())
    
    // Set the warning timeout
    const warningDelay = delay * warningThreshold
    const warningTimeoutId = setTimeout(() => {
      warningCallback()
    }, warningDelay)
    
    // Set the main timeout
    const timeoutId = setTimeout(() => {
      clearTimeout(warningTimeoutId)
      this.timeouts.delete(key)
      this.startTimes.delete(key)
      callback()
    }, delay)
    
    // Store both timeouts
    this.timeouts.set(key, timeoutId)
    this.timeouts.set(`${key}-warning`, warningTimeoutId)
  }

  /**
   * Resets the timeout manager to its initial state.
   * 
   * This method clears all timeouts and resets the internal state.
   * It can be used to prepare the manager for a new set of operations.
   * 
   * @example
   * ```typescript
   * timeoutManager.reset()
   * // Now ready for new timeouts
   * ```
   */
  reset(): void {
    this.clearTimeoutAll()
  }
}

/**
 * Singleton instance of the TimeoutManager class.
 * Use this for consistent timeout management across the application.
 */
export const timeoutManager = new TimeoutManager()
