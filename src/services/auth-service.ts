import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth"

const API_BASE_URL = "http://localhost:5087/api"

export const api = {
  auth: {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        })

        if (!response.ok) {
          // Handle HTTP errors
          if (response.status === 401) {
            return {
              statusCode: 401,
              success: false,
              message: "Invalid email or password.",
              data: { token: "", refreshToken: "" },
              errors: ["Invalid credentials"],
            }
          }

          return {
            statusCode: response.status,
            success: false,
            message: `HTTP error: ${response.status}`,
            data: { token: "", refreshToken: "" },
            errors: [`HTTP error: ${response.status}`],
          }
        }

        try {
          const data = await response.json()
          return data
        } catch (jsonError) {
          return {
            statusCode: 500,
            success: false,
            message: "Invalid response format",
            data: { token: "", refreshToken: "" },
            errors: ["Server returned invalid JSON"],
          }
        }
      } catch (error) {
        // Handle network errors
        return {
          statusCode: 0,
          success: false,
          message: "Network error. Please check your connection and try again.",
          data: { token: "", refreshToken: "" },
          errors: [error instanceof Error ? error.message : "Unknown error"],
        }
      }
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          // Handle HTTP errors
          if (response.status === 409) {
            return {
              statusCode: 409,
              success: false,
              message: "Email already exists.",
              data: { token: "", refreshToken: "" },
              errors: ["Email already registered"],
            }
          }

          return {
            statusCode: response.status,
            success: false,
            message: `HTTP error: ${response.status}`,
            data: { token: "", refreshToken: "" },
            errors: [`HTTP error: ${response.status}`],
          }
        }

        try {
          const data = await response.json()
          return data
        } catch (jsonError) {
          return {
            statusCode: 500,
            success: false,
            message: "Invalid response format",
            data: { token: "", refreshToken: "" },
            errors: ["Server returned invalid JSON"],
          }
        }
      } catch (error) {
        // Handle network errors
        return {
          statusCode: 0,
          success: false,
          message: "Network error. Please check your connection and try again.",
          data: { token: "", refreshToken: "" },
          errors: [error instanceof Error ? error.message : "Unknown error"],
        }
      }
    },

    // Update refreshToken with similar error handling
    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          return {
            statusCode: response.status,
            success: false,
            message: `HTTP error: ${response.status}`,
            data: { token: "", refreshToken: "" },
            errors: [`HTTP error: ${response.status}`],
          }
        }

        try {
          const data = await response.json()
          return data
        } catch (jsonError) {
          return {
            statusCode: 500,
            success: false,
            message: "Invalid response format",
            data: { token: "", refreshToken: "" },
            errors: ["Server returned invalid JSON"],
          }
        }
      } catch (error) {
        return {
          statusCode: 0,
          success: false,
          message: "Network error. Please check your connection and try again.",
          data: { token: "", refreshToken: "" },
          errors: [error instanceof Error ? error.message : "Unknown error"],
        }
      }
    },
  },

  // Add other API endpoints here as needed
}

