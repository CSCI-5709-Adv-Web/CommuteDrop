export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    token: string
    refreshToken: string
  }
  errors: string[]
}

export interface User {
  email: string
  name?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

