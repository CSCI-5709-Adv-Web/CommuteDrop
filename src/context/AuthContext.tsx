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

const initialState: AuthState = {
  user: null,
  userProfile: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitializing, setIsInitializing] = useState(true);

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
    }),
    [state, isInitializing]
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
