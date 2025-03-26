import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { tokenStorage } from "../utils/tokenStorage"

export interface Card {
  id: string
  type: string
  last4: string
  cardholderName: string
  expiryDate: string
  isDefault: boolean
}

export interface CardRequest {
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv: string
  isDefault: boolean
}

export const cardService = {
  // Update the getUserCards method to match the backend endpoint
  getUserCards: async (): Promise<ApiResponse<Card[]>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      return await apiClient.get<ApiResponse<Card[]>>(`${ENDPOINTS.USER.CARDS}/${user.email}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch payment methods",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the addCard method to match the backend endpoint
  addCard: async (cardData: CardRequest): Promise<ApiResponse<Card>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      return await apiClient.post<ApiResponse<Card>>(`${ENDPOINTS.USER.CARDS}/${user.email}`, cardData)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to add payment method",
        data: {} as Card,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the updateCard method to match the backend endpoint
  updateCard: async (cardId: string, cardData: Partial<CardRequest>): Promise<ApiResponse<Card>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      return await apiClient.put<ApiResponse<Card>>(`${ENDPOINTS.USER.CARDS}/${user.email}/${cardId}`, cardData)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update payment method",
        data: {} as Card,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the deleteCard method to match the backend endpoint
  deleteCard: async (cardId: string): Promise<ApiResponse<null>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      // Log the request for debugging
      console.log(`Deleting card with ID: ${cardId} for user: ${user.email}`)

      try {
        const response = await apiClient.delete<ApiResponse<null> | string>(
          `${ENDPOINTS.USER.CARDS}/${user.email}/${cardId}`,
        )

        // Log the successful response
        console.log("Delete card response:", response)

        // Handle string response
        if (typeof response === "string") {
          if (response.includes("deleted successfully")) {
            return {
              success: true,
              message: response,
              data: null,
            }
          }
        }

        // Handle ApiResponse
        if (typeof response === "object" && response !== null) {
          return response as ApiResponse<null>
        }

        // Default success response if we can't determine the type
        return {
          success: true,
          message: "Card deleted successfully",
          data: null,
        }
      } catch (apiError: any) {
        // Check if the error response indicates success (some APIs return 204 No Content)
        if (apiError.status === 204) {
          return {
            success: true,
            message: "Card deleted successfully",
            data: null,
          }
        }
        throw apiError
      }
    } catch (error: any) {
      console.error("Error in deleteCard service:", error)

      // Check if the error response indicates success (some APIs return 200 but throw in the client)
      if (error.message && typeof error.message === "string" && error.message.includes("deleted successfully")) {
        return {
          success: true,
          message: "Card deleted successfully",
          data: null,
          errors: [],
        }
      }

      // Provide more detailed error information
      return {
        success: false,
        message: error.message || "Failed to delete payment method",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the setDefaultCard method to match the backend endpoint
  setDefaultCard: async (cardId: string): Promise<ApiResponse<Card>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      // To set a card as default, we update it with isDefault: true
      return await apiClient.put<ApiResponse<Card>>(`${ENDPOINTS.USER.CARDS}/${user.email}/${cardId}`, {
        isDefault: true,
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to set default payment method",
        data: {} as Card,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

