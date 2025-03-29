"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { AuthState, User, UserProfile } from "../types/auth";
import { tokenStorage } from "../utils/tokenStorage";
import { jwtUtils } from "../utils/jwtUtils";
import { api } from "../services/auth-service";
import { userService } from "../services/user-service";
import { paymentService } from "../services/payment-service";

const initialState: AuthState = {
  user: null,
  userProfile: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  customerId: null, // Initialize customerId as null
};

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
    }
  | {
      type: "UPDATE_USER_PROFILE";
      payload: UserProfile;
    }
  | {
      type: "SET_CUSTOMER_ID";
      payload: string;
    };

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
        userProfile: null,
        token: null,
        refreshToken: null,
        customerId: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userProfile: null,
        token: null,
        refreshToken: null,
        customerId: null,
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
    case "UPDATE_USER_PROFILE":
      return {
        ...state,
        userProfile: action.payload,
        // Also update the basic user info
        user: {
          ...state.user!,
          name: action.payload.name,
          email: action.payload.email,
        },
      };
    case "SET_CUSTOMER_ID":
      return {
        ...state,
        customerId: action.payload,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isInitializing: boolean;
  updateUserProfile: (profile: UserProfile) => void;
  refreshUserProfile: () => Promise<void>;
  fetchCustomerId: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user profile
  const fetchUserProfile = async (email: string) => {
    try {
      // Check if we already have the profile in localStorage
      const cachedProfile = tokenStorage.getUserProfile();
      if (cachedProfile && cachedProfile.email === email) {
        dispatch({
          type: "UPDATE_USER_PROFILE",
          payload: cachedProfile,
        });
        return;
      }

      // If not cached or email doesn't match, fetch from API
      const response = await userService.getProfile();
      if (response.success && response.data) {
        // Update the user object with the name from the profile
        const updatedUser = {
          ...state.user!,
          name: response.data.name,
          email: response.data.email,
        };
        tokenStorage.setUser(updatedUser);

        dispatch({
          type: "UPDATE_USER_PROFILE",
          payload: response.data,
        });
        // Store in localStorage
        tokenStorage.setUserProfile(response.data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (!state.user?.email) return;

    try {
      const response = await userService.getProfile();
      if (response.success && response.data) {
        dispatch({
          type: "UPDATE_USER_PROFILE",
          payload: response.data,
        });
        // Store in localStorage
        tokenStorage.setUserProfile(response.data);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  // Update the fetchCustomerId function to handle the case when customer is not found
  const fetchCustomerId = async (): Promise<string | null> => {
    // If we already have a customer ID in state, return it
    if (state.customerId) {
      return state.customerId;
    }
    // If no user is logged in, return null
    if (!state.user?.email) {
      return null;
    }
    try {
      console.log("Fetching customer ID for user:", state.user.email);
      // Fetch customer ID from payment service
      const response = await paymentService.getCustomerByEmail(
        state.user.email
      );
      if (response.success && response.customerId) {
        console.log("Found customer ID:", response.customerId);
        // Store in state
        dispatch({
          type: "SET_CUSTOMER_ID",
          payload: response.customerId,
        });
        return response.customerId;
      } else {
        console.warn(
          "No valid Stripe customer ID found for user:",
          state.user.email
        );
        // Don't create a customer here - it should only be created during registration
        setError(
          "Your payment profile isn't set up correctly. Please contact support."
        );
        return null;
      }
    } catch (error) {
      console.error("Error fetching customer ID:", error);
      return null;
    }
  };

  // Update the createCustomerDuringRegistration function to use the correct endpoint
  const createCustomerDuringRegistration = async (
    email: string,
    name: string
  ): Promise<string | null> => {
    try {
      console.log("Creating customer record for newly registered user:", email);

      // Call the payment service to create a customer using the POST /customer endpoint
      const response = await paymentService.createCustomer(name, email);

      if (response.success && response.customerId) {
        console.log(
          "Successfully created customer with ID:",
          response.customerId
        );

        // Store in state
        dispatch({
          type: "SET_CUSTOMER_ID",
          payload: response.customerId,
        });

        return response.customerId;
      } else {
        console.warn(
          "Failed to create customer during registration:",
          response.message
        );
        return null;
      }
    } catch (error) {
      console.error("Error creating customer during registration:", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsInitializing(true);
      try {
        const token = tokenStorage.getToken();
        const refreshToken = tokenStorage.getRefreshToken();

        if (!token || !refreshToken) {
          dispatch({ type: "LOGOUT" });
          setIsInitializing(false);
          return;
        }

        if (jwtUtils.isTokenExpired(token)) {
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

                // Fetch user profile after successful token refresh
                await fetchUserProfile(email);

                // Fetch customer ID after successful authentication
                await fetchCustomerId();

                setIsInitializing(false);
                return;
              }
            }

            tokenStorage.clearTokens();
            dispatch({ type: "LOGOUT" });
          } catch (error) {
            tokenStorage.clearTokens();
            dispatch({ type: "LOGOUT" });
          }
        } else {
          const email = jwtUtils.getUserEmail(token);

          if (email) {
            const user = tokenStorage.getUser() || { email };

            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                token,
                refreshToken,
                user,
              },
            });

            // Fetch user profile after successful authentication
            await fetchUserProfile(email);

            // Fetch customer ID after successful authentication
            await fetchCustomerId();
          } else {
            tokenStorage.clearTokens();
            dispatch({ type: "LOGOUT" });
          }
        }
      } catch (error) {
        tokenStorage.clearTokens();
        dispatch({ type: "LOGOUT" });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await api.auth.login({ email, password });

      if (response.success) {
        const { token, refreshToken } = response.data;
        tokenStorage.setTokens(token, refreshToken);
        const userEmail = jwtUtils.getUserEmail(token);

        if (userEmail) {
          const user: User = { email: userEmail };
          tokenStorage.setUser(user);

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { token, refreshToken, user },
          });

          // Fetch user profile after successful login
          await fetchUserProfile(userEmail);

          // Fetch customer ID after successful login
          await fetchCustomerId();

          return true;
        } else {
          throw new Error("Invalid token received");
        }
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: response.message || "Login failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    dispatch({ type: "REGISTER_START" });

    try {
      const response = await api.auth.register({ name, email, password });

      if (response.success) {
        const { token, refreshToken } = response.data;
        tokenStorage.setTokens(token, refreshToken);
        const user: User = { email, name };
        tokenStorage.setUser(user);

        dispatch({
          type: "REGISTER_SUCCESS",
          payload: { token, refreshToken, user },
        });

        // Create customer record after successful registration
        await createCustomerDuringRegistration(email, name);

        // Fetch user profile after successful registration
        await fetchUserProfile(email);

        return true;
      } else {
        dispatch({
          type: "REGISTER_FAILURE",
          payload: response.message || "Registration failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: "REGISTER_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });
      return false;
    }
  };

  const logout = () => {
    tokenStorage.clearTokens();
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUserProfile = (profile: UserProfile) => {
    dispatch({
      type: "UPDATE_USER_PROFILE",
      payload: profile,
    });
  };

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      clearError,
      isInitializing,
      updateUserProfile,
      refreshUserProfile,
      fetchCustomerId,
      error,
    }),
    [state, isInitializing, error]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
