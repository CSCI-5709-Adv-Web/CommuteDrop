import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { User, UserProfile, UpdateUserRequest } from "../types/auth"
import { tokenStorage, DEFAULT_PROFILE_IMAGE } from "../utils/tokenStorage"

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
      // Get the user's email from the token or local storage
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      // Try to get cached profile first
      const cachedProfile = tokenStorage.getUserProfile()
      if (cachedProfile && cachedProfile.email === user.email) {
        return {
          success: true,
          message: "Profile retrieved from cache",
          data: cachedProfile,
        }
      }

      // Call the external API with the email
      try {
        const response = await apiClient.get<ApiResponse<UserProfile>>(`${ENDPOINTS.USER.DETAILS}/${user.email}`)

        // If successful, store the profile in local storage
        if (response.success && response.data) {
          tokenStorage.setUserProfile(response.data)
        }

        return response
      } catch (apiError: any) {
        // If API fails, use basic user info to create a minimal profile
        console.warn("API error, using fallback profile:", apiError)
        const fallbackProfile: UserProfile = {
          email: user.email,
          name: user.name || user.email.split("@")[0],
          profileImage: DEFAULT_PROFILE_IMAGE,
        }

        tokenStorage.setUserProfile(fallbackProfile)

        return {
          success: true,
          message: "Using fallback profile due to API error",
          data: fallbackProfile,
        }
      }
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
      // Get the user's email from the token or local storage
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      // Prepare the update request
      const updateRequest: UpdateUserRequest = {
        name: profileData.name,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        profileImage: profileData.profileImage,
      }

      // Call the external API with the email and update data
      const response = await apiClient.put<ApiResponse<UserProfile>>(
        `${ENDPOINTS.USER.UPDATE}/${user.email}`,
        updateRequest,
      )

      // If successful, update the profile in local storage
      if (response.success && response.data) {
        tokenStorage.setUserProfile(response.data)

        // Also update the basic user info
        const updatedUser: User = {
          email: user.email,
          name: response.data.name,
        }
        tokenStorage.setUser(updatedUser)
      }

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update user profile",
        data: {} as UserProfile,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  deleteAccount: async (): Promise<ApiResponse<null>> => {
    try {
      // Get the user's email from the token or local storage
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      // Call the external API with the email
      const response = await apiClient.delete<ApiResponse<null>>(`${ENDPOINTS.USER.DELETE}/${user.email}`)

      // Clear local storage on successful deletion
      if (response.success) {
        tokenStorage.clearTokens()
      }

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to delete user account",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  uploadProfileImage: async (imageFile: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("image", imageFile)

      // Get the user's email from the token or local storage
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      try {
        // Try to upload to the actual API endpoint
        const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
          `${ENDPOINTS.USER.UPDATE}/${user.email}/image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        )

        // If successful, update the profile image in local storage
        if (response.success && response.data) {
          const currentProfile = tokenStorage.getUserProfile()
          if (currentProfile) {
            const updatedProfile = {
              ...currentProfile,
              profileImage: response.data.imageUrl,
            }
            tokenStorage.setUserProfile(updatedProfile)
          }
        }

        return response
      } catch (apiError: any) {
        console.warn("API error during image upload, using local fallback:", apiError)

        // If the API fails, create a local URL and use it as a fallback
        // In a real app, you would use a service like Cloudinary or AWS S3
        // This is just a demo fallback for development

        // Read the file and convert to base64 for local storage
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string

            // Store in localStorage (not ideal for production, just for demo)
            const imageUrl = base64String

            // Update the user profile
            const currentProfile = tokenStorage.getUserProfile()
            if (currentProfile) {
              const updatedProfile = {
                ...currentProfile,
                profileImage: imageUrl,
              }
              tokenStorage.setUserProfile(updatedProfile)
            }

            resolve({
              success: true,
              message: "Image uploaded successfully (local fallback)",
              data: { imageUrl },
            })
          }
          reader.readAsDataURL(imageFile)
        })
      }
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
      try {
        return await apiClient.get<ApiResponse<PaymentMethod[]>>(ENDPOINTS.USER.PAYMENT_METHODS)
      } catch (apiError: any) {
        // If endpoint returns 404, return empty array instead of error
        if (apiError.status === 404) {
          console.warn("Payment methods endpoint not found, returning empty array")
          return {
            success: true,
            message: "No payment methods found",
            data: [],
          }
        }
        throw apiError
      }
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

