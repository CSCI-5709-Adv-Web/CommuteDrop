// Update the API_CONFIG and ENDPOINTS to include the new payment service endpoints

export const API_CONFIG = {
  AUTH_BASE_URL:
    process.env.VITE_API_BASE_URL + "/api" || "http://localhost:5087/api",
  TOKEN_BASE_URL: process.env.VITE_API_BASE_URL || "http://localhost:5087",
  LOCATION_SERVICE_URL:
    process.env.VITE_LOCATION_SERVICE_URL ||
    "http://localhost:5001/location",
  ORDER_SERVICE_URL:
    process.env.VITE_ORDER_SERVICE_URL || "http://localhost:9002/order",
  PAYMENT_SERVICE_URL:
    process.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:9000",
  MAPS_API_KEY:
    process.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
    "",
  TIMEOUT: 15000,
  DEFAULT_COUNTRY: "Canada",
  DEFAULT_PROVINCE: "Nova Scotia",
  DEFAULT_CITY: "Halifax",
  MAX_RESULTS: 5,

  // Update service configurations for token service with more specific scopes
  SERVICES: {
    location: {
      clientId:
        process.env.VITE_LOCATION_CLIENT_ID || "location_service_client",
      clientSecret:
        process.env.VITE_LOCATION_CLIENT_SECRET ||
        "location_service_secret",
      scopes: ["location.read", "location.write"],
    },
    order: {
      clientId: process.env.VITE_ORDER_CLIENT_ID || "order_service_client",
      clientSecret:
        process.env.VITE_ORDER_CLIENT_SECRET || "order_service_secret",
      scopes: ["order.read", "order.write"],
    },
    payment: {
      clientId:
        process.env.VITE_PAYMENT_CLIENT_ID || "payment_service_client",
      clientSecret:
        process.env.VITE_PAYMENT_CLIENT_SECRET || "payment_service_secret",
      scopes: ["payment.read", "payment.write"],
    },
  },
};

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_CONFIG.AUTH_BASE_URL}/auth/login`,
    REGISTER: `${API_CONFIG.AUTH_BASE_URL}/auth/register`,
    REFRESH_TOKEN: `${API_CONFIG.AUTH_BASE_URL}/auth/refresh-token`,
    VERIFY_EMAIL: `${API_CONFIG.AUTH_BASE_URL}/auth/verify-email`,
  },

  TOKEN: {
    NEW: `${API_CONFIG.TOKEN_BASE_URL}/connect/token`,
  },

  // User endpoints - updated to match the backend controller
  USER: {
    DETAILS: `${API_CONFIG.AUTH_BASE_URL}/user/details`,
    UPDATE: `${API_CONFIG.AUTH_BASE_URL}/user/update`,
    DELETE: `${API_CONFIG.AUTH_BASE_URL}/user/delete`,
    CARDS: `${API_CONFIG.AUTH_BASE_URL}/user/cards`,
  },
  // Delivery endpoints
  DELIVERY: {
    ESTIMATE: "/delivery/estimate",
    CREATE: "/delivery/create",
    HISTORY: "/delivery/history",
    TRACK: "/delivery/track",
  },
  // Order endpoints - ensure these match exactly what the server expects
  ORDER: {
    CREATE: `${API_CONFIG.ORDER_SERVICE_URL}/create`,
    UPDATE: `${API_CONFIG.ORDER_SERVICE_URL}/updateStatus`,
    CANCEL: `${API_CONFIG.ORDER_SERVICE_URL}/:order_id`,
    PAYMENT: `${API_CONFIG.ORDER_SERVICE_URL}/:order_id/payment`,
    USER_ORDERS: `${API_CONFIG.ORDER_SERVICE_URL}/getAllOrders/user/:user_id`,
    RIDER_ORDERS: `${API_CONFIG.ORDER_SERVICE_URL}/getAllOrders/rider/:rider_id`,
  },
  // Payment endpoints - updated to match the new Stripe-based API
  PAYMENT: {
    // Customer management
    CUSTOMER: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/customer`,

    // Payment methods
    PAYMENT_METHOD: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/payment-method`,
    PAYMENT_METHOD_DETAILS: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/payment-method-details`,
    PAYMENT_METHODS: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/payment-methods/:customerId`,

    // Payments
    PAYMENT_INTENT: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/payment-intent`,
    REFUND: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/refund`,

    // Legacy endpoints (keeping for backward compatibility)
    CREATE_INTENT: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/payment-intent`,
    PROCESS: `${API_CONFIG.PAYMENT_SERVICE_URL}/payment/process`,
  },
  // Maps endpoints
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
};
