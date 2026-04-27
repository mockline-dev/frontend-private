export interface InitialData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type CustomError = { message: string; code?: string }

export interface UserMeta {
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  photoURL: string | null
  providerId: string
  uid: string
}

export interface UserData {
  firstName?: string
  lastName?: string
  jwt?: string
  feathersId: string
  userMeta?: UserMeta[]
}
