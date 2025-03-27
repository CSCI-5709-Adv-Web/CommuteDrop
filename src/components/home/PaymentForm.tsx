"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PaymentMethodSelector from "./payment/PaymentMethodSelector";
import OrderSummary from "./payment/OrderSummary";
import PaymentButton from "./payment/PaymentButton";
import SuccessConfetti from "./payment/SuccessConfetti";
import { cardService, type Card } from "../../services/card-service";
import { paymentService } from "../../services/payment-service";
import { Loader } from "lucide-react";

// Load Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_PUBLIC_STRIPE_API_KEY || ""
);

interface PaymentFormProps {
  onBack: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  orderId?: string;
  amount?: number; // in cents
}

function StripePaymentForm({
  onBack,
  onPaymentSuccess,
  orderId,
  amount = 1599,
}: PaymentFormProps) {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch saved cards
  const fetchSavedCards = async () => {
    setIsLoadingCards(true);
    setCardError(null);
    try {
      const response = await cardService.getUserCards();
      if (response.success) {
        setSavedCards(response.data);

        // Select default card if available
        if (response.data.length > 0) {
          const defaultCard = response.data.find((card) => card.isDefault);
          if (defaultCard) {
            setSelectedCardId(defaultCard.id);
          } else {
            setSelectedCardId(response.data[0].id);
          }
        } else {
          // No cards available, show error
          setCardError(
            "No payment methods available. Please add a card in your profile."
          );
        }
      } else {
        setCardError(response.message || "Failed to load payment methods");
      }
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      setCardError("Failed to load payment methods. Please try again.");
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchSavedCards();
  }, []);

  // Handle payment submission
  const handlePayment = async () => {
    if (!stripe || !elements || !orderId) {
      setError("Payment processing is not available. Please try again later.");
      return;
    }

    if (!selectedCardId) {
      setError("Please select a payment method.");
      return;
    }

    setLoading(true);
    setPaymentStatus("processing");
    setError(null);

    try {
      // Process the payment using the selected card
      const paymentResponse = await paymentService.processPayment({
        orderId,
        paymentMethodId: selectedCardId,
        amount: amount / 100, // Convert from cents to dollars for the API
      });

      if (paymentResponse.success) {
        setPaymentStatus("success");
        // Wait a moment to show the success animation
        setTimeout(() => {
          onPaymentSuccess(
            paymentResponse.paymentIntentId || `pi_${Date.now()}`
          );
        }, 2000);
      } else {
        throw new Error(paymentResponse.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Payment processing failed. Please try again."
      );
      setPaymentStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Handle retry after error
  const handleRetry = () => {
    setPaymentStatus("idle");
    setError(null);
  };

  // Format the amount for display
  const displayAmount = (amount / 100).toFixed(2);

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 h-full flex flex-col bg-white max-w-md mx-auto relative overflow-hidden"
    >
      <AnimatePresence>
        {paymentStatus === "success" && <SuccessConfetti />}
      </AnimatePresence>

      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 ml-4">Payment</h2>
      </div>

      <div className="flex items-center mb-4">
        <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
        <p className="text-sm text-gray-700">Secure payment processing</p>
      </div>

      {/* Error Messages */}
      {(error || cardError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-600">{error || cardError}</p>
          </div>
        </div>
      )}

      {isLoadingCards ? (
        <div className="mb-6 flex justify-center items-center py-8">
          <Loader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : savedCards && savedCards.length > 0 && paymentStatus === "idle" ? (
        <PaymentMethodSelector
          savedCards={savedCards || []}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          isLoading={false}
          useNewCard={false}
          onSelectNewCard={() => {}}
        />
      ) : (
        !cardError && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">No payment methods available.</p>
            <button
              onClick={() => fetchSavedCards()}
              className="mt-2 text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )
      )}

      <OrderSummary
        deliveryFee={((amount * 0.8125) / 100).toFixed(2)}
        serviceFee={((amount * 0.1875) / 100).toFixed(2)}
        total={displayAmount}
      />

      {/* Add a spacer div before the button to ensure proper spacing */}
      <div className="flex-grow min-h-[20px]"></div>

      {/* Update the PaymentButton component with proper margin and position */}
      <div className="sticky bottom-6 mt-6 z-10">
        <PaymentButton
          paymentStatus={paymentStatus}
          isDisabled={
            loading ||
            isLoadingCards ||
            paymentStatus === "processing" ||
            paymentStatus === "success" ||
            !selectedCardId
          }
          amount={displayAmount}
          onClick={paymentStatus === "error" ? handleRetry : handlePayment}
          orderId={orderId}
        />
      </div>

      <AnimatePresence>
        {paymentStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 text-center text-green-600 text-sm"
          >
            Payment successful! Redirecting to confirmation...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PaymentWithStripe(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}
