// Central configuration for API endpoints and config values

// Update API_CONFIG to use environment variables or fallback values

// Base API URLs
export const API_CONFIG = {
  // Use environment variable or fallback to localhost with correct port for auth service
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5087/api",
  // Location service URL
  LOCATION_SERVICE_URL: import.meta.env.VITE_LOCATION_SERVICE_URL || "http://localhost:5001/api/location",
  // Keep the Maps API key only for map rendering, not for services
  MAPS_API_KEY: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY || "",
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

  // Maps endpoints - updated to use location service
  MAPS: {
    GEOCODE: `${API_CONFIG.LOCATION_SERVICE_URL}/geocode`,
    REVERSE_GEOCODE: `${API_CONFIG.LOCATION_SERVICE_URL}/reverse-geocode`,
    DISTANCE_MATRIX: `${API_CONFIG.LOCATION_SERVICE_URL}/matrix`,
    DIRECTIONS: `${API_CONFIG.LOCATION_SERVICE_URL}/route`,
    AUTOCOMPLETE: `${API_CONFIG.LOCATION_SERVICE_URL}/autocomplete`,
    NEARBY: `${API_CONFIG.LOCATION_SERVICE_URL}/nearby`,
    REGION: `${API_CONFIG.LOCATION_SERVICE_URL}/region`,
  },
}

