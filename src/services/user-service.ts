import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { User } from "../types/auth"

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

export const userService = {

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

