"use client";

import { useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Loader } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface GoogleButtonProps {
  onClick?: () => Promise<void>;
}

export default function GoogleButton({ onClick }: GoogleButtonProps) {
  const { refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);

      if (onClick) {
        // Use the provided onClick handler if available
        await onClick();
      } else {
        // Default implementation using Supabase
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          console.error("Google sign-in error:", error);
          throw error;
        }
      }

      // The page will redirect to Google for authentication
      // After successful authentication, it will redirect back to your app
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setIsLoading(false);
    }
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="flex w-full items-center justify-center space-x-2 rounded-lg border py-3 hover:bg-gray-50 transition-colors disabled:opacity-70"
      aria-label="Continue with Google"
    >
      {isLoading ? (
        <Loader className="h-5 w-5 animate-spin" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
      )}
      <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
    </button>
  );
}
