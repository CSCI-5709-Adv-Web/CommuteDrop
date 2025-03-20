// Central configuration for API endpoints and config values

// Update API_CONFIG to use environment variables or fallback values

// Base API URLs
export const API_CONFIG = {
  // Use environment variable or fallback to localhost
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5087/api",
  // Add a fallback API key for development (in production, use environment variables)
  MAPS_API_KEY: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_FALLBACK_API_KEY_FOR_DEVELOPMENT",
  // Use proxy endpoints for maps services
  MAPS_PROXY_BASE: import.meta.env.VITE_MAPS_PROXY_BASE || "/api/maps",
  TIMEOUT: 15000, // 15 seconds
}

// API Endpoint paths
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH_TOKEN: "/auth/refresh-token",
    VERIFY_EMAIL: "/auth/verify-email",
  },

  // User endpoints
  USER: {
    PROFILE: "/user/profile",
    UPDATE_PROFILE: "/user/profile",
    SAVED_LOCATIONS: "/user/locations",
    PAYMENT_METHODS: "/user/payment-methods",
  },

  // Delivery endpoints
  DELIVERY: {
    ESTIMATE: "/delivery/estimate",
    CREATE: "/delivery/create",
    HISTORY: "/delivery/history",
    TRACK: "/delivery/track",
  },

  // Maps endpoints
  MAPS: {
    GEOCODE: `${API_CONFIG.MAPS_PROXY_BASE}/geocode`,
    REVERSE_GEOCODE: `${API_CONFIG.MAPS_PROXY_BASE}/reverse-geocode`,
    DISTANCE_MATRIX: `${API_CONFIG.MAPS_PROXY_BASE}/distance-matrix`,
    DIRECTIONS: `${API_CONFIG.MAPS_PROXY_BASE}/directions`,
  },
}

