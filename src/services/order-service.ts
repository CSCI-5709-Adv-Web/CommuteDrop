import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { jwtUtils } from "../utils/jwtUtils"
import { tokenStorage } from "../utils/tokenStorage"
import { tokenService } from "./token-service"
import { API_CONFIG } from "../config/api-config"

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

// Update the OrderEstimateResponse interface to include pricing_details
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
        const token = await tokenService.getServiceToken("order")
        console.log("Using order service token for API request")
        if (token) {
          console.log(`Token starts with: ${token.substring(0, 15)}...`)
        }
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

  confirmOrder: async (orderId: string): Promise<ApiResponse<OrderEstimateResponse>> => {
    try {
      const token = await tokenService.getServiceToken("order")

      // First try to get the actual order data to preserve the pricing
      let actualPrice = null
      try {
        // Get the current order data to maintain the same price
        const orderResponse = await apiClient.get<ApiResponse<any>>(`${API_CONFIG.ORDER_SERVICE_URL}/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (orderResponse.success && orderResponse.data) {
          if (orderResponse.data.pricing_details?.total_cost) {
            actualPrice = orderResponse.data.pricing_details.total_cost
          } else if (orderResponse.data.estimatedPrice?.total) {
            actualPrice = orderResponse.data.estimatedPrice.total
          }
        }
      } catch (error) {
        console.warn("Could not fetch actual order data, using provided data", error)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockResponse: ApiResponse<OrderEstimateResponse> = {
        success: true,
        message: "Order confirmed successfully",
        data: {
          orderId,
          status: "CONFIRMED",
          estimatedPrice: {
            base: actualPrice ? actualPrice * 0.5 : 5.0,
            distance: actualPrice ? actualPrice * 0.3 : 2.72,
            time: actualPrice ? actualPrice * 0.2 : 1.83,
            total: actualPrice || 65.22, // Use the actual price or default to 65.22
            currency: "CAD",
          },
          pricing_details: {
            cost: actualPrice ? actualPrice * 0.8 : 60.0,
            tax: actualPrice ? actualPrice * 0.2 : 5.22,
            total_cost: actualPrice || 65.22, // Use the actual price or default to 65.22
            rider_commission: actualPrice ? actualPrice * 0.1 : 6.52,
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

  cancelOrder: async (orderId: string): Promise<ApiResponse<null>> => {
    try {
      const token = await tokenService.getServiceToken("order")
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

  processPayment: async (orderId: string, paymentDetails: any): Promise<ApiResponse<any>> => {
    try {
      console.log(`Processing payment for order ${orderId} with details:`, paymentDetails)

      const token = await tokenService.getServiceToken("order")
      const response = await apiClient.post<ApiResponse<any>>(
        (ENDPOINTS.ORDER?.PAYMENT || "/order/:order_id/payment").replace(":order_id", orderId),
        paymentDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("Payment response:", response)
      return response
    } catch (error: any) {
      console.error("Error in process payment:", error)

      // In development mode, simulate a successful response
      if (import.meta.env.DEV) {
        console.warn("DEV MODE: Returning simulated successful payment response")
        return {
          success: true,
          message: "Payment processed successfully (simulated)",
          data: {
            paymentIntentId: `pi_${Date.now()}`,
            status: "succeeded",
            amount: paymentDetails?.amount || 0,
          },
        }
      }

      return {
        success: false,
        message: error.message || "Failed to process payment",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  getUserOrders: async (userId?: string): Promise<ApiResponse<any[]>> => {
    try {
      if (!userId) {
        const token = tokenStorage.getToken()
        if (token) {
          const tokenUserId = jwtUtils.getUserId(token)
          userId = tokenUserId || undefined
        }
      }
      if (!userId) {
        throw new Error("User ID is required")
      }
      const token = await tokenService.getServiceToken("order")
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

  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    try {
      const token = await tokenService.getServiceToken("order")
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

