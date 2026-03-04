import feathersClient from '@/services/featherClient'
import { Params } from '@feathersjs/feathers'

export interface File {
  _id: string
  projectId: string
  messageId?: string
  name: string           // The filename/key in R2 (changed from 'path')
  key: string            // The R2 key (changed from 'r2Key')
  fileType: string       // Content type (changed from 'language')
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

  async create(data: { projectId: string; messageId?: string; name: string; key: string; fileType: string; size: number; currentVersion?: number }): Promise<File> {
    await feathersClient.authenticate()
    return await feathersClient.service('files').create(data)
  },

  async getByProjectId(projectId: string): Promise<File[]> {
    await feathersClient.authenticate()
    const result = await feathersClient.service('files').find({
      query: { projectId }
    })
    return result.data
  },

  async patch(id: string, data: Partial<Pick<File, 'size' | 'currentVersion'>>): Promise<File> {
    await feathersClient.authenticate()
    return await feathersClient.service('files').patch(id, data)
  },

  async remove(id: string): Promise<File> {
    await feathersClient.authenticate()
    return await feathersClient.service('files').remove(id)
  },

  async getFileUrl(fileId: string): Promise<string> {
    await feathersClient.authenticate()
    const file = await feathersClient.service('files').get(fileId)
    // Use file-stream service to get signed URL
    const streamResult = await feathersClient.service('file-stream').get(file.key)
    return streamResult.url
  },

  // Real-time event listeners
  onCreated(callback: (file: File) => void) {
    feathersClient.service('files').on('created', callback)
    return () => feathersClient.service('files').off('created', callback)
  }
}

// Backward compatibility - keep old service name as alias
export const aiFilesService = filesService

// Note: r2Service has been removed as backend now uses 'file-stream' service
// for file access. Use filesService.getFileUrl() instead.