'use client'

import { useState, useEffect } from 'react'
import { aiProjectsService, AIProject } from '@/services/api/aiProjects'
import { toast } from 'sonner'

export function useAIProjects() {
  const [projects, setProjects] = useState<AIProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await aiProjectsService.find({
        $sort: { createdAt: -1 },
        $limit: 10
      })
      setProjects(result.data)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Failed to load projects')
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // Listen for real-time project updates
  useEffect(() => {
    const unsubscribeCreated = aiProjectsService.onCreated((project) => {
      setProjects(prev => [project, ...prev])
    })

    const unsubscribePatched = aiProjectsService.onPatched((project) => {
      setProjects(prev => prev.map(p => p._id === project._id ? project : p))
    })

    return () => {
      unsubscribeCreated()
      unsubscribePatched()
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