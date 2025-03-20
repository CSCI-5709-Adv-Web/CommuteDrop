// Token storage utility functions
const TOKEN_KEY = "commutedrop_token"
const REFRESH_TOKEN_KEY = "commutedrop_refresh_token"
const USER_KEY = "commutedrop_user"

export const tokenStorage = {
  // Store tokens and user data
  setTokens: (token: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  // Store user data
  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  // Get token
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  // Get user data
  getUser: (): any => {
    const userData = localStorage.getItem(USER_KEY)
    return userData ? JSON.parse(userData) : null
  },

  // Clear all auth data
  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY)
  },
}

