'use client'

import { Project, ProjectQuery, projectsService } from '@/services/api/projects'
import { Params } from '@feathersjs/feathers'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useAIProjects(initialProjects: Project[] = []) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [loading, setLoading] = useState(initialProjects.length === 0)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await projectsService.find({
        $sort: { createdAt: -1 },
        $limit: 10
      } as Params<ProjectQuery>)
      setProjects(result?.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects')
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  useEffect(() => {
    if (initialProjects.length === 0) {
      loadProjects()
    }
  }, [initialProjects.length])

  // Listen for real-time project updates
  useEffect(() => {
    const unsubscribeCreated = projectsService.onCreated((project) => {
      setProjects(prev => [project, ...prev])
    })

    const unsubscribePatched = projectsService.onPatched((project) => {
      setProjects(prev => prev.map(p => p._id === project._id ? project : p))
    })

    const unsubscribeRemoved = projectsService.onRemoved((removedProject) => {
      setProjects(prev => prev.filter(p => p._id !== removedProject._id))
    })

    return () => {
      unsubscribeCreated()
      unsubscribePatched()
      unsubscribeRemoved()
    }
  }, [])

  const getProjectStats = () => {
    const totalProjects = projects.length
    const readyProjects = projects.filter(p => p.status === 'ready').length
    const generatingProjects = projects.filter(p => p.status === 'generating').length

    return {
      total: totalProjects,
      ready: readyProjects,
      generating: generatingProjects
    }
  }

  const getRecentProjects = (limit: number = 3) => {
    return projects.slice(0, limit)
  }

  return {
    projects,
    loading,
    error,
    loadProjects,
    getProjectStats,
    getRecentProjects
  }
}