import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { jwtUtils } from "../utils/jwtUtils"
import { tokenStorage } from "../utils/tokenStorage"
import { tokenService } from "./token-service"
import { API_CONFIG } from "../config/api-config"

// Update the CreateOrderRequest interface to match the API format
export interface CreateOrderRequest {
  from_address: string
  to_address: string
  user_id: string
  package_weight: number
  delivery_instructions?: string
  vehicle_type: string
  distance: number
  time: number
}

export interface OrderEstimateResponse {
  _id?: string
  orderId: string
  status: string
  estimatedPrice?: {
    base: number
    distance: number
    time: number
    total: number
    currency: string
  }
  pricing_details?: {
    cost: number
    tax: number
    total_cost: number
    rider_commission: number
  }
  estimatedDelivery?: {
    time?: string
    timeWindow?: string
  }
  tracking?: {
    trackingId: string
    trackingUrl: string
  }
  createdAt?: string
  updatedAt?: string
}

export const orderService = {
  // Update the createOrder method to use the user's ID instead of email
  createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<OrderEstimateResponse>> => {
    try {
      if (!request.user_id) {
        const token = tokenStorage.getToken()
        if (token) {
          const userId = jwtUtils.getUserId(token)
          if (userId) {
            request.user_id = userId
            console.log(`Using user ID from token: ${userId}`)
          } else {
            console.warn("Could not extract user ID from token, falling back to email")
            const userEmail = jwtUtils.getUserEmail(token)
            if (userEmail) {
              request.user_id = userEmail
            }
          }
        }
      }

      try {
        // Get a service token for the order service - don't fall back to user token
        const token = await tokenService.getServiceToken("order")
        console.log("Using order service token for API request")

        // Log the first few characters of the token for debugging
        if (token) {
          console.log(`Token starts with: ${token.substring(0, 15)}...`)
        }

        // Make the API request with the token
        const url = ENDPOINTS.ORDER?.CREATE || "/order/create"
        console.log(`Making request to: ${url}`)
        console.log(`Request payload user_id: ${request.user_id}`)

        const response = await apiClient.post<ApiResponse<OrderEstimateResponse>>(url, request, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.success) {
          const orderData = response.data
          if (!orderData.orderId && orderData._id) {
            orderData.orderId = orderData._id
          }
          return {
            success: true,
            message: response.message || "Order created successfully",
            data: orderData,
          }
        }
        return response
      } catch (tokenError) {
        console.error("Error getting or using order service token:", tokenError)

        // Try a direct request to check if the service is available
        try {
          const healthCheckUrl = `${API_CONFIG.ORDER_SERVICE_URL}/health`
          console.log(`Attempting health check at: ${healthCheckUrl}`)
          const healthCheck = await fetch(healthCheckUrl, {
            method: "GET",
            signal: AbortSignal.timeout(3000),
          })
          console.log(`Health check status: ${healthCheck.status}`)
        } catch (healthError) {
          console.error("Health check failed:", healthError)
        }

        throw new Error("Failed to authenticate with order service. Please try again later.")
      }
    } catch (error: any) {
      console.error("Error creating order:", error)
      return {
        success: false,
        message: error.message || "Failed to create order",
        data: {} as OrderEstimateResponse,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Confirm an order after estimate
   */
  confirmOrder: async (orderId: string): Promise<ApiResponse<OrderEstimateResponse>> => {
    try {
      // Get a service token for the order service - don't fall back to user token
      const token = await tokenService.getServiceToken("order")

      // This would be the actual API call in a real implementation:
      // const response = await apiClient.put<ApiResponse<OrderEstimateResponse>>(
      //   ENDPOINTS.ORDER.UPDATE.replace(':order_id', orderId),
      //   { status: 'CONFIRMED' },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`
      //     }
      //   }
      // );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock response data
      const mockResponse: ApiResponse<OrderEstimateResponse> = {
        success: true,
        message: "Order confirmed successfully",
        data: {
          orderId,
          status: "CONFIRMED",
          estimatedPrice: {
            base: 5.0,
            distance: 2.72,
            time: 1.83,
            total: 9.55,
            currency: "CAD",
          },
          estimatedDelivery: {
            time: "4 mins",
            timeWindow: "4-9 mins",
          },
          tracking: {
            trackingId: `TRK-${Math.floor(Math.random() * 10000)}`,
            trackingUrl: `/tracking/${Math.floor(Math.random() * 10000)}`,
          },
        },
      }

      return mockResponse
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to confirm order",
        data: {} as OrderEstimateResponse,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (orderId: string): Promise<ApiResponse<null>> => {
    try {
      // Get a service token for the order service - don't fall back to user token
      const token = await tokenService.getServiceToken("order")

      // Make the actual API call to cancel the order
      const response = await apiClient.delete<ApiResponse<null>>(
        (ENDPOINTS.ORDER?.CANCEL || "/order/:order_id").replace(":order_id", orderId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to cancel order",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Process payment for an order
   */
  processPayment: async (orderId: string, paymentDetails: any): Promise<ApiResponse<any>> => {
    try {
      // Get a service token for the order service - don't fall back to user token
      const token = await tokenService.getServiceToken("order")

      // Make the actual API call to process payment
      const response = await apiClient.post<ApiResponse<any>>(
        (ENDPOINTS.ORDER?.PAYMENT || "/order/:order_id/payment").replace(":order_id", orderId),
        paymentDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to process payment",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the getUserOrders method to handle the API response format
  getUserOrders: async (userId?: string): Promise<ApiResponse<any[]>> => {
    try {
      // Get user ID from token if not provided
      if (!userId) {
        const token = tokenStorage.getToken()
        if (token) {
          const tokenUserId = jwtUtils.getUserId(token)
          // Convert null to undefined to satisfy TypeScript
          userId = tokenUserId || undefined
        }
      }

      if (!userId) {
        throw new Error("User ID is required")
      }

      // Get a service token for the order service - don't fall back to user token
      const token = await tokenService.getServiceToken("order")

      // Make the actual API call to get user orders
      const url = `${API_CONFIG.ORDER_SERVICE_URL}/getAllOrders/user/${userId}`
      console.log(`Fetching orders from: ${url}`)

      const response = await apiClient.get<ApiResponse<any[]>>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response
    } catch (error: any) {
      console.error("Error fetching user orders:", error)
      return {
        success: false,
        message: error.message || "Failed to fetch user orders",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    try {
      // Get a service token for the order service
      const token = await tokenService.getServiceToken("order")

      // Make the API call to update the order status
      const response = await apiClient.put<ApiResponse<any>>(
        `${ENDPOINTS.ORDER.UPDATE || "/order/:order_id"}`.replace(":order_id", orderId),
        { orderId, status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update order status",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

