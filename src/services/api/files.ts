import feathersClient from '@/services/featherClient'
import { Params } from '@feathersjs/feathers'

export interface File {
  _id: string
  projectId: string
  messageId?: string
  path: string
  r2Key: string
  language: string
  size: number
  currentVersion: number
  createdAt: number
  updatedAt: number
}

export interface FileQuery {
  $sort?: {
    createdAt?: 1 | -1
  }
  $limit?: number
  $skip?: number
  projectId?: string
  messageId?: string
}

// Backward compatibility - keep old interface name as alias
export type AIFile = File
export type AIFileQuery = FileQuery

export interface R2File {
  _id: string
  key: string
  size: number
  contentType: string
  createdAt: number
  updatedAt: number
}

export interface FileContent {
  content: string
  metadata?: {
    contentType: string
    size: number
    lastModified: string
  }
}

export const filesService = {
  async find(query?: FileQuery): Promise<{ data: File[]; total: number; limit: number; skip: number }> {
    await feathersClient.authenticate()
    return await feathersClient.service('files').find({ query: query as Params<FileQuery> })
  },

  async get(id: string): Promise<File> {
    await feathersClient.authenticate()
    return await feathersClient.service('files').get(id)
  },

  async create(data: { projectId: string; messageId?: string; path: string; r2Key: string; language: string; size: number }): Promise<File> {
    await feathersClient.authenticate()
    return await feathersClient.service('files').create(data)
  },

  async getByProjectId(projectId: string): Promise<File[]> {
    await feathersClient.authenticate()
    const result = await feathersClient.service('files').find({
      query: { projectId }
    })
    return result.data
  }
}

// Backward compatibility - keep old service name as alias
export const aiFilesService = filesService

export const r2Service = {
  async getFile(key: string): Promise<FileContent> {
    await feathersClient.authenticate()
    return await feathersClient.service('r2').get(key)
  },

  async uploadFile(key: string, content: string, contentType: string): Promise<R2File> {
    await feathersClient.authenticate()
    return await feathersClient.service('r2').create({
      key,
      content,
      contentType
    })
  },

  async deleteFile(key: string): Promise<R2File> {
    await feathersClient.authenticate()
    return await feathersClient.service('r2').remove(key)
  },

  async listFiles(prefix: string): Promise<R2File[]> {
    await feathersClient.authenticate()
    return await feathersClient.service('r2').find({
      query: { prefix }
    })
  },

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    await feathersClient.authenticate()
    return await feathersClient.service('r2').presignedUrl({ key, expiresIn })
  }
}