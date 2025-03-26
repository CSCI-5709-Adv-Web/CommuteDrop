export const API_CONFIG = {
  AUTH_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5087/api",
  LOCATION_SERVICE_URL: import.meta.env.VITE_LOCATION_SERVICE_URL || "http://localhost:5001/location",
  ORDER_SERVICE_URL: import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:9002/order",
  MAPS_API_KEY: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY || import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  TIMEOUT: 15000,
  DEFAULT_COUNTRY: "Canada",
  DEFAULT_PROVINCE: "Nova Scotia",
  DEFAULT_CITY: "Halifax",
  MAX_RESULTS: 5,
}

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_CONFIG.AUTH_BASE_URL}/auth/login`,
    REGISTER: `${API_CONFIG.AUTH_BASE_URL}/auth/register`,
    REFRESH_TOKEN: `${API_CONFIG.AUTH_BASE_URL}/auth/refresh-token`,
    VERIFY_EMAIL: `${API_CONFIG.AUTH_BASE_URL}/auth/verify-email`,
  },
  // User endpoints
  USER: {
    PROFILE: `${API_CONFIG.AUTH_BASE_URL}/user/profile`,
    UPDATE_PROFILE: `${API_CONFIG.AUTH_BASE_URL}/user/profile`,
    SAVED_LOCATIONS: `${API_CONFIG.AUTH_BASE_URL}/user/locations`,
    PAYMENT_METHODS: `${API_CONFIG.AUTH_BASE_URL}/user/payment-methods`,
  },
  // Delivery endpoints
  DELIVERY: {
    ESTIMATE: "/delivery/estimate",
    CREATE: "/delivery/create",
    HISTORY: "/delivery/history",
    TRACK: "/delivery/track",
  },
  // Order endpoints
  ORDER: {
    CREATE: `${API_CONFIG.ORDER_SERVICE_URL}/create`,
    CANCEL: `${API_CONFIG.ORDER_SERVICE_URL}/order/:order_id`,
    PAYMENT: `${API_CONFIG.ORDER_SERVICE_URL}/order/:order_id/payment`,
    USER_ORDERS: `${API_CONFIG.ORDER_SERVICE_URL}/order/user/:user_id`,
    RIDER_ORDERS: `${API_CONFIG.ORDER_SERVICE_URL}/order/rider/:rider_id`,
  },
  // Maps endpoints - updated to match the new location service API structure
  MAPS: {
    GEOCODE: `${API_CONFIG.LOCATION_SERVICE_URL}/geocode`,
    REVERSE_GEOCODE: `${API_CONFIG.LOCATION_SERVICE_URL}/geocode`,
    DISTANCE_MATRIX: `${API_CONFIG.LOCATION_SERVICE_URL}/matrix`,
    DIRECTIONS: `${API_CONFIG.LOCATION_SERVICE_URL}/route`,
    AUTOCOMPLETE: `${API_CONFIG.LOCATION_SERVICE_URL}/autocomplete`,
    NEARBY: `${API_CONFIG.LOCATION_SERVICE_URL}/nearby`,
    REGION: `${API_CONFIG.LOCATION_SERVICE_URL}/region`,
    HEALTH: `${API_CONFIG.LOCATION_SERVICE_URL}/health`,
  },
}

