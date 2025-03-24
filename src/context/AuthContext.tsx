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
import type { AuthState, User } from "../types/auth";
import { tokenStorage } from "../utils/tokenStorage";
import { jwtUtils } from "../utils/jwtUtils";
import { api } from "../services/auth-service";

const initialState: AuthState = {
  user: null,
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

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitializing, setIsInitializing] = useState(true);

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

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      clearError,
      isInitializing,
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
