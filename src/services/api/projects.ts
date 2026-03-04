import feathersClient from '@/services/featherClient'
import { Params, Query } from '@feathersjs/feathers'

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
}

export interface CreateProjectData {
  name: string
  description: string
  framework: string
  language: string
  model: string
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
    await feathersClient.authenticate()
    return await feathersClient.service('projects').create(data)
  },

  async find(query?: Params<ProjectQuery>): Promise<{ data: Project[]; total?: number; limit?: number; skip?: number;  $sort?: {createdAt?: number;}}> {
    await feathersClient.authenticate()
    return await feathersClient.service('projects').find({ query: query as Query })
  },

  async get(id: string): Promise<Project> {
    await feathersClient.authenticate()
    return await feathersClient.service('projects').get(id)
  },

  async patch(id: string, data: Partial<Project>): Promise<Project> {
    await feathersClient.authenticate()
    return await feathersClient.service('projects').patch(id, data)
  },

  async remove(id: string): Promise<Project> {
    await feathersClient.authenticate()
    return await feathersClient.service('projects').remove(id)
  },

  // Real-time event listeners
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
