'use client'

import { Project, projectsService } from '@/services/api/projects'
import type { ProjectCreationError } from '@/types/projectCreation'
import { ErrorType } from '@/types/projectCreation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export type AIProject = Project

/**
 * Return type for useAIProject hook.
 * Provides project CRUD operations and real-time updates.
 */
export interface UseAIProjectReturn {
  /** The current project data */
  project: Project | null
  /** Whether a project operation is in progress */
  loading: boolean
  /** Error information if an operation failed */
  error: ProjectCreationError | null
  /** Loads a project by ID */
  loadProject: (id: string) => Promise<void>
  /** Updates a project with partial data */
  updateProject: (id: string, data: Partial<Project>) => Promise<Project | null>
  /** Deletes a project by ID */
  deleteProject: (id: string) => Promise<boolean>
  /** Clears the current error state */
  clearError: () => void
}

/**
 * Hook for managing AI project operations.
 * 
 * This hook provides CRUD operations for projects and subscribes to real-time updates
 * via Feathers.js onPatched events. It focuses on project management operations
 * after a project has been created.
 * 
 * Note: Project creation should be handled by the useProjectCreation hook.
 * 
 * @example
 * ```typescript
 * const {
 *   project,
 *   loading,
 *   error,
 *   loadProject,
 *   updateProject,
 *   deleteProject,
 *   clearError
 * } = useAIProject('project-id')
 * 
 * // Load a project
 * await loadProject('project-id')
 * 
 * // Update project
 * await updateProject('project-id', { name: 'New Name' })
 * 
 * // Delete project
 * await deleteProject('project-id')
 * ```
 * 
 * @param projectId - Optional project ID to load and track
 * @param initialProject - Optional initial project data
 * @returns An object containing project data, loading state, and CRUD operations
 */
export function useAIProject(projectId?: string, initialProject: Project | null = null): UseAIProjectReturn {
  const [project, setProject] = useState<Project | null>(initialProject)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ProjectCreationError | null>(null)

  // Real-time updates via Feathers.js onPatched
  useEffect(() => {
    if (!projectId) return

    const unsubscribePatched = projectsService.onPatched((updatedProject) => {
      if (updatedProject._id === projectId) {
        setProject(updatedProject)
      }
    })

    return () => {
      unsubscribePatched()
    }
  }, [projectId])

  /**
   * Loads a project by ID.
   * 
   * @param id - The project ID to load
   * @throws Will throw an error if the project cannot be loaded
   */
  const loadProject = useCallback(async (id: string) => {
    if (!id) {
      console.warn('[useAIProject] Cannot load project: no ID provided')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const loadedProject = await projectsService.get(id)
      setProject(loadedProject)
    } catch (err) {
      console.error('[useAIProject] Failed to load project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project'
      setError({
        type: ErrorType.UNKNOWN,
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        suggestion: 'Please try again or contact support if the problem persists.',
        recoverable: true,
        timestamp: Date.now(),
        originalError: err
      })
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Updates a project with partial data.
   * 
   * @param id - The project ID to update
   * @param data - Partial project data to update
   * @returns The updated project, or null if the update failed
   */
  const updateProject = useCallback(async (id: string, data: Partial<Project>): Promise<Project | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const updatedProject = await projectsService.patch(id, data)
      setProject(updatedProject)
      return updatedProject
    } catch (err) {
      console.error('[useAIProject] Failed to update project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project'
      setError({
        type: ErrorType.UNKNOWN,
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        suggestion: 'Please try again or contact support if the problem persists.',
        recoverable: true,
        timestamp: Date.now(),
        originalError: err
      })
      toast.error('Failed to update project')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Deletes a project by ID.
   * 
   * @param id - The project ID to delete
   * @returns true if the project was deleted successfully, false otherwise
   */
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await projectsService.remove(id)
      setProject(null)
      toast.success('Project deleted successfully')
      return true
    } catch (err) {
      console.error('[useAIProject] Failed to delete project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project'
      setError({
        type: ErrorType.UNKNOWN,
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        suggestion: 'Please try again or contact support if the problem persists.',
        recoverable: true,
        timestamp: Date.now(),
        originalError: err
      })
      toast.error('Failed to delete project')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    project,
    loading,
    error,
    loadProject,
    updateProject,
    deleteProject,
    clearError
  }
}
