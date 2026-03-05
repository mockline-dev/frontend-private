'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react'

interface ProjectCreationLoaderProps {
  stage: 'initializing' | 'generating' | 'validating' | 'completing' | 'error'
  progress: number
  filesGenerated?: number
  totalFiles?: number
  error?: string | undefined
}

export function ProjectCreationLoader({
  stage,
  progress,
  filesGenerated = 0,
  totalFiles = 0,
  error
}: ProjectCreationLoaderProps) {
  const stages = [
    { key: 'initializing', label: 'Initializing project...' },
    { key: 'generating', label: 'Generating backend files...' },
    { key: 'validating', label: 'Validating generated code...' },
    { key: 'completing', label: 'Finalizing project...' }
  ]

  const currentStageIndex = stages.findIndex(s => s.key === stage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              stage === 'error' ? 'bg-red-100' : 'bg-violet-100'
            }`}>
              {stage === 'error' ? (
                <AlertCircle className="w-10 h-10 text-red-600" />
              ) : stage === 'completing' ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
              )}
            </div>
            {stage !== 'error' && stage !== 'completing' && (
              <div className="absolute inset-0 rounded-full border-2 border-violet-200 animate-ping" />
            )}
          </div>
        </div>

        {/* Stage Indicator */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {stage === 'error' ? 'Project Creation Failed' :
             stage === 'completing' ? 'Project Ready!' :
             stages[currentStageIndex]?.label || 'Creating project...'}
          </h2>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Progress Bar */}
        {stage !== 'error' && stage !== 'completing' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 text-center">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* File Generation Progress */}
        {stage === 'generating' && totalFiles > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Files generated</span>
              <span className="font-medium text-gray-900">
                {filesGenerated} / {totalFiles}
              </span>
            </div>
            <Progress value={(filesGenerated / totalFiles) * 100} className="h-1" />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText className="w-3 h-3" />
              <span>Creating backend structure...</span>
            </div>
          </div>
        )}

        {/* Stage Progress */}
        <div className="space-y-2">
          {stages.map((s, index) => (
            <div
              key={s.key}
              className={`flex items-center gap-3 text-sm ${
                index < currentStageIndex ? 'text-green-600' :
                index === currentStageIndex ? 'text-violet-600' :
                'text-gray-400'
              }`}
            >
              {index < currentStageIndex ? (
                <CheckCircle className="w-4 h-4" />
              ) : index === currentStageIndex ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
