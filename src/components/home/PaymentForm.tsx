"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { useOrder } from "../../context/OrderContext";
import PaymentMethodSelector from "./payment/PaymentMethodSelector";
import OrderSummary from "./payment/OrderSummary";
import PaymentButton from "./payment/PaymentButton";
import SuccessConfetti from "./payment/SuccessConfetti";
import { cardService, type Card } from "../../services/card-service";
import { Loader } from "lucide-react";

// Load Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_PUBLIC_STRIPE_API_KEY || ""
);

// Update the PaymentForm interface to be more explicit about types
interface PaymentFormProps {
  onBack: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  orderId?: string;
  amount?: number | null; // in cents
}

// Update the PaymentForm component to handle back navigation properly
export default function PaymentWithStripe(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}

// Update the header and layout to match the confirm delivery page
function StripePaymentForm({ onBack, onPaymentSuccess }: PaymentFormProps) {
  const {
    orderId,
    paymentAmount,
    estimatedPrice,
    paymentStatus,
    error: orderError,
    processPayment,
    status,
    orderData,
  } = useOrder();

  const stripe = useStripe();
  const elements = useElements();
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
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
    // Add this line to debug the card data
    console.log("Saved cards data:", savedCards);
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
    setError(null);

    try {
      const success = await processPayment(selectedCardId);

      if (success) {
        // Wait a moment to show the success animation
        setTimeout(() => {
          onPaymentSuccess("payment_success");
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Payment processing failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle retry after error
  const handleRetry = () => {
    setError(null);
  };

  // Get pricing details from order data
  const pricingDetails = orderData?.pricing_details;

  // Format the amount for display - use actual amount from context or default
  const displayAmount = paymentAmount
    ? (paymentAmount / 100).toFixed(2)
    : estimatedPrice
    ? estimatedPrice.toFixed(2)
    : pricingDetails?.total_cost?.toFixed(2) || "65.22";

  // Calculate fee breakdowns based on total if pricing details aren't available
  const totalValue = Number.parseFloat(displayAmount);
  const deliveryFee =
    pricingDetails?.cost?.toFixed(2) || (totalValue * 0.8125).toFixed(2);
  const serviceFee =
    pricingDetails?.tax?.toFixed(2) || (totalValue * 0.1875).toFixed(2);

  // Add a custom back handler that preserves state
  const handleBack = () => {
    // Don't reset any state, just navigate back
    onBack();
  };

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-white"
    >
      <AnimatePresence>
        {paymentStatus === "success" && <SuccessConfetti />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center p-4">
        <button
          onClick={handleBack}
          className="mr-4"
          disabled={
            loading ||
            paymentStatus === "processing" ||
            paymentStatus === "success"
          }
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold">Payment</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center">
          <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-sm text-gray-700">Secure payment processing</p>
        </div>

        {/* Display order ID if available */}
        {orderId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Order ID:</span> {orderId}
            </p>
          </div>
        )}

        {/* Error Messages */}
        {(error || cardError || orderError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-xs text-red-600">
                {error || cardError || orderError}
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold mb-3">Payment Method</h3>

          {isLoadingCards ? (
            <div className="py-4 flex justify-center items-center">
              <Loader className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : savedCards &&
            savedCards.length > 0 &&
            paymentStatus === "idle" ? (
            <PaymentMethodSelector
              savedCards={savedCards || []}
              selectedCardId={selectedCardId}
              onSelectCard={setSelectedCardId}
              isLoading={false}
            />
          ) : (
            !cardError && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  No payment methods available.
                </p>
                <button
                  onClick={() => fetchSavedCards()}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Retry
                </button>
              </div>
            )
          )}
        </div>

        {/* Pass pricing details to OrderSummary */}
        <OrderSummary
          deliveryFee={deliveryFee}
          serviceFee={serviceFee}
          total={displayAmount}
          pricingDetails={orderData?.pricing_details}
        />

        <AnimatePresence>
          {paymentStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-sm text-green-600"
            >
              Payment successful! Redirecting to confirmation...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed payment button at bottom */}
      <div className="p-4 border-t">
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
          orderId={orderId || undefined}
        />
      </div>
    </motion.div>
  );
}
