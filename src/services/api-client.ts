import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import axios from "axios"
import { API_CONFIG } from "../config/api-config"
import { tokenStorage } from "../utils/tokenStorage"
import { jwtUtils } from "../utils/jwtUtils"

// Default API client config
const defaultConfig: AxiosRequestConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
}

// Create a class for API client to handle common functionality
class ApiClient {
  private instance: AxiosInstance
  private isRefreshing = false
  private failedQueue: any[] = []

  constructor(config: AxiosRequestConfig = {}) {
    this.instance = axios.create({
      ...defaultConfig,
      ...config,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // For development: Mock API responses instead of making real requests
        if (import.meta.env.DEV) {
          // We need to return the config as expected by the interceptor
          // The actual mocking will happen in the adapter
          const url = config.url || ""

          // Add a custom adapter to handle mock responses
          config.adapter = async (config) => {
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 300))

            const response = {
              data: {},
              status: 200,
              statusText: "OK",
              headers: {},
              config,
            }

            // User profile
            if (url.includes("/user/profile")) {
              response.data = {
                success: true,
                message: "Profile retrieved successfully",
                data: {
                  name: "Alex Johnson",
                  email: "alex@example.com",
                  phone: "+1 (555) 123-4567",
                  address: "123 Main St, Halifax, NS",
                  profileImage: "/placeholder.svg?height=150&width=150",
                  joinDate: "January 2023",
                  deliveriesCompleted: 12,
                  rating: 4.8,
                },
              }
            }
            // Saved locations
            else if (url.includes("/user/locations")) {
              response.data = {
                success: true,
                message: "Locations retrieved successfully",
                data: [
                  {
                    id: 1,
                    name: "Home",
                    address: "123 Main St, Halifax, NS",
                    latitude: 44.6488,
                    longitude: -63.5752,
                    isDefault: true,
                  },
                  {
                    id: 2,
                    name: "Work",
                    address: "456 Business Ave, Halifax, NS",
                    latitude: 44.6454,
                    longitude: -63.5918,
                    isDefault: false,
                  },
                ],
              }
            }
            // Payment methods
            else if (url.includes("/user/payment-methods")) {
              response.data = {
                success: true,
                message: "Payment methods retrieved successfully",
                data: [
                  {
                    id: 1,
                    type: "visa",
                    last4: "4242",
                    cardholderName: "Alex Johnson",
                    expiryDate: "12/25",
                    isDefault: true,
                  },
                  {
                    id: 2,
                    type: "mastercard",
                    last4: "5555",
                    cardholderName: "Alex Johnson",
                    expiryDate: "09/26",
                    isDefault: false,
                  },
                ],
              }
            }
            // Delivery history
            else if (url.includes("/delivery/history")) {
              response.data = {
                success: true,
                message: "Delivery history retrieved successfully",
                data: [
                  {
                    id: "DEL-1234",
                    date: "Mar 15, 2025",
                    from: "123 Main St, Halifax, NS",
                    to: "456 Business Ave, Halifax, NS",
                    status: "Completed",
                    price: "$15.99",
                    carrier: "Car",
                  },
                  {
                    id: "DEL-1235",
                    date: "Mar 10, 2025",
                    from: "123 Main St, Halifax, NS",
                    to: "789 Park Rd, Halifax, NS",
                    status: "Completed",
                    price: "$12.50",
                    carrier: "Bike",
                  },
                ],
              }
            }
            // Delivery estimate
            else if (url.includes("/delivery/estimate")) {
              response.data = {
                success: true,
                message: "Estimate calculated successfully",
                data: {
                  estimatedPrice: {
                    base: 5.0,
                    distance: 8.99,
                    time: 2.0,
                    total: 15.99,
                    currency: "USD",
                  },
                  estimatedTime: {
                    minutes: 25,
                    text: "25-30 minutes",
                  },
                  distance: {
                    meters: 3200,
                    text: "3.2 km",
                  },
                  route: {
                    points: [
                      { lat: 44.6488, lng: -63.5752 },
                      { lat: 44.6476, lng: -63.5783 },
                      { lat: 44.6454, lng: -63.5818 },
                      { lat: 44.6432, lng: -63.5852 },
                      { lat: 44.641, lng: -63.5886 },
                    ],
                  },
                  availableCarriers: [
                    {
                      type: "car",
                      name: "Car",
                      estimatedTime: "25-30 minutes",
                      price: 15.99,
                    },
                    {
                      type: "bike",
                      name: "Bike",
                      estimatedTime: "35-40 minutes",
                      price: 12.99,
                    },
                  ],
                },
              }
            }

            return response
          }
        }

        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling and token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config

        // If the error is 401 Unauthorized and we have a refresh token
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest.headers._retry &&
          !this.isRefreshing
        ) {
          originalRequest.headers._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = tokenStorage.getRefreshToken()

            if (!refreshToken) {
              return Promise.reject(error)
            }

            // Check if token is expired
            const token = tokenStorage.getToken()
            if (token && jwtUtils.isTokenExpired(token)) {
              // Perform token refresh
              const response = await this.refreshToken(refreshToken)

              if (response.success) {
                const { token: newToken, refreshToken: newRefreshToken } = response.data

                // Store new tokens
                tokenStorage.setTokens(newToken, newRefreshToken)

                // Update Authorization header and retry failed request
                this.instance.defaults.headers.common.Authorization = `Bearer ${newToken}`
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`
                }

                // Process queued requests
                this.processQueue(null, newToken)
                return this.instance(originalRequest)
              }
            }
          } catch (refreshError) {
            // Process queued requests with error
            const error = refreshError instanceof Error ? refreshError : new Error(String(refreshError))
            this.processQueue(error, null)

            // Logout user on refresh token failure
            tokenStorage.clearTokens()
            window.location.href = "/login"

            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      },
    )
  }

  private processQueue(error: Error | null, token: string | null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve(token)
      }
    })

    this.failedQueue = []
  }

  private async refreshToken(refreshToken: string) {
    try {
      const response = await axios.post<any>(
        `${API_CONFIG.BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      )
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Generic request method
  public async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.request(config)
      return response.data
    } catch (error: unknown) {
      // Handle specific API errors or transform them
      if (axios.isAxiosError(error) && error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorData = error.response.data
        throw {
          status: error.response.status,
          data: errorData,
          message: errorData.message || "An error occurred with the API request",
        }
      } else if (axios.isAxiosError(error) && error.request) {
        // The request was made but no response was received
        throw {
          status: 0,
          message: "No response received from server. Please check your connection.",
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        throw {
          message: errorMessage,
        }
      }
    }
  }

  // Convenience methods for different HTTP verbs
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "GET", url })
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "POST", url, data })
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "PUT", url, data })
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "DELETE", url })
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "PATCH", url, data })
  }
}

// Export a default instance
export const apiClient = new ApiClient()

// Allow creation of custom instances if needed
export const createApiClient = (config?: AxiosRequestConfig) => new ApiClient(config)

