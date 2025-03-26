import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { jwtUtils } from "../utils/jwtUtils"
import { tokenStorage } from "../utils/tokenStorage"

export interface CreateOrderRequest {
    pickup: {
        address: string
        latitude?: number
        longitude?: number
    }
    dropoff: {
        address: string
        latitude?: number
        longitude?: number
    }
    packageDetails?: {
        weight?: number
        dimensions?: {
        length?: number
        width?: number
        height?: number
        }
        description?: string
    }
    carrierType: string
    distance: {
        value: number
        unit: string
    }
    estimatedTime: {
        value: number
        unit: string
    }
    userId?: string
    paymentMethodId?: number
    }

    export interface OrderEstimateResponse {
    _id?: string
    orderId: string
    status: string
    estimatedPrice: {
        base: number
        distance: number
        time: number
        total: number
        currency: string
    }
    estimatedDelivery: {
        time: string
        timeWindow: string
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
        if (!request.userId) {
            const token = tokenStorage.getToken()
            if (token) {
            const userId = jwtUtils.getUserId(token)
            if (userId) {
                request.userId = userId
            }
            }
        }
        const response = await apiClient.post<ApiResponse<OrderEstimateResponse>>(
            ENDPOINTS.ORDER?.CREATE || "/order",
            request,
        )
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
      // In a real implementation, you would make an API call to confirm the order
      // For now, we'll simulate a successful response

      // This would be the actual API call in a real implementation:
      // const response = await apiClient.put<ApiResponse<OrderEstimateResponse>>(
      //   ENDPOINTS.ORDER.UPDATE.replace(':order_id', orderId),
      //   { status: 'CONFIRMED' }
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
      // Make the actual API call to cancel the order
      const response = await apiClient.delete<ApiResponse<null>>(
        (ENDPOINTS.ORDER?.CANCEL || "/order/:order_id").replace(":order_id", orderId),
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
      // Make the actual API call to process payment
      const response = await apiClient.post<ApiResponse<any>>(
        (ENDPOINTS.ORDER?.PAYMENT || "/order/:order_id/payment").replace(":order_id", orderId),
        paymentDetails,
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

  /**
   * Get all orders for a user
   */
  getUserOrders: async (userId?: string): Promise<ApiResponse<OrderEstimateResponse[]>> => {
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

      // Make the actual API call to get user orders
      const response = await apiClient.get<ApiResponse<OrderEstimateResponse[]>>(
        (ENDPOINTS.ORDER?.USER_ORDERS || "/order/user/:user_id").replace(":user_id", userId),
      )

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch user orders",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

