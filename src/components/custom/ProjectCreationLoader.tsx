'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GenerationProgress, Project } from '@/types/feathers';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle, FileText, Loader2 } from 'lucide-react';

/**
 * Props for ProjectCreationLoader component.
 * Fully stateless - all data passed as props.
 */
export interface ProjectCreationLoaderProps {
    /** Current status of project creation process */
    status: 'idle' | 'creating' | 'generating' | 'ready' | 'error';
    /** The project being created (null if no project in progress) */
    project: Project | null;
    /** Progress information during creation */
    progress: GenerationProgress | null;
    /** Error message if creation failed */
    error: string | null;
    /** Callback invoked when user clicks retry */
    onRetry?: () => void;
    /** Callback invoked when user clicks back to dashboard */
    onBackToDashboard?: () => void;
    /** Callback invoked when user cancels creation */
    onCancel?: () => void;
}

/**
 * Formats milliseconds into a human-readable time string.
 * @param ms - Time in milliseconds
 * @returns Formatted time string (e.g., "1m 30s")
 */
function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
}

/**
 * Stateless Project Creation Loader Component.
 *
 * This component displays project creation progress with comprehensive error handling,
 * retry functionality, and timeout warnings. It supports all states from the refactored hook:
 * - idle: Initial state, no operation in progress
 * - creating: Project is being created via API
 * - generating: Project created, AI is generating files
 * - ready: Project created successfully and ready
 * - error: An error occurred during creation
 *
 * @example
 * ```tsx
 * <ProjectCreationLoader
 *   status={state.status}
 *   project={state.project}
 *   progress={state.progress}
 *   error={state.error}
 *   onRetry={onRetry}
 *   onBackToDashboard={() => router.push('/dashboard')}
 *   onCancel={onCancel}
 * />
 * ```
 */
export function ProjectCreationLoader({ status, project, progress, error, onRetry, onBackToDashboard, onCancel }: ProjectCreationLoaderProps) {
    // Determine if we should show timeout warning
    const isTimeoutWarning = status === 'creating' || status === 'generating';
    const showTimeoutWarning = isTimeoutWarning && progress !== null && progress.percentage > 80;

    // Get content based on state
    const getContent = () => {
        switch (status) {
            case 'idle':
                return {
                    icon: <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />,
                    iconBg: 'bg-violet-100',
                    title: 'Ready to Create Project',
                    message: 'Initializing...',
                    showProgress: false,
                    showActions: false
                };

            case 'creating':
                return {
                    icon: <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />,
                    iconBg: 'bg-violet-100',
                    title: 'Creating Project...',
                    message: 'Initializing your project with AI',
                    showProgress: true,
                    showActions: false
                };

            case 'generating':
                return {
                    icon: <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />,
                    iconBg: 'bg-blue-100',
                    title: 'Generating Files...',
                    message: 'AI is creating your project structure',
                    showProgress: true,
                    showActions: false
                };

            case 'ready':
                return {
                    icon: <CheckCircle className="w-10 h-10 text-green-600" />,
                    iconBg: 'bg-green-100',
                    title: 'Project Ready!',
                    message: 'Your project has been created successfully',
                    showProgress: false,
                    showActions: false
                };

            case 'error':
                return {
                    icon: <AlertCircle className="w-10 h-10 text-red-600" />,
                    iconBg: 'bg-red-100',
                    title: 'Project Creation Failed',
                    message: error || 'An error occurred during project creation',
                    showProgress: false,
                    showActions: true
                };

            default:
                return {
                    icon: <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />,
                    iconBg: 'bg-violet-100',
                    title: 'Creating Project...',
                    message: 'Please wait...',
                    showProgress: true,
                    showActions: false
                };
        }
    };

    const content = getContent();
    const progressPercentage = progress?.percentage || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                    {/* Animated Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${content.iconBg}`}>{content.icon}</div>
                            {(status === 'creating' || status === 'generating') && (
                                <div className="absolute inset-0 rounded-full border-2 border-violet-200 animate-ping" />
                            )}
                        </div>
                    </div>

                    {/* Title and Message */}
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
                        <p className="text-sm text-gray-600">{content.message}</p>
                    </div>

                    {/* Progress Bar */}
                    {content.showProgress && (
                        <div className="space-y-2">
                            <Progress value={progressPercentage} className="h-2" />
                            <p className="text-xs text-gray-500 text-center">{Math.round(progressPercentage)}% complete</p>
                        </div>
                    )}

                    {/* File Generation Progress */}
                    {status === 'generating' && progress && progress.totalFiles > 0 && (
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
                                <span>{progress.currentStage}</span>
                            </div>
                        </div>
                    )}

                    {/* Error Details */}
                    {error && status === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error Details</AlertTitle>
                            <AlertDescription>
                                <p>{error}</p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Timeout Warning */}
                    {showTimeoutWarning && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Taking Longer Than Expected</AlertTitle>
                            <AlertDescription>
                                Project creation is taking longer than usual. This is normal for complex projects. You can wait or cancel and try again.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    {content.showActions && (
                        <div className="space-y-3">
                            {/* Retry Button */}
                            {onRetry && status === 'error' && (
                                <Button onClick={onRetry} className="w-full">
                                    Retry Creation
                                </Button>
                            )}

                            {/* Cancel Button */}
                            {onCancel && (status === 'creating' || status === 'generating') && (
                                <Button onClick={onCancel} variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            )}

                            {/* Back to Dashboard Button */}
                            {onBackToDashboard && (
                                <Button onClick={onBackToDashboard} variant="outline" className="w-full">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
