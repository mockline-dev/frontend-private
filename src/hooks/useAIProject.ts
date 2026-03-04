'use client'

import { CreateProjectData, Project, projectsService } from '@/services/api/projects'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export type AIProject = Project
export type CreateAIProjectData = CreateProjectData

export function useAIProject(projectId?: string, initialProject: Project | null = null) {
  const [project, setProject] = useState<Project | null>(initialProject)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentProjectIdRef = useRef(projectId || initialProject?._id)
  const initialProjectIdRef = useRef(initialProject?._id)
  const loadingRef = useRef(false)
  
  useEffect(() => {
    if (!project) return

    const unsubscribePatched = projectsService.onPatched((updatedProject) => {
      if (updatedProject._id === project._id) {
        setProject(updatedProject)

        if (updatedProject.status === 'generating' && project.status === 'initializing') {
          toast.info('Generating your backend...', { duration: Infinity, id: 'generating' })
        } else if (updatedProject.status === 'ready' && project.status !== 'ready') {
          toast.dismiss('generating')
          toast.success('Project generated successfully!')
        } else if (updatedProject.status === 'error') {
          toast.dismiss('generating')
          toast.error(updatedProject.errorMessage || 'Project generation failed')
        }
      }
    })

    const unsubscribeUpdated = projectsService.onUpdated((updatedProject) => {
      if (updatedProject._id === project._id) {
        setProject(updatedProject)
      }
    })

    return () => {
      unsubscribePatched()
      unsubscribeUpdated()
    }
  }, [project])

  const loadProject = useCallback(async (id: string) => {
    if (loadingRef.current || !id) return
    
    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      
      const loadedProject = await projectsService.get(id)
      
      if (currentProjectIdRef.current === id) {
        setProject(loadedProject)
      }
    } catch (err) {
      if (currentProjectIdRef.current === id) {
        console.error('Failed to load project:', err)
        setError('Failed to load project')
        toast.error('Failed to load project')
      }
    } finally {
      loadingRef.current = false
      if (currentProjectIdRef.current === id) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    currentProjectIdRef.current = projectId
    if (projectId && projectId !== initialProjectIdRef.current) {
      loadProject(projectId)
    }
  }, [projectId, loadProject])

  const createProject = useCallback(async (data: CreateAIProjectData): Promise<AIProject | null> => {
    if (loadingRef.current) return null

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)

      // Validate framework and language
      const validFrameworks = ['fast-api', 'feathers']
      const validLanguages = ['python', 'typescript']

      if (!validFrameworks.includes(data.framework)) {
        throw new Error(`Invalid framework: ${data.framework}. Must be one of: ${validFrameworks.join(', ')}`)
      }

      if (!validLanguages.includes(data.language)) {
        throw new Error(`Invalid language: ${data.language}. Must be one of: ${validLanguages.join(', ')}`)
      }

      console.log('[DEBUG] Creating project with data:', JSON.stringify(data, null, 2))
      console.log('[DEBUG] Data keys:', Object.keys(data))

      const newProject = await projectsService.create(data)
      console.log('[DEBUG] New project:', JSON.stringify(newProject, null, 2))
      setProject(newProject)
      currentProjectIdRef.current = newProject._id
      toast.success('Project creation started!')
      return newProject
    } catch (err) {
      console.error('[DEBUG] Failed to create project:', err)
      console.error('[DEBUG] Error details:', JSON.stringify(err, null, 2))
      setError('Failed to create project')
      toast.error('Failed to create project')
      return null
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  const updateProject = async (id: string, data: Partial<AIProject>): Promise<AIProject | null> => {
    try {
      setLoading(true)
      setError(null)
      const updatedProject = await projectsService.patch(id, data)
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
      await projectsService.remove(id)
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