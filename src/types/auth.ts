export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  address?: string
  profileImage?: string
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

export interface UserProfile {
  email: string
  name: string
  phone?: string
  address?: string
  profileImage?: string
  joinDate?: string
  rating?: number
  deliveriesCompleted?: number
}

export interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

