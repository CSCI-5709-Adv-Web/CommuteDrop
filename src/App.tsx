"use client";

// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import routes from "./routes/Index";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            routes.find((r) => r.path === "/")?.element
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            routes.find((r) => r.path === "/login")?.element
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            routes.find((r) => r.path === "/signup")?.element
          )
        }
      />
      <Route
        path="/verify"
        element={routes.find((r) => r.path === "/verify")?.element}
      />
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/home"
          element={routes.find((r) => r.path === "/home")?.element}
        />
        <Route
          path="/profile"
          element={routes.find((r) => r.path === "/profile")?.element}
        />
      </Route>
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
