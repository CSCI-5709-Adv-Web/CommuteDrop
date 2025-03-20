// JWT utility functions
export const jwtUtils = {
  // Parse JWT token to get user info
  parseToken: (token: string): any => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error parsing JWT token:", error)
      return null
    }
  },

  // Get user email from token
  getUserEmail: (token: string): string | null => {
    try {
      const decoded = jwtUtils.parseToken(token)
      return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || null
    } catch (error) {
      console.error("Error getting user email from token:", error)
      return null
    }
  },

  // Get user ID from token
  getUserId: (token: string): string | null => {
    try {
      const decoded = jwtUtils.parseToken(token)
      return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null
    } catch (error) {
      console.error("Error getting user ID from token:", error)
      return null
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    try {
      const decoded = jwtUtils.parseToken(token)
      if (!decoded.exp) return true

      const currentTime = Date.now() / 1000
      return decoded.exp < currentTime
    } catch (error) {
      console.error("Error checking token expiration:", error)
      return true
    }
  },
}

