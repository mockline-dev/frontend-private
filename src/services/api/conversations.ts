import feathersClient from '@/services/featherClient'

export interface Conversation {
  _id: string
  userId: string
  title: string
  aiModelId: string
  projectId?: string
  status: 'active' | 'archived' | 'deleted'
  createdAt: number
  updatedAt: number
}

export interface Message {
  _id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  metadata?: {
    model?: string
    temperature?: number
    files?: string[]
  }
  createdAt: number
}

export interface CreateConversationData {
  title: string
  aiModelId: string
  projectId?: string
}

export interface CreateMessageData {
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  metadata?: {
    model?: string
    temperature?: number
    files?: string[]
  }
}

export const conversationsService = {
  async create(data: CreateConversationData): Promise<Conversation> {
    return await feathersClient.service('conversations').create(data)
  },

  async find(query?: any): Promise<{ data: Conversation[]; total: number; limit: number; skip: number }> {
    return await feathersClient.service('conversations').find({ query })
  },

  async get(id: string): Promise<Conversation> {
    return await feathersClient.service('conversations').get(id)
  },

  async patch(id: string, data: Partial<Conversation>): Promise<Conversation> {
    return await feathersClient.service('conversations').patch(id, data)
  },

  async remove(id: string): Promise<Conversation> {
    return await feathersClient.service('conversations').remove(id)
  }
}

export const messagesService = {
  async create(data: CreateMessageData): Promise<Message> {
    return await feathersClient.service('messages').create(data)
  },

  async find(query?: any): Promise<{ data: Message[]; total: number; limit: number; skip: number }> {
    return await feathersClient.service('messages').find({ query })
  },

  async get(id: string): Promise<Message> {
    return await feathersClient.service('messages').get(id)
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