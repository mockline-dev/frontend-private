import { createAIModel } from '@/api/aiModels/createAIModel'
import { deleteAIModel } from '@/api/aiModels/deleteAIModel'
import { fetchAIModelById } from '@/api/aiModels/fetchAIModelById'
import { fetchAIModels } from '@/api/aiModels/fetchAIModels'
import { updateAIModel } from '@/api/aiModels/updateAIModel'

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
  [key: string]: unknown
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
    const result = await createAIModel(data)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async find(query?: AIModelQuery): Promise<{ data: AIModel[]; total: number; limit: number; skip: number }> {
    const result = await fetchAIModels(query ? { query: query as Record<string, unknown> } : undefined)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async get(id: string): Promise<AIModel> {
    const result = await fetchAIModelById({ id })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async patch(id: string, data: Partial<AIModel>): Promise<AIModel> {
    const result = await updateAIModel({ id, data })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async remove(id: string): Promise<AIModel> {
    const result = await deleteAIModel({ id })
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }
}
