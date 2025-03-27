import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { orderService } from "./order-service"

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  status: string
}

export interface StripeTokenResponse {
  id: string
  object: string
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export interface PaymentRequest {
  orderId: string
  paymentMethodId: string
  amount: number
  currency?: string
  description?: string
}

export interface PaymentResponse {
  success: boolean
  paymentIntentId?: string
  status?: string
  message?: string
}

export const paymentService = {
  /**
   * Create a payment intent with Stripe
   * This should be called from your backend, but we're simulating it here
   */
  createPaymentIntent: async (amount: number, currency = "usd"): Promise<ApiResponse<PaymentIntent>> => {
    try {
      // In a real implementation, this would be a call to your backend
      // which would then create a payment intent with Stripe
      const response = await fetch(`${ENDPOINTS.PAYMENT.CREATE_INTENT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, currency }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error creating payment intent:", error)

      // For development, simulate a successful response
      if (import.meta.env.DEV) {
        return {
          success: true,
          message: "Payment intent created (simulated)",
          data: {
            id: `pi_${Date.now()}`,
            clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
            amount,
            status: "requires_payment_method",
          },
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create payment intent",
        data: {} as PaymentIntent,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      }
    }
  },

  /**
   * Process a payment using the order service
   * This uses the payment method ID from Stripe and the order ID
   */
  processPayment: async (paymentRequest: PaymentRequest): Promise<PaymentResponse> => {
    try {
      // Call the order service to process the payment
      const response = await orderService.processPayment(paymentRequest.orderId, {
        paymentMethodId: paymentRequest.paymentMethodId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || "usd",
        description: paymentRequest.description || `Payment for order ${paymentRequest.orderId}`,
      })

      if (response.success) {
        return {
          success: true,
          paymentIntentId: response.data?.paymentIntentId || `pi_${Date.now()}`,
          status: "succeeded",
        }
      } else {
        throw new Error(response.message || "Payment processing failed")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process payment",
      }
    }
  },

  /**
   * Confirm a payment intent
   * This is used when you need to handle additional authentication steps
   */
  confirmPaymentIntent: async (paymentIntentId: string, paymentMethodId: string): Promise<PaymentResponse> => {
    try {
      // In a real implementation, this would be a call to your backend
      // which would then confirm the payment intent with Stripe
      const response = await fetch(`${ENDPOINTS.PAYMENT.CONFIRM_INTENT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentIntentId, paymentMethodId }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error confirming payment intent:", error)

      // For development, simulate a successful response
      if (import.meta.env.DEV) {
        return {
          success: true,
          paymentIntentId,
          status: "succeeded",
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to confirm payment intent",
      }
    }
  },
}

