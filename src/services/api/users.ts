import feathersClient from '@/services/featherClient'
import { Params } from '@feathersjs/feathers'

export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  firebaseUid: string
  createdAt: number
  updatedAt: number
}

export interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  firebaseUid: string
}

export interface UserQuery {
  $sort?: {
    createdAt?: 1 | -1
  }
  $limit?: number
  $skip?: number
  email?: string
  firebaseUid?: string
}

export const usersService = {
  async create(data: CreateUserData): Promise<User> {
    return await feathersClient.service('users').create(data)
  },

  async find(query?: UserQuery): Promise<{ data: User[]; total: number; limit: number; skip: number }> {
    return await feathersClient.service('users').find({ query: query as Params<UserQuery> })
  },

  async get(id: string): Promise<User> {
    return await feathersClient.service('users').get(id)
  },

  async patch(id: string, data: Partial<User>): Promise<User> {
    return await feathersClient.service('users').patch(id, data)
  },

  async remove(id: string): Promise<User> {
    return await feathersClient.service('users').remove(id)
  }
}
