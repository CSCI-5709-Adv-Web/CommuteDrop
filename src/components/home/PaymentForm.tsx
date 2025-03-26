"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import PaymentMethodSelector from "./payment/PaymentMethodSelector";
import CardInput from "./payment/CardInput";
import OrderSummary from "./payment/OrderSummary";
import PaymentButton from "./payment/PaymentButton";
import SuccessConfetti from "./payment/SuccessConfetti";
import { usePaymentForm } from "../../hooks/usePaymentForm";
import { cardService, type Card } from "../../services/card-service";

// Load Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_PUBLIC_STRIPE_API_KEY || ""
);

interface PaymentFormProps {
  onBack: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

function StripePaymentForm({ onBack, onPaymentSuccess }: PaymentFormProps) {
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
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
              setUseNewCard(false);
            } else {
              setSelectedCardId(response.data[0].id);
              setUseNewCard(false);
            }
          } else {
            // No cards available, use new card
            setUseNewCard(true);
            setSelectedCardId(null);
          }
        } else {
          setCardError(response.message || "Failed to load payment methods");
          // Fall back to mock data if API fails
          const mockUserData = {
            paymentMethods: [
              {
                id: "1",
                type: "visa",
                last4: "4242",
                cardholderName: "Alex Johnson",
                expiryDate: "12/25",
                isDefault: true,
              },
              {
                id: "2",
                type: "mastercard",
                last4: "5555",
                cardholderName: "Alex Johnson",
                expiryDate: "09/26",
                isDefault: false,
              },
            ],
          };
          setSavedCards(mockUserData.paymentMethods as Card[]);
          setSelectedCardId(mockUserData.paymentMethods[0].id);
        }
      } catch (error) {
        console.error("Error fetching saved cards:", error);
        setCardError("Failed to load payment methods. Using demo data.");

        // Fall back to mock data if API fails
        const mockUserData = {
          paymentMethods: [
            {
              id: "1",
              type: "visa",
              last4: "4242",
              cardholderName: "Alex Johnson",
              expiryDate: "12/25",
              isDefault: true,
            },
            {
              id: "2",
              type: "mastercard",
              last4: "5555",
              cardholderName: "Alex Johnson",
              expiryDate: "09/26",
              isDefault: false,
            },
          ],
        };
        setSavedCards(mockUserData.paymentMethods as Card[]);
        setSelectedCardId(mockUserData.paymentMethods[0].id);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchSavedCards();
  }, [setSelectedCardId, setUseNewCard]);

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
          isLoading={isLoadingCards}
        />
      )}
      {/* Stripe Card Input */}
      {(useNewCard || savedCards.length === 0) && (
        <CardInput paymentStatus={paymentStatus} />
      )}
      {/* Order Summary */}
      <OrderSummary deliveryFee="12.99" serviceFee="3.00" total="15.99" />
      {/* Pay Button */}
      <PaymentButton
        paymentStatus={paymentStatus}
        isDisabled={
          loading ||
          isLoadingCards ||
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
