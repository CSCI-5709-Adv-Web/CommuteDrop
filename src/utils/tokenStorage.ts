import type { User } from "../types/auth"

const TOKEN_KEY = "commutedrop_token"
const REFRESH_TOKEN_KEY = "commutedrop_refresh_token"
const USER_KEY = "commutedrop_user"

export const tokenStorage = {
  setTokens: (token: string, refreshToken: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } catch (error) {
      console.error("Error storing tokens:", error)
    }
  },

  setUser: (user: User): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error("Error storing user data:", error)
    }
  },

  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error("Error retrieving token:", error)
      return null
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error("Error retrieving refresh token:", error)
      return null
    }
  },

  getUser: (): User | null => {
    try {
      const userData = localStorage.getItem(USER_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error retrieving user data:", error)
      return null
    }
  },

  clearTokens: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error("Error clearing tokens:", error)
    }
  },

  isAuthenticated: (): boolean => {
    try {
      return !!localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error("Error checking authentication status:", error)
      return false
    }
  },
}

