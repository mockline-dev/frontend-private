'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { type ProjectCreationProgress, type ProjectCreationState } from '@/types/projectCreation'
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle, Clock, FileText, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Props for ProjectCreationLoader component.
 */
export interface ProjectCreationLoaderProps {
  /** Current state of project creation process */
  state: ProjectCreationState
  /** Progress information during creation */
  progress: ProjectCreationProgress
  /** Callback invoked when user clicks retry */
  onRetry?: () => void
  /** Callback invoked when user clicks back to dashboard */
  onBackToDashboard?: () => void
  /** Callback invoked when user cancels creation */
  onCancel?: () => void
}

/**
 * Formats milliseconds into a human-readable time string.
 * @param ms - Time in milliseconds
 * @returns Formatted time string (e.g., "1m 30s")
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

/**
 * Formats milliseconds into a countdown string.
 * @param ms - Time in milliseconds
 * @returns Formatted countdown string (e.g., "Retrying in 5s")
 */
function formatCountdown(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  return `${seconds}s`
}

/**
 * Enhanced Project Creation Loader Component.
 * 
 * This component displays project creation progress with comprehensive error handling,
 * retry functionality, and timeout warnings. It supports all 8 states from state machine:
 * - idle: Initial state, no operation in progress
 * - creating: Project is being created via API
 * - waiting: Project created, waiting for it to become ready
 * - timeout: Creation or waiting phase timed out
 * - error: An error occurred during creation
 * - retrying: Waiting for retry attempt with countdown
 * - success: Project created successfully and ready
 * - cancelled: Project creation was cancelled by user
 * 
 * @example
 * ```tsx
 * <ProjectCreationLoader
 *   state={creationState}
 *   progress={progress}
 *   onRetry={canRetry ? retryCreation : undefined}
 *   onBackToDashboard={() => router.push('/dashboard')}
 *   onCancel={cancelCreation}
 * />
 * ```
 */
export function ProjectCreationLoader({
  state,
  progress,
  onRetry,
  onBackToDashboard,
  onCancel
}: ProjectCreationLoaderProps) {
  const [retryCountdown, setRetryCountdown] = useState<number>(0)
  const initialRetryTimeRef = useRef<number>(0)

  // Handle retry countdown when in retrying state
  useEffect(() => {
    if (state.status === 'retrying') {
      initialRetryTimeRef.current = state.nextAttemptIn

      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          const next = prev <= 1000 ? 0 : prev - 1000
          if (next === 0) clearInterval(interval)
          return next
        })
      }, 1000)

      // Initialise via the interval's first synthetic tick using a timeout of 0
      const init = setTimeout(() => setRetryCountdown(initialRetryTimeRef.current), 0)

      return () => {
        clearInterval(interval)
        clearTimeout(init)
      }
    } else {
      const reset = setTimeout(() => setRetryCountdown(0), 0)
      return () => clearTimeout(reset)
    }
  }, [state.status])

  // Determine if we should show timeout warning
  const isTimeoutWarning = state.status === 'creating' || state.status === 'waiting'
  const showTimeoutWarning = isTimeoutWarning && progress.progress > 80

  // Get error details if in error state
  const error = state.status === 'error' ? state.error : state.status === 'retrying' ? state.error : undefined

  // Get content based on state
  const getContent = () => {
    switch (state.status) {
      case 'idle':
        return {
          icon: <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />,
          iconBg: 'bg-violet-100',
          title: 'Ready to Create Project',
          message: 'Initializing...',
          showProgress: false,
          showActions: false
        }

      case 'creating':
        return {
          icon: <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />,
          iconBg: 'bg-violet-100',
          title: 'Creating Project...',
          message: 'Initializing your project with AI',
          showProgress: true,
          showActions: false
        }

      case 'waiting':
        return {
          icon: <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />,
          iconBg: 'bg-blue-100',
          title: 'Generating Files...',
          message: 'AI is creating your project structure',
          showProgress: true,
          showActions: false
        }

      case 'timeout':
        return {
          icon: <Clock className="w-10 h-10 text-amber-600" />,
          iconBg: 'bg-amber-100',
          title: 'Taking Longer Than Expected',
          message: 'Project creation is taking longer than usual',
          showProgress: false,
          showActions: true
        }

      case 'error':
        return {
          icon: <AlertCircle className="w-10 h-10 text-red-600" />,
          iconBg: 'bg-red-100',
          title: 'Project Creation Failed',
          message: error?.message || 'An error occurred during project creation',
          showProgress: false,
          showActions: true
        }

      case 'retrying':
        return {
          icon: <RefreshCw className="w-10 h-10 text-amber-600 animate-spin" />,
          iconBg: 'bg-amber-100',
          title: 'Retrying...',
          message: `Retrying in ${formatCountdown(retryCountdown)}`,
          showProgress: false,
          showActions: true
        }

      case 'success':
        return {
          icon: <CheckCircle className="w-10 h-10 text-green-600" />,
          iconBg: 'bg-green-100',
          title: 'Project Ready!',
          message: 'Your project has been created successfully',
          showProgress: false,
          showActions: false
        }

      case 'cancelled':
        return {
          icon: <AlertCircle className="w-10 h-10 text-gray-600" />,
          iconBg: 'bg-gray-100',
          title: 'Project Creation Cancelled',
          message: 'The operation was cancelled',
          showProgress: false,
          showActions: true
        }

      default:
        return {
          icon: <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />,
          iconBg: 'bg-violet-100',
          title: 'Creating Project...',
          message: 'Please wait...',
          showProgress: true,
          showActions: false
        }
    }
  }

  const content = getContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${content.iconBg}`}>
                {content.icon}
              </div>
              {(state.status === 'creating' || state.status === 'waiting') && (
                <div className="absolute inset-0 rounded-full border-2 border-violet-200 animate-ping" />
              )}
            </div>
          </div>

          {/* Title and Message */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {content.title}
            </h2>
            <p className="text-sm text-gray-600">
              {content.message}
            </p>
          </div>

          {/* Progress Bar */}
          {content.showProgress && (
            <div className="space-y-2">
              <Progress value={progress.progress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">{Math.round(progress.progress)}% complete</p>
            </div>
          )}

          {/* File Generation Progress */}
          {state.status === 'waiting' && progress.totalFiles > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Files generated</span>
                <span className="font-medium text-gray-900">
                  {progress.filesGenerated} / {progress.totalFiles}
                </span>
              </div>
              <Progress value={(progress.filesGenerated / progress.totalFiles) * 100} className="h-1" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileText className="w-3 h-3" />
                <span>Creating backend structure...</span>
              </div>
            </div>
          )}

          {/* Error Details */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error.message}</p>
                {error.suggestion && (
                  <p className="font-medium">Suggestion: {error.suggestion}</p>
                )}
                {error.details && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      Technical Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {error.details}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Timeout Warning */}
          {showTimeoutWarning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Taking Longer Than Expected</AlertTitle>
              <AlertDescription>
                Project creation is taking longer than usual. This is normal for complex projects.
                You can wait or cancel and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {content.showActions && (
            <div className="space-y-3">
              {/* Retry Button */}
              {onRetry && (state.status === 'error' || state.status === 'timeout') && (
                <Button
                  onClick={onRetry}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Creation
                </Button>
              )}

              {/* Cancel Button */}
              {onCancel && (state.status === 'creating' || state.status === 'waiting') && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              )}

              {/* Back to Dashboard Button */}
              {onBackToDashboard && (
                <Button
                  onClick={onBackToDashboard}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Retry Information */}
        {state.status === 'error' && error && error.recoverable && onRetry && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  You can retry this operation
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  This error appears to be recoverable. Click the retry button above to try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Code Reference */}
        {error && (
          <div className="text-center text-xs text-gray-500">
            Error Code: {error.code}
          </div>
        )}
      </div>
    </div>
  )
}
