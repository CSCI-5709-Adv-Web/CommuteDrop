"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PaymentMethodSelector from "./payment/PaymentMethodSelector";
import CardInput from "./payment/CardInput";
import OrderSummary from "./payment/OrderSummary";
import PaymentButton from "./payment/PaymentButton";
import SuccessConfetti from "./payment/SuccessConfetti";
import { usePaymentForm } from "../../hooks/usePaymentForm";

// Load Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_PUBLIC_STRIPE_API_KEY || ""
);

interface PaymentFormProps {
  onBack: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

function StripePaymentForm({ onBack, onPaymentSuccess }: PaymentFormProps) {
  const { user } = useAuth();
  const [savedCards, setSavedCards] = useState<any[]>([]);

  const {
    loading,
    error,
    paymentStatus,
    useNewCard,
    selectedCardId,
    setUseNewCard,
    setSelectedCardId,
    handlePayment,
    handleRetry,
  } = usePaymentForm({
    onPaymentSuccess,
    amount: 1599, // $15.99 in cents
  });

  // Fetch saved cards
  useEffect(() => {
    const fetchSavedCards = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll simulate with mock data
        const mockUserData = {
          paymentMethods: [
            {
              id: 1,
              type: "visa",
              last4: "4242",
              cardholderName: "Alex Johnson",
              expiryDate: "12/25",
              isDefault: true,
            },
            {
              id: 2,
              type: "mastercard",
              last4: "5555",
              cardholderName: "Alex Johnson",
              expiryDate: "09/26",
              isDefault: false,
            },
          ],
        };
        setSavedCards(mockUserData.paymentMethods);
        // Select default card
        const defaultCard = mockUserData.paymentMethods.find(
          (card) => card.isDefault
        );
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        }
      } catch (error) {
        console.error("Error fetching saved cards:", error);
      }
    };
    fetchSavedCards();
  }, [user]);

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
      <AnimatePresence>
        {paymentStatus === "success" && <SuccessConfetti />}
      </AnimatePresence>
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 ml-4">Payment</h2>
      </div>
      {/* Secure Payment */}
      <div className="flex items-center mb-4">
        <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
        <p className="text-sm text-gray-700">Secure payment processing</p>
      </div>
      {/* Payment Method Selection */}
      {savedCards.length > 0 && paymentStatus === "idle" && (
        <PaymentMethodSelector
          savedCards={savedCards}
          selectedCardId={selectedCardId}
          useNewCard={useNewCard}
          onSelectCard={(id) => {
            setSelectedCardId(id);
            setUseNewCard(false);
          }}
          onSelectNewCard={() => {
            setUseNewCard(true);
            setSelectedCardId(null);
          }}
        />
      )}
      {/* Stripe Card Input */}
      {(useNewCard || savedCards.length === 0) && (
        <CardInput paymentStatus={paymentStatus} />
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 text-sm mt-2"
        >
          {error}
        </motion.p>
      )}
      {/* Order Summary */}
      <OrderSummary deliveryFee="12.99" serviceFee="3.00" total="15.99" />
      {/* Pay Button */}
      <PaymentButton
        paymentStatus={paymentStatus}
        isDisabled={
          loading ||
          paymentStatus === "processing" ||
          paymentStatus === "success" ||
          (useNewCard && !Elements) ||
          (!useNewCard && selectedCardId === null)
        }
        amount="15.99"
        onClick={paymentStatus === "error" ? handleRetry : handlePayment}
      />
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
  );
}

// Wrap Component with Stripe Provider
export default function PaymentWithStripe({
  onBack,
  onPaymentSuccess,
}: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm onBack={onBack} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
}
