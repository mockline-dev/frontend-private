export interface OptionsType {
  value: string | number
  label: string | number
}

export interface FeathersResponse<T> {
  data: T[]
  total: number
  limit?: number
  skip?: number
}
