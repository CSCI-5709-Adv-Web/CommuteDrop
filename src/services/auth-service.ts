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
      // Log the request for debugging
      console.log("Login request:", credentials)
      console.log("Endpoint:", ENDPOINTS.AUTH.LOGIN)

      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials)

      // Log the response for debugging
      console.log("Login response:", response)

      return response
    } catch (error: any) {
      console.error("Login error:", error)

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
      // Log the request for debugging
      console.log("Register request:", userData)
      console.log("Endpoint:", ENDPOINTS.AUTH.REGISTER)

      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, userData)

      // Log the response for debugging
      console.log("Register response:", response)

      return response
    } catch (error: any) {
      console.error("Registration error:", error)

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
      // Log the request for debugging
      console.log("Refresh token request:", { refreshToken: refreshToken.substring(0, 10) + "..." })
      console.log("Endpoint:", ENDPOINTS.AUTH.REFRESH_TOKEN)

      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken })

      // Log the response for debugging (without sensitive data)
      console.log("Refresh token response status:", response.success)

      return response
    } catch (error: any) {
      console.error("Token refresh error:", error)

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
      // Log the request for debugging
      console.log("Verify email request:", { email, code })
      console.log("Endpoint:", ENDPOINTS.AUTH.VERIFY_EMAIL)

      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code })

      // Log the response for debugging
      console.log("Verify email response:", response)

      return response
    } catch (error: any) {
      console.error("Email verification error:", error)

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

