import feathersClient from '@/services/featherClient'
import { Params, Query } from '@feathersjs/feathers'

export interface AIProjectQuery {
  $sort?: {
    createdAt?: 1 | -1
  }
  $limit?: number
  $skip?: number
}

export interface AIProject {
  _id: string
  userId: string
  conversationId?: string
  name: string
  description: string
  framework: string
  language: string
  structure?: object
  status: 'generating' | 'ready' | 'error'
  createdAt: number
  updatedAt: number
}

export interface CreateAIProjectData {
  name: string
  description: string
  framework: string
  language: string
  conversationId?: string
}

export const aiProjectsService = {
  async create(data: CreateAIProjectData): Promise<AIProject> {
    return await feathersClient.service('ai-projects').create(data)
  },

  async find(query?: Params<AIProjectQuery>): Promise<{ data: AIProject[]; total?: number; limit?: number; skip?: number }> {
    return await feathersClient.service('ai-projects').find({ query: query as Query })
  },

  async get(id: string): Promise<AIProject> {
    return await feathersClient.service('ai-projects').get(id)
  },

  async patch(id: string, data: Partial<AIProject>): Promise<AIProject> {
    return await feathersClient.service('ai-projects').patch(id, data)
  },

  async remove(id: string): Promise<AIProject> {
    return await feathersClient.service('ai-projects').remove(id)
  },

  // Real-time event listeners
  onCreated(callback: (project: AIProject) => void) {
    feathersClient.service('ai-projects').on('created', callback)
    return () => feathersClient.service('ai-projects').off('created', callback)
  },

  onPatched(callback: (project: AIProject) => void) {
    feathersClient.service('ai-projects').on('patched', callback)
    return () => feathersClient.service('ai-projects').off('patched', callback)
  },

  onUpdated(callback: (project: AIProject) => void) {
    feathersClient.service('ai-projects').on('updated', callback)
    return () => feathersClient.service('ai-projects').off('updated', callback)
  }
}