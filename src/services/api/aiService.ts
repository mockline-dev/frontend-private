import { fetchAIResponse } from '@/api/aiService/fetchAIResponse'
import { generateAIResponse } from '@/api/aiService/generateAIResponse'

export interface AIServiceRequest {
  projectId: string
  prompt: string
  context?: string
  temperature?: number
  maxTokens?: number
  generateFiles?: boolean
  [key: string]: unknown
}

export interface AIServiceResponse {
  success: boolean
  response: string
  generatedFiles?: GeneratedFile[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

export interface GeneratedFile {
  filename: string
  originalFilename?: string
  content: string
  type: string
  fileId?: string
  fileUrl?: string
  size?: number
  uploadSuccess?: boolean
  uploadTime?: string
  error?: string
}

export interface AIServiceInfo {
  service: string
  status: string
  model?: {
    name: string
    size: number
    modifiedAt: string
  }
  capabilities?: string[]
  supportedFeatures?: string[]
  maxTokens?: number
  defaultTemperature?: number
  maxFileSize?: number
  error?: string
}

export const aiService = {
  async create(data: AIServiceRequest): Promise<AIServiceResponse> {
    const result = await generateAIResponse(data)
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  },

  async find(): Promise<AIServiceInfo> {
    const result = await fetchAIResponse()
    if (!result.success) {
      throw new Error(result.error)
    }
    return result.data
  }
}
