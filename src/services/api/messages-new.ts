import feathersClient from '@/services/featherClient'
import type { Query } from '@feathersjs/feathers'

export interface Message {
  _id: string
  projectId: string
  role: 'user' | 'system' | 'assistant'
  content: string
  tokens?: number
  status?: string
  createdAt: number
  updatedAt: number
}

export interface CreateMessageData {
  projectId: string
  role: 'user' | 'system' | 'assistant'
  content: string
  tokens?: number
  status?: string
}

export interface MessageQuery {
  $sort?: {
    createdAt?: 1 | -1
  }
  $limit?: number
  $skip?: number
  projectId?: string
}

export const messagesService = {
  async create(data: CreateMessageData): Promise<Message> {
    await feathersClient.authenticate()
    return await feathersClient.service('messages').create(data)
  },

  async find(query?: MessageQuery): Promise<{ data: Message[]; total: number; limit: number; skip: number }> {
    await feathersClient.authenticate()
    return await feathersClient.service('messages').find({ query: query as Query })
  },

  async get(id: string): Promise<Message> {
    await feathersClient.authenticate()
    return await feathersClient.service('messages').get(id)
  },

  async patch(id: string, data: Partial<Message>): Promise<Message> {
    await feathersClient.authenticate()
    return await feathersClient.service('messages').patch(id, data)
  },

  // Real-time event listeners
  onCreated(callback: (message: Message) => void) {
    feathersClient.service('messages').on('created', callback)
    return () => feathersClient.service('messages').off('created', callback)
  },

  onPatched(callback: (message: Message) => void) {
    feathersClient.service('messages').on('patched', callback)
    return () => feathersClient.service('messages').off('patched', callback)
  }
}
