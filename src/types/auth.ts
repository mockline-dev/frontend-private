import { UserInfo } from "@firebase/auth-types"

export interface UserData {
  feathersId: string
  firstName: string
  lastName: string
  jwt: string
  userMeta:UserInfo[]
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}