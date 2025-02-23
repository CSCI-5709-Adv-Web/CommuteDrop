"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ShieldCheck, Check, Loader2, RefreshCcw } from "lucide-react"

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_API_KEY || "");

interface PaymentFormProps {
  onBack: () => void
  onPaymentSuccess: (paymentIntentId: string) => void
}

// Success confetti animation
const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-green-500"
        initial={{
          opacity: 1,
          x: "50%",
          y: "50%",
        }}
        animate={{
          opacity: 0,
          x: `${50 + (Math.random() - 0.5) * 100}%`,
          y: `${50 + (Math.random() - 0.5) * 100}%`,
          scale: 0,
        }}
        transition={{
          duration: 1,
          delay: i * 0.02,
          ease: "easeOut",
        }}
        style={{
          borderRadius: "50%",
        }}
      />
    ))}
  </div>
)

const StripePaymentForm = ({ onBack, onPaymentSuccess }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")

  // Function to fetch client_secret from backend
  const fetchClientSecret = async () => {
    try {
      const response = await fetch("http://localhost:8000/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1599 }), // Amount in cents ($15.99)
      })

      const data = await response.json()
      return data.clientSecret
    } catch (err) {
      setError("Error fetching payment intent")
      return null
    }
  }

  // Handle Payment Submission
  const handlePayment = async () => {
    if (!stripe || !elements) return

    setLoading(true)
    setError("")
    setPaymentStatus("processing")

    const clientSecret = await fetchClientSecret()
    if (!clientSecret) {
      setLoading(false)
      setPaymentStatus("error")
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message || "Payment failed.")
      setPaymentStatus("error")
    } else if (paymentIntent) {
      setPaymentStatus("success")
      setTimeout(() => {
        onPaymentSuccess(paymentIntent.id)
      }, 2000) // Give time for the success animation to play
    }
  }

  // Add a retry handler function after the handlePayment function
  const handleRetry = () => {
    setPaymentStatus("idle")
    setError("")
    setLoading(false)
    // Reset the card input
    if (elements) {
      const cardElement = elements.getElement(CardElement)
      if (cardElement) {
        cardElement.clear()
      }
    }
  }

  const buttonVariants = {
    idle: {
      backgroundColor: "#000000",
      color: "#ffffff",
      width: "100%",
    },
    processing: {
      backgroundColor: "#4B5563",
      color: "#ffffff",
      width: "100%",
    },
    success: {
      backgroundColor: "#059669",
      color: "#ffffff",
      width: "100%",
    },
    error: {
      backgroundColor: "#DC2626",
      color: "#ffffff",
      width: "100%",
    },
  }

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  }

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full flex flex-col bg-white max-w-md mx-auto relative overflow-hidden"
    >
      {/* Success Confetti */}
      <AnimatePresence>{paymentStatus === "success" && <Confetti />}</AnimatePresence>

      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 ml-4">Enter Payment Details</h2>
      </div>

      {/* Secure Payment */}
      <div className="flex items-center mb-4">
        <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
        <p className="text-sm text-gray-700">Secure payment processing</p>
      </div>

      {/* Stripe Card Input */}
      <div
        className={`bg-gray-100 p-4 rounded-lg shadow-inner transition-colors duration-300 ${
          paymentStatus === "error" ? "bg-red-50" : paymentStatus === "success" ? "bg-green-50" : ""
        }`}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#333",
                "::placeholder": { color: "#888" },
              },
              invalid: { color: "#e63946" },
            },
          }}
        />
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm mt-2">
          {error}
        </motion.p>
      )}

      {/* Pay Button */}
      <motion.button
        className="mt-6 py-4 rounded-xl text-lg font-semibold relative overflow-hidden"
        variants={buttonVariants}
        animate={paymentStatus}
        whileHover={paymentStatus === "idle" ? { scale: 1.02 } : undefined}
        whileTap={paymentStatus === "idle" ? { scale: 0.98 } : undefined}
        onClick={paymentStatus === "error" ? handleRetry : handlePayment}
        disabled={loading || paymentStatus === "processing" || paymentStatus === "success"}
      >
        <AnimatePresence mode="wait">
          {paymentStatus === "idle" && (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Pay $15.99
            </motion.span>
          )}

          {paymentStatus === "processing" && (
            <motion.span
              key="processing"
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </motion.span>
          )}

          {paymentStatus === "success" && (
            <motion.span
              key="success"
              className="flex items-center justify-center gap-2"
              initial="hidden"
              animate="visible"
              variants={iconVariants}
            >
              <Check className="w-5 h-5" />
              Payment Successful!
            </motion.span>
          )}

          {paymentStatus === "error" && (
            <motion.span
              key="error"
              className="flex items-center justify-center gap-2"
              initial="hidden"
              animate="visible"
              variants={iconVariants}
            >
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RefreshCcw className="w-5 h-5" />
                Try Again
              </motion.div>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Success Message */}
      <AnimatePresence>
        {paymentStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 text-center text-green-600 text-sm"
          >
            Redirecting to confirmation...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Wrap Component with Stripe Provider
export default function PaymentWithStripe({ onBack, onPaymentSuccess }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm onBack={onBack} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  )
}

