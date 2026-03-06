'use client'

import { Project, projectsService } from '@/services/api/projects'
import { errorHandler } from '@/services/errorHandler'
import { retryStrategy } from '@/services/retryStrategy'
import { timeoutManager } from '@/services/timeoutManager'
import {
  ERROR_CODES,
  ErrorType,
  ProjectCreationOptions,
  ProjectCreationProgress,
  ProjectCreationState,
  TIMEOUT_CONFIG,
  type ProjectCreationError
} from '@/types/projectCreation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

/**
 * Return type for the useProjectCreation hook.
 * Provides all necessary state, actions, and computed values for managing project creation.
 */
export interface UseProjectCreationReturn {
  /** Current state of the project creation process */
  state: ProjectCreationState
  /** The project being created (null if no project in progress) */
  project: Project | null
  /** Progress information during creation */
  progress: ProjectCreationProgress
  /** Creates a new project with the provided data */
  createProject: (data: { name: string; description: string; framework: string; language: string; model: string; [key: string]: unknown }) => Promise<void>
  /** Retries a failed project creation attempt */
  retryCreation: () => Promise<void>
  /** Cancels the current project creation operation */
  cancelCreation: () => void
  /** Resets the state to idle */
  resetState: () => void
  /** Whether a creation or waiting operation is in progress */
  isCreating: boolean
  /** Whether a retry is in progress */
  isRetrying: boolean
  /** Whether the operation can be retried */
  canRetry: boolean
  /** Time elapsed since the operation started (in milliseconds) */
  timeElapsed: number
}

/**
 * Hook for managing project creation with robust error handling.
 * 
 * This hook implements a state machine with 8 states: idle, creating, waiting, timeout, error, retrying, success, cancelled.
 * It integrates with errorHandler, retryStrategy, and timeoutManager services to provide comprehensive error handling.
 * 
 * @example
 * ```typescript
 * const {
 *   state,
 *   project,
 *   createProject,
 *   retryCreation,
 *   cancelCreation,
 *   resetState,
 *   isCreating,
 *   canRetry,
 *   timeElapsed
 * } = useProjectCreation({
 *   onSuccess: (project) => {
 *     console.log('Project created:', project.name)
 *   },
 *   onError: (error) => {
 *     console.error('Creation failed:', error.message)
 *   }
 * })
 * 
 * // Create a project
 * await createProject({
 *   name: 'My Project',
 *   description: 'A test project',
 *   framework: 'fast-api',
 *   language: 'python',
 *   model: 'gpt-4'
 * })
 * ```
 * 
 * @param options - Optional configuration for the hook
 * @returns An object containing state, actions, and computed values
 */
export function useProjectCreation(options?: ProjectCreationOptions): UseProjectCreationReturn {
  // State management
  const [state, setState] = useState<ProjectCreationState>({ status: 'idle' })
  const [project, setProject] = useState<Project | null>(null)
  const [progress, setProgress] = useState<ProjectCreationProgress>({
    progress: 0,
    filesGenerated: 0,
    totalFiles: 0,
    phase: 'initializing'
  })

  // Refs for tracking state and avoiding closure issues
  const projectIdRef = useRef<string | undefined>(undefined)
  const isMountedRef = useRef(true)
  const currentDataRef = useRef<{ name: string; description: string; framework: string; language: string; model: string; [key: string]: unknown } | null>(null)
  const currentRetryCountRef = useRef(0)
  const currentErrorRef = useRef<ProjectCreationError | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Service instances - using exported singletons
  // Note: errorHandler, retryStrategy, and timeoutManager are imported as singletons

  // Merged timeout configuration
  const timeoutConfig = useMemo(() => ({
    ...TIMEOUT_CONFIG,
    ...options?.timeoutConfig
  }), [options?.timeoutConfig])

  /**
   * Updates the state and calls the onStateChange callback if provided.
   */
  const updateState = useCallback((newState: ProjectCreationState) => {
    console.log('[useProjectCreation] updateState:', { from: state.status, to: newState.status, newState });
    if (!isMountedRef.current) return

    setState(newState)

    // Update refs based on new state
    if (newState.status === 'error') {
      currentErrorRef.current = newState.error
      currentRetryCountRef.current = newState.retryCount
    } else if (newState.status === 'creating' || newState.status === 'waiting') {
      startTimeRef.current = newState.startTime
      if (newState.status === 'creating') {
        currentRetryCountRef.current = newState.retryCount
      }
    } else if (newState.status === 'timeout') {
      startTimeRef.current = null
    }

    options?.onStateChange?.(newState)
  }, [options, state.status])

  /**
   * Handles project creation with error handling and retry logic.
   */
  const createProject = useCallback(async (data: { name: string; description: string; framework: string; language: string; model: string; [key: string]: unknown }) => {
    // Prevent concurrent operations
    if (state.status !== 'idle' && state.status !== 'error' && state.status !== 'cancelled') {
      console.warn('[useProjectCreation] Cannot create project: operation already in progress')
      return
    }

    // Store data for retry
    currentDataRef.current = data
    currentRetryCountRef.current = 0
    currentErrorRef.current = null

    // Set creating state
    const startTime = Date.now()
    startTimeRef.current = startTime
    updateState({ status: 'creating', startTime, retryCount: 0 })

    try {
      // Validate framework and language
      const validFrameworks = ['fast-api', 'feathers']
      const validLanguages = ['python', 'typescript']

      if (!validFrameworks.includes(data.framework)) {
        throw new Error(`Invalid framework: ${data.framework}. Must be one of: ${validFrameworks.join(', ')}`)
      }

      if (!validLanguages.includes(data.language)) {
        throw new Error(`Invalid language: ${data.language}. Must be one of: ${validLanguages.join(', ')}`)
      }

      // Set creation timeout
      timeoutManager.setTimeout('creation', () => {
        if (isMountedRef.current && startTimeRef.current !== null) {
          const error = errorHandler.classifyError(new Error('Project creation timed out'))
          updateState({
            status: 'error',
            error,
            retryCount: currentRetryCountRef.current
          })
          options?.onError?.(error)
        }
      }, timeoutConfig.CREATION_TIMEOUT)

      // Create project with retry strategy
      const newProject = await retryStrategy.executeWithRetry(
        async () => {
          return await projectsService.create(data)
        },
        {
          maxRetries: timeoutConfig.MAX_RETRIES,
          delays: [...timeoutConfig.RETRY_DELAYS],
          shouldRetry: (error) => errorHandler.isRecoverable(error),
          onRetry: (attempt, error) => {
            currentRetryCountRef.current = attempt
            currentErrorRef.current = error
            updateState({
              status: 'retrying',
              error,
              retryCount: attempt,
              nextAttemptIn: errorHandler.getRetryDelay(error, attempt - 1)
            })
          }
        }
      )

      // Clear creation timeout
      timeoutManager.clearTimeout('creation')

      if (!isMountedRef.current) return

      // Store project ID
      projectIdRef.current = newProject._id
      setProject(newProject)

      // Transition to waiting state
      const waitingStartTime = Date.now()
      startTimeRef.current = waitingStartTime
      updateState({
        status: 'waiting',
        projectId: newProject._id,
        startTime: waitingStartTime
      })

      // Set waiting timeout
      timeoutManager.setTimeout('waiting', () => {
        if (isMountedRef.current && projectIdRef.current) {
          const elapsed = timeoutManager.getElapsedTime(waitingStartTime)
          updateState({
            status: 'timeout',
            projectId: newProject._id,
            elapsed
          })
        }
      }, timeoutConfig.WAITING_TIMEOUT)

      toast.success('Project creation started!')

    } catch (error) {
      // Clear creation timeout
      timeoutManager.clearTimeout('creation')

      if (!isMountedRef.current) return

      // Classify error
      const classifiedError = errorHandler.classifyError(error)
      currentErrorRef.current = classifiedError

      // Update state to error
      updateState({
        status: 'error',
        error: classifiedError,
        retryCount: currentRetryCountRef.current
      })

      // Call error callback
      options?.onError?.(classifiedError)

      // Show error toast
      toast.error(classifiedError.message)
    }
  }, [state.status, updateState, errorHandler, retryStrategy, timeoutManager, timeoutConfig, options])

  /**
   * Retries a failed project creation attempt.
   */
  const retryCreation = useCallback(async () => {
    if (state.status !== 'error' && state.status !== 'timeout') {
      console.warn('[useProjectCreation] Cannot retry: not in error or timeout state')
      return
    }

    const error = currentErrorRef.current
    const retryCount = currentRetryCountRef.current

    // Check if retry is allowed
    if (retryCount >= timeoutConfig.MAX_RETRIES) {
      console.warn('[useProjectCreation] Cannot retry: max retries reached')
      return
    }

    // Check if error is recoverable
    if (error && !errorHandler.isRecoverable(error)) {
      console.warn('[useProjectCreation] Cannot retry: error is not recoverable')
      return
    }

    // Get retry delay
    const delay = error ? errorHandler.getRetryDelay(error, retryCount) : timeoutConfig.RETRY_DELAYS[0]

    // Update state to retrying
    const retryError = error || {
      type: ErrorType.UNKNOWN,
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: 'Retrying project creation',
      suggestion: 'Please wait while we retry...',
      recoverable: true,
      timestamp: Date.now()
    }
    
    currentErrorRef.current = retryError
    currentRetryCountRef.current = retryCount + 1
    
    updateState({
      status: 'retrying',
      error: retryError,
      retryCount: retryCount + 1,
      nextAttemptIn: delay
    })

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delay))

    // Check if still mounted
    if (!isMountedRef.current) return

    // Retry creation directly without going through createProject to maintain retrying state
    // We'll call the internal creation logic directly
    if (currentDataRef.current) {
      try {
        // Validate framework and language
        const validFrameworks = ['fast-api', 'feathers']
        const validLanguages = ['python', 'typescript']

        if (!validFrameworks.includes(currentDataRef.current.framework)) {
          throw new Error(`Invalid framework: ${currentDataRef.current.framework}. Must be one of: ${validFrameworks.join(', ')}`)
        }

        if (!validLanguages.includes(currentDataRef.current.language)) {
          throw new Error(`Invalid language: ${currentDataRef.current.language}. Must be one of: ${validLanguages.join(', ')}`)
        }

        // Set creation timeout
        const startTime = Date.now()
        startTimeRef.current = startTime
        
        timeoutManager.setTimeout('creation', () => {
          if (isMountedRef.current && startTimeRef.current !== null) {
            const timeoutError = errorHandler.classifyError(new Error('Project creation timed out'))
            updateState({
              status: 'error',
              error: timeoutError,
              retryCount: currentRetryCountRef.current
            })
            options?.onError?.(timeoutError)
          }
        }, timeoutConfig.CREATION_TIMEOUT)

        // Create project with retry strategy
        const newProject = await retryStrategy.executeWithRetry(
          async () => {
            return await projectsService.create(currentDataRef.current!)
          },
          {
            maxRetries: timeoutConfig.MAX_RETRIES,
            delays: [...timeoutConfig.RETRY_DELAYS],
            shouldRetry: (err) => errorHandler.isRecoverable(err),
            onRetry: (attempt, err) => {
              currentRetryCountRef.current = attempt
              currentErrorRef.current = err
              updateState({
                status: 'retrying',
                error: err,
                retryCount: attempt,
                nextAttemptIn: errorHandler.getRetryDelay(err, attempt - 1)
              })
            }
          }
        )

        // Clear creation timeout
        timeoutManager.clearTimeout('creation')

        if (!isMountedRef.current) return

        // Store project ID
        projectIdRef.current = newProject._id
        setProject(newProject)

        // Transition to waiting state
        const waitingStartTime = Date.now()
        startTimeRef.current = waitingStartTime
        updateState({
          status: 'waiting',
          projectId: newProject._id,
          startTime: waitingStartTime
        })

        // Set waiting timeout
        timeoutManager.setTimeout('waiting', () => {
          if (isMountedRef.current && projectIdRef.current) {
            const elapsed = timeoutManager.getElapsedTime(waitingStartTime)
            updateState({
              status: 'timeout',
              projectId: newProject._id,
              elapsed
            })
          }
        }, timeoutConfig.WAITING_TIMEOUT)

        toast.success('Project creation started!')

      } catch (err) {
        // Clear creation timeout
        timeoutManager.clearTimeout('creation')

        if (!isMountedRef.current) return

        // Classify error
        const classifiedError = errorHandler.classifyError(err)
        currentErrorRef.current = classifiedError

        // Update state to error
        updateState({
          status: 'error',
          error: classifiedError,
          retryCount: currentRetryCountRef.current
        })

        // Call error callback
        options?.onError?.(classifiedError)

        // Show error toast
        toast.error(classifiedError.message)
      }
    }
  }, [state.status, timeoutConfig, errorHandler, updateState, createProject])

  /**
   * Cancels the current project creation operation.
   */
  const cancelCreation = useCallback(() => {
    // Clear all timeouts
    timeoutManager.clearTimeoutAll()

    // Cancel retry strategy
    retryStrategy.cancel()

    // Update state to cancelled
    updateState({ status: 'cancelled' })

    // Clear project data
    setProject(null)
    setProgress({
      progress: 0,
      filesGenerated: 0,
      totalFiles: 0,
      phase: 'initializing'
    })
    
    // Clear refs
    currentErrorRef.current = null
    startTimeRef.current = null
  }, [timeoutManager, retryStrategy, updateState])

  /**
   * Resets the state to idle.
   */
  const resetState = useCallback(() => {
    // Clear all timeouts
    timeoutManager.clearTimeoutAll()

    // Cancel retry strategy
    retryStrategy.cancel()

    // Reset state
    updateState({ status: 'idle' })

    // Clear project data
    setProject(null)
    setProgress({
      progress: 0,
      filesGenerated: 0,
      totalFiles: 0,
      phase: 'initializing'
    })

    // Clear refs
    projectIdRef.current = undefined
    currentDataRef.current = null
    currentRetryCountRef.current = 0
    currentErrorRef.current = null
    startTimeRef.current = null
  }, [timeoutManager, retryStrategy, updateState])

  // Real-time updates for project status
  useEffect(() => {
    if (!projectIdRef.current) return

    console.log('[useProjectCreation] Setting up project update listener for:', projectIdRef.current);

    const unsubscribePatched = projectsService.onPatched((updatedProject) => {
      console.log('[useProjectCreation] Project updated:', {
        _id: updatedProject._id,
        status: updatedProject.status,
        generationProgress: updatedProject.generationProgress,
        filesGenerated: updatedProject.filesGenerated,
        totalFiles: updatedProject.totalFiles
      });

      if (updatedProject._id === projectIdRef.current && isMountedRef.current) {
        setProject(updatedProject)

        // Update progress
        if (updatedProject.filesGenerated !== undefined && updatedProject.totalFiles !== undefined) {
          setProgress({
            progress: updatedProject.generationProgress || 0,
            filesGenerated: updatedProject.filesGenerated,
            totalFiles: updatedProject.totalFiles,
            phase: updatedProject.currentStage as 'initializing' | 'generating' | 'finalizing' || 'initializing'
          })
        }

        // Check project status
        if (updatedProject.status === 'ready') {
          console.log('[useProjectCreation] Project is ready!');
          // Clear waiting timeout
          timeoutManager.clearTimeout('waiting')

          // Update state to success
          updateState({
            status: 'success',
            projectId: updatedProject._id
          })

          // Call success callback
          options?.onSuccess?.(updatedProject)

          toast.success('Project created successfully!')
        } else if (updatedProject.status === 'error') {
          console.log('[useProjectCreation] Project has error:', updatedProject.errorMessage);
          // Clear waiting timeout
          timeoutManager.clearTimeout('waiting')

          // Create error from project
          const error = errorHandler.classifyError(new Error(updatedProject.errorMessage || 'Project generation failed'))
          currentErrorRef.current = error

          // Update state to error
          updateState({
            status: 'error',
            error,
            retryCount: currentRetryCountRef.current
          })

          // Call error callback
          options?.onError?.(error)
        }
      }
    })

    return () => {
      console.log('[useProjectCreation] Cleaning up project update listener');
      unsubscribePatched()
    }
  }, [timeoutManager, updateState, errorHandler, options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      timeoutManager.clearTimeoutAll()
      retryStrategy.cancel()
    }
  }, [timeoutManager, retryStrategy])

  // Computed values
  const isCreating = useMemo(() => {
    return state.status === 'creating' || state.status === 'waiting'
  }, [state.status])

  const isRetrying = useMemo(() => {
    return state.status === 'retrying'
  }, [state.status])

  const canRetry = useMemo(() => {
    if (state.status !== 'error' && state.status !== 'timeout') return false
    
    const retryCount = currentRetryCountRef.current
    const error = currentErrorRef.current

    if (retryCount >= timeoutConfig.MAX_RETRIES) return false
    if (error && !errorHandler.isRecoverable(error)) return false

    return true
  }, [state.status, timeoutConfig.MAX_RETRIES, errorHandler])

  const timeElapsed = useMemo(() => {
    if (state.status === 'creating' || state.status === 'waiting') {
      return startTimeRef.current !== null ? timeoutManager.getElapsedTime(startTimeRef.current) : 0
    }
    if (state.status === 'timeout') {
      return state.elapsed
    }
    return 0
  }, [state.status, timeoutManager])

  return {
    state,
    project,
    progress,
    createProject,
    retryCreation,
    cancelCreation,
    resetState,
    isCreating,
    isRetrying,
    canRetry,
    timeElapsed
  }
}
