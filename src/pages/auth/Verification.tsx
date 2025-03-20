"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader } from "lucide-react";

export default function VerificationPage() {
  const [code, setCode] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const handleCodeChange = (index: number, value: string) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    if (code.join("").length === 4) {
      setIsSubmitting(true);
      setError("");

      try {
        // In a real app, you would verify the code with your API
        // For now, we'll simulate a successful verification
        setTimeout(() => {
          setIsSubmitting(false);
          navigate("/home");
        }, 1500);
      } catch (err) {
        setIsSubmitting(false);
        setError("Invalid verification code. Please try again.");
      }
    }
  };

  const handleResendCode = () => {
    if (timer === 0) {
      // In a real app, you would call your API to resend the code
      setTimer(30);
      setError("");
      // Show success message
      alert("Verification code has been resent to your email");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-6">
            <h1 className="text-2xl font-medium text-center">
              Verify Your Account
            </h1>
            <p className="text-center text-gray-600">
              Enter the 4-digit code sent to
              <br />
              <span className="font-medium break-all">{email}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleCodeChange(index, e.target.value.replace(/\D/g, ""))
                  }
                  className="w-16 h-16 text-3xl text-center rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isSubmitting}
                />
              ))}
            </div>
            <div className="text-center">
              <button
                className={`text-blue-600 ${
                  timer > 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:underline"
                }`}
                disabled={timer > 0 || isSubmitting}
                onClick={handleResendCode}
              >
                Resend code via email ({Math.floor(timer / 60)}:
                {timer % 60 < 10 ? "0" : ""}
                {timer % 60})
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={code.join("").length !== 4 || isSubmitting}
              className="w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
