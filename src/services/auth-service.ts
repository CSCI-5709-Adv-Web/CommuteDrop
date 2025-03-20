import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth"

const API_BASE_URL = "http://localhost:5087/api"

// Helper function to handle API responses
const handleResponse = async (response: Response): Promise<AuthResponse> => {
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
}

// Create a reusable fetch function with error handling
const fetchWithErrorHandling = async (url: string, options: RequestInit): Promise<AuthResponse> => {
  try {
    const response = await fetch(url, options)
    return await handleResponse(response)
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
}

export const api = {
  auth: {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      return fetchWithErrorHandling(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
      return fetchWithErrorHandling(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
      return fetchWithErrorHandling(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })
    },
  },

  // Add other API endpoints here as needed
}

