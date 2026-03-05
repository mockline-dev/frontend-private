import { createProject } from '@/api/projects/createProject'
import { deleteProject } from '@/api/projects/deleteProject'
import { fetchProjectById } from '@/api/projects/fetchProjectById'
import { fetchProjects } from '@/api/projects/fetchProjects'
import { updateProject } from '@/api/projects/updateProject'
import feathersClient from '@/services/featherClient'

export interface Project {
  _id: string
  userId: string
  name: string
  description: string
  framework: string
  language: string
  model: string
  status: 'initializing' | 'generating' | 'ready' | 'error'
  errorMessage?: string
  createdAt: number
  updatedAt: number
  // Progress tracking fields
  filesGenerated?: number
  totalFiles?: number
  generationProgress?: number
  currentStage?: string
}

export interface CreateProjectData {
  name: string
  description: string
  framework: string
  language: string
  model: string
  [key: string]: unknown
}

export interface ProjectQuery {
  $sort?: {
    createdAt?: number
  }
  $limit?: number
  $skip?: number
}

export const projectsService = {
  async create(data: CreateProjectData): Promise<Project> {
    const result = await createProject(data)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async find(query?: ProjectQuery): Promise<{ data: Project[]; total?: number; limit?: number; skip?: number;  $sort?: {createdAt?: number;}}> {
    const result = await fetchProjects(query ? { query: query as Record<string, unknown> } : undefined)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async get(id: string): Promise<Project> {
    const result = await fetchProjectById({ id })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async patch(id: string, data: Partial<Project>): Promise<Project> {
    const result = await updateProject({ id, data })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async remove(id: string): Promise<Project> {
    const result = await deleteProject({ id })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  // Real-time event listeners - Note: These should use feathersClient for real-time updates
  onCreated(callback: (project: Project) => void) {
    feathersClient.service('projects').on('created', callback)
    return () => feathersClient.service('projects').off('created', callback)
  },

  onPatched(callback: (project: Project) => void) {
    feathersClient.service('projects').on('patched', callback)
    return () => feathersClient.service('projects').off('patched', callback)
  },

  onUpdated(callback: (project: Project) => void) {
    feathersClient.service('projects').on('updated', callback)
    return () => feathersClient.service('projects').off('updated', callback)
  }
}
