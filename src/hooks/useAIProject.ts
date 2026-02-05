'use client'

import { useState, useEffect } from 'react'
import { aiProjectsService, AIProject, CreateAIProjectData } from '@/services/api/aiProjects'
import { toast } from 'sonner'

export function useAIProject(projectId?: string) {
  const [project, setProject] = useState<AIProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load project if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId)
    }
  }, [projectId])

  // Listen for real-time project updates
  useEffect(() => {
    if (!project) return

    const unsubscribePatched = aiProjectsService.onPatched((updatedProject) => {
      if (updatedProject._id === project._id) {
        setProject(updatedProject)
        
        // Show toast for status changes
        if (updatedProject.status === 'ready' && project.status === 'generating') {
          toast.success('Project generated successfully!')
        } else if (updatedProject.status === 'error' && project.status === 'generating') {
          toast.error('Project generation failed')
        }
      }
    })

    const unsubscribeUpdated = aiProjectsService.onUpdated((updatedProject) => {
      if (updatedProject._id === project._id) {
        setProject(updatedProject)
      }
    })

    return () => {
      unsubscribePatched()
      unsubscribeUpdated()
    }
  }, [project])

  const loadProject = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const loadedProject = await aiProjectsService.get(id)
      setProject(loadedProject)
    } catch (err) {
      console.error('Failed to load project:', err)
      setError('Failed to load project')
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (data: CreateAIProjectData): Promise<AIProject | null> => {
    try {
      setLoading(true)
      setError(null)
      const newProject = await aiProjectsService.create(data)
      setProject(newProject)
      toast.success('Project creation started!')
      return newProject
    } catch (err) {
      console.error('Failed to create project:', err)
      setError('Failed to create project')
      toast.error('Failed to create project')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: string, data: Partial<AIProject>): Promise<AIProject | null> => {
    try {
      setLoading(true)
      setError(null)
      const updatedProject = await aiProjectsService.patch(id, data)
      setProject(updatedProject)
      return updatedProject
    } catch (err) {
      console.error('Failed to update project:', err)
      setError('Failed to update project')
      toast.error('Failed to update project')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await aiProjectsService.remove(id)
      setProject(null)
      toast.success('Project deleted successfully')
      return true
    } catch (err) {
      console.error('Failed to delete project:', err)
      setError('Failed to delete project')
      toast.error('Failed to delete project')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    project,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    loadProject
  }
}