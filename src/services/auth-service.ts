import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth"

// Auth service for handling authentication-related API calls
export const authService = {
  /**
   * Login a user with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials)
    } catch (error: any) {
      // Return a standardized error format matching AuthResponse
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Login failed. Please try again.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, userData)
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Registration failed. Please try again.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken })
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Token refresh failed.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Verify email with verification code
   */
  verifyEmail: async (email: string, code: string): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code })
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Email verification failed.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

// Update the existing auth API to use the new service
export const api = {
  auth: authService,
}

