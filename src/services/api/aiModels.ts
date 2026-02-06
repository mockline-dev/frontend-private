import feathersClient from '@/services/featherClient'
import { Params } from '@feathersjs/feathers'

export interface AIModel {
  _id: string
  name: string
  provider: string
  version: string
  enabled: boolean
  capabilities: string[]
  createdAt: number
  updatedAt: number
}

export interface CreateAIModelData {
  name: string
  provider: string
  version: string
  enabled: boolean
  capabilities: string[]
}

export interface AIModelQuery {
  $sort?: {
    createdAt?: 1 | -1
  }
  $limit?: number
  $skip?: number
  enabled?: boolean
}

export const aiModelsService = {
  async create(data: CreateAIModelData): Promise<AIModel> {
    return await feathersClient.service('ai-models').create(data)
  },

  async find(query?: AIModelQuery): Promise<{ data: AIModel[]; total: number; limit: number; skip: number }> {
    return await feathersClient.service('ai-models').find({ query: query as Params<AIModelQuery> })
  },

  async get(id: string): Promise<AIModel> {
    return await feathersClient.service('ai-models').get(id)
  },

  async patch(id: string, data: Partial<AIModel>): Promise<AIModel> {
    return await feathersClient.service('ai-models').patch(id, data)
  },

  async remove(id: string): Promise<AIModel> {
    return await feathersClient.service('ai-models').remove(id)
  }
}
