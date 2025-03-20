import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { User } from "../types/auth"

// Extended user profile information
export interface UserProfile extends User {
  name: string
  phone?: string
  address?: string
  profileImage?: string
  joinDate?: string
  rating?: number
  deliveriesCompleted?: number
}

export interface SavedLocation {
  id: number
  name: string
  address: string
  latitude?: number
  longitude?: number
  isDefault?: boolean
}

export interface PaymentMethod {
  id: number
  type: string
  last4: string
  cardholderName: string
  expiryDate: string
  isDefault: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: string[]
}

// User service for handling user profile related API calls
export const userService = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      return await apiClient.get<ApiResponse<UserProfile>>(ENDPOINTS.USER.PROFILE)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch user profile",
        data: {} as UserProfile,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    try {
      return await apiClient.put<ApiResponse<UserProfile>>(ENDPOINTS.USER.UPDATE_PROFILE, profileData)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update user profile",
        data: {} as UserProfile,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Upload profile image
   */
  uploadProfileImage: async (imageFile: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    try {
      const formData = new FormData()
      formData.append("image", imageFile)

      return await apiClient.post<ApiResponse<{ imageUrl: string }>>(`${ENDPOINTS.USER.PROFILE}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to upload profile image",
        data: { imageUrl: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Get user's saved locations
   */
  getSavedLocations: async (): Promise<ApiResponse<SavedLocation[]>> => {
    try {
      return await apiClient.get<ApiResponse<SavedLocation[]>>(ENDPOINTS.USER.SAVED_LOCATIONS)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch saved locations",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Add a saved location
   */
  addSavedLocation: async (location: Omit<SavedLocation, "id">): Promise<ApiResponse<SavedLocation>> => {
    try {
      return await apiClient.post<ApiResponse<SavedLocation>>(ENDPOINTS.USER.SAVED_LOCATIONS, location)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to add saved location",
        data: {} as SavedLocation,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Update a saved location
   */
  updateSavedLocation: async (id: number, location: Partial<SavedLocation>): Promise<ApiResponse<SavedLocation>> => {
    try {
      return await apiClient.put<ApiResponse<SavedLocation>>(`${ENDPOINTS.USER.SAVED_LOCATIONS}/${id}`, location)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update saved location",
        data: {} as SavedLocation,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Delete a saved location
   */
  deleteSavedLocation: async (id: number): Promise<ApiResponse<null>> => {
    try {
      return await apiClient.delete<ApiResponse<null>>(`${ENDPOINTS.USER.SAVED_LOCATIONS}/${id}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to delete saved location",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Get user's payment methods
   */
  getPaymentMethods: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    try {
      return await apiClient.get<ApiResponse<PaymentMethod[]>>(ENDPOINTS.USER.PAYMENT_METHODS)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch payment methods",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Add a payment method
   */
  addPaymentMethod: async (paymentMethod: Omit<PaymentMethod, "id">): Promise<ApiResponse<PaymentMethod>> => {
    try {
      return await apiClient.post<ApiResponse<PaymentMethod>>(ENDPOINTS.USER.PAYMENT_METHODS, paymentMethod)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to add payment method",
        data: {} as PaymentMethod,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Update a payment method
   */
  updatePaymentMethod: async (
    id: number,
    paymentMethod: Partial<PaymentMethod>,
  ): Promise<ApiResponse<PaymentMethod>> => {
    try {
      return await apiClient.put<ApiResponse<PaymentMethod>>(`${ENDPOINTS.USER.PAYMENT_METHODS}/${id}`, paymentMethod)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update payment method",
        data: {} as PaymentMethod,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Delete a payment method
   */
  deletePaymentMethod: async (id: number): Promise<ApiResponse<null>> => {
    try {
      return await apiClient.delete<ApiResponse<null>>(`${ENDPOINTS.USER.PAYMENT_METHODS}/${id}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to delete payment method",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  /**
   * Set a payment method as default
   */
  setDefaultPaymentMethod: async (id: number): Promise<ApiResponse<null>> => {
    try {
      return await apiClient.put<ApiResponse<null>>(`${ENDPOINTS.USER.PAYMENT_METHODS}/${id}/default`, {})
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to set default payment method",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

