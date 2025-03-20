// Central configuration for API endpoints and config values

// Base API URLs
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5087/api",
  // Add a fallback API key for development (in production, use environment variables)
  MAPS_API_KEY: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_FALLBACK_API_KEY_FOR_DEVELOPMENT",
  DISTANCE_MATRIX_API: "https://maps.googleapis.com/maps/api/distancematrix/json",
  GEOCODING_API: "https://maps.googleapis.com/maps/api/geocode/json",
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
    GEOCODE: "/maps/geocode",
    REVERSE_GEOCODE: "/maps/reverse-geocode",
    DIRECTIONS: "/maps/directions",
  },
}

