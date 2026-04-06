/**
 * Common TypeScript utility types and interfaces
 */

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  limit: number
  skip: number
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}

// Form types
export interface FormField<T = any> {
  value: T
  error?: string
  touched?: boolean
  required?: boolean
}

export type FormState<T extends Record<string, any>> = {
  [K in keyof T]: FormField<T[K]>
}

// Event handlers
export type EventHandler<T = any> = (event: T) => void
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>

// Component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface WithLoading {
  loading?: boolean
}

export interface WithError {
  error?: string | null
}

export interface WithOptionalId {
  id?: string
}

export interface WithRequiredId {
  id: string
}

// File types
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

export interface UploadedFile extends FileInfo {
  url: string
  key: string
}

// Project related types
export type ProjectStatus = 'idle' | 'initializing' | 'generating' | 'validating' | 'ready' | 'running' | 'error'
export type FileType = 'file' | 'folder'
export type LogLevel = 'info' | 'error' | 'success' | 'warning' | 'system'

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Array utility types
export type NonEmptyArray<T> = [T, ...T[]]
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never

// Function utility types
export type Awaited<T> = T extends Promise<infer U> ? U : T
export type ReturnTypeAsync<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>

// Environment types
export type Environment = 'development' | 'production' | 'test'

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Validation types
export interface ValidationRule<T = any> {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Hook return types
export interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: () => Promise<void>
  reset: () => void
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isSubmitting: boolean
  handleChange: (field: keyof T) => (value: T[keyof T]) => void
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void
  reset: () => void
  setFieldValue: (field: keyof T, value: T[keyof T]) => void
  setFieldError: (field: keyof T, error: string) => void
}

// Component ref types
export type ComponentRef<T extends React.ElementType> = React.ComponentPropsWithRef<T>['ref']

// Event types
export type ChangeEvent<T = HTMLInputElement> = React.ChangeEvent<T>
export type FormEvent<T = HTMLFormElement> = React.FormEvent<T>
export type MouseEvent<T = HTMLElement> = React.MouseEvent<T>
export type KeyboardEvent<T = HTMLElement> = React.KeyboardEvent<T>

// Conditional types
export type If<C extends boolean, T, F> = C extends true ? T : F
export type IsEqual<T, U> = T extends U ? (U extends T ? true : false) : false

// Object utility types
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
}

export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K]
}

// String utility types
export type Capitalize<S extends string> = S extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : S

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Capitalize<CamelCase<`${P2}${P3}`>>}`
  : S

// Brand types for type safety
export type Brand<T, B> = T & { __brand: B }
export type UserId = Brand<string, 'UserId'>
export type ProjectId = Brand<string, 'ProjectId'>
export type FileId = Brand<string, 'FileId'>

// Configuration types
export interface AppConfig {
  apiUrl: string
  aiServiceUrl: string
  environment: Environment
  version: string
  features: Record<string, boolean>
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export interface ErrorInfo {
  message: string
  code?: string
  statusCode?: number
  timestamp: Date
  details?: any
}