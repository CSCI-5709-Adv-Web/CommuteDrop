"use client";

import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";
import GoogleButton from "./GoogleButton";
import { AlertCircle, Loader } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading, clearError, isInitializing } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.trim() && password.trim()) {
      try {
        // Wait for the login to complete
        const success = await login(email, password);

        // Only navigate if login was successful
        if (success) {
          navigate("/home");
        }
      } catch (err) {
        // Error is handled by the AuthContext
        console.error("Login error:", err);
      }
    }
  };

  // Don't render the form while initializing
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-medium text-center">
        What's your email and password?
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Login Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) clearError();
        }}
        className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black text-center"
        required
        autoComplete="email"
      />

      <PasswordInput
        label="Enter your password"
        password={password}
        setPassword={(value) => {
          setPassword(value);
          if (error) clearError();
        }}
      />

      <button
        type="submit"
        disabled={!email.trim() || !password.trim() || isLoading}
        className="w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Logging in...
          </>
        ) : (
          "Continue"
        )}
      </button>

      <div className="flex items-center before:flex-1 before:border-t after:flex-1 after:border-t">
        <span className="mx-4 text-gray-500">or</span>
      </div>

      <GoogleButton />

      <div className="text-center text-sm text-gray-600">
        New to Commute Drop?{" "}
        <a href="/signup" className="text-black hover:underline font-medium">
          Sign up instead
        </a>
      </div>
    </form>
  );
}
