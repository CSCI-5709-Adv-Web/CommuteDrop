"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import type { AuthState, User } from "../types/auth";
import { tokenStorage } from "../utils/tokenStorage";
import { jwtUtils } from "../utils/jwtUtils";
import { api } from "../services/auth-service";

// Initial auth state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false, // Changed from true to false
  error: null,
};

// Auth action types
type AuthAction =
  | { type: "LOGIN_START" }
  | {
      type: "LOGIN_SUCCESS";
      payload: { token: string; refreshToken: string; user: User };
    }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "REGISTER_START" }
  | {
      type: "REGISTER_SUCCESS";
      payload: { token: string; refreshToken: string; user: User };
    }
  | { type: "REGISTER_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | {
      type: "REFRESH_TOKEN_SUCCESS";
      payload: { token: string; refreshToken: string };
    };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "REFRESH_TOKEN_SUCCESS":
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };
    default:
      return state;
  }
};

// Create auth context
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isInitializing: boolean; // Add this to track initial loading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitializing, setIsInitializing] = useState(true); // Add this state

  // Check for existing tokens on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsInitializing(true); // Start initialization
      const token = tokenStorage.getToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (token && refreshToken) {
        try {
          // Check if token is expired
          if (jwtUtils.isTokenExpired(token)) {
            // Try to refresh the token
            try {
              const response = await api.auth.refreshToken(refreshToken);

              if (response.success) {
                const { token: newToken, refreshToken: newRefreshToken } =
                  response.data;
                const email = jwtUtils.getUserEmail(newToken);

                if (email) {
                  tokenStorage.setTokens(newToken, newRefreshToken);

                  dispatch({
                    type: "LOGIN_SUCCESS",
                    payload: {
                      token: newToken,
                      refreshToken: newRefreshToken,
                      user: { email },
                    },
                  });
                  setIsInitializing(false); // End initialization
                  return;
                }
              }

              // If refresh failed, logout
              tokenStorage.clearTokens();
              dispatch({ type: "LOGOUT" });
            } catch (error) {
              tokenStorage.clearTokens();
              dispatch({ type: "LOGOUT" });
            }
          } else {
            // Token is still valid
            const email = jwtUtils.getUserEmail(token);

            if (email) {
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: {
                  token,
                  refreshToken,
                  user: { email },
                },
              });
            } else {
              tokenStorage.clearTokens();
              dispatch({ type: "LOGOUT" });
            }
          }
        } catch (error) {
          tokenStorage.clearTokens();
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
      setIsInitializing(false); // End initialization
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await api.auth.login({ email, password });

      if (response.success) {
        const { token, refreshToken } = response.data;

        // Store tokens
        tokenStorage.setTokens(token, refreshToken);

        // Extract user info from token
        const userEmail = jwtUtils.getUserEmail(token);

        if (userEmail) {
          const user: User = { email: userEmail };
          tokenStorage.setUser(user);

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { token, refreshToken, user },
          });

          return true; // Return success status
        } else {
          throw new Error("Invalid token received");
        }
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: response.message || "Login failed. Please try again.",
        });
        return false; // Return failure status
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
      return false; // Return failure status
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: "REGISTER_START" });

    try {
      const response = await api.auth.register({ name, email, password });

      if (response.success) {
        const { token, refreshToken } = response.data;

        // Store tokens
        tokenStorage.setTokens(token, refreshToken);

        // Create user object
        const user: User = { email, name };
        tokenStorage.setUser(user);

        dispatch({
          type: "REGISTER_SUCCESS",
          payload: { token, refreshToken, user },
        });

        return true; // Return success status
      } else {
        dispatch({
          type: "REGISTER_FAILURE",
          payload: response.message || "Registration failed. Please try again.",
        });
        return false; // Return failure status
      }
    } catch (error) {
      dispatch({
        type: "REGISTER_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });
      return false; // Return failure status
    }
  };

  // Logout function
  const logout = () => {
    tokenStorage.clearTokens();
    dispatch({ type: "LOGOUT" });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
