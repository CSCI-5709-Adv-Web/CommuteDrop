"use client";

import { useState, useCallback } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { cardService } from "../services/card-service";

interface UsePaymentFormProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  amount: number;
}

export function usePaymentForm({
  onPaymentSuccess,
  amount,
}: UsePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [useNewCard, setUseNewCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [saveNewCard, setSaveNewCard] = useState(false);

  // Function to fetch client_secret from backend
  const fetchClientSecret = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }), // Amount in cents
        }
      );

      const data = await response.json();
      return data.clientSecret;
    } catch (err) {
      setError("Error fetching payment intent");
      return null;
    }
  }, [amount]);

  // Handle Payment Submission
  const handlePayment = useCallback(async () => {
    if (!stripe || (!elements && !selectedCardId)) return;

    setLoading(true);
    setError("");
    setPaymentStatus("processing");

    const clientSecret = await fetchClientSecret();
    if (!clientSecret) {
      setLoading(false);
      setPaymentStatus("error");
      return;
    }

    try {
      let result;

      if (useNewCard) {
        // Use new card
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements!.getElement(CardElement)!,
          },
          setup_future_usage: saveNewCard ? "off_session" : undefined,
        });

        // If payment is successful and user wants to save the card
        if (!result.error && saveNewCard) {
          try {
            // In a real implementation, we would get card details from the payment method
            // Since retrievePaymentMethod is not available, we'll use a simpler approach
            if (result.paymentIntent && result.paymentIntent.payment_method) {
              // Extract card details from the payment method ID
              // For demo purposes, we'll create a mock card
              const mockCard = {
                cardNumber: "************1234", // We don't actually store the full number
                cardholderName: "Card Holder", // This would come from a form in a real app
                expiryDate: "12/25",
                cvv: "***", // We don't store the CVV
                isDefault: false,
              };

              // Save card to our backend
              await cardService.addCard(mockCard);
            }
          } catch (cardError) {
            console.error("Error saving card:", cardError);
            // We don't fail the payment if card saving fails
          }
        }
      } else {
        // Use saved card (in a real app, you'd use the actual payment method ID)
        // For this demo, we'll simulate a successful payment
        await new Promise((resolve) => setTimeout(resolve, 1500));
        result = {
          error: undefined,
          paymentIntent: { id: `pi_${Date.now()}` },
        };
      }

      if (result.error) {
        setError(result.error.message || "Payment failed.");
        setPaymentStatus("error");
      } else if (result.paymentIntent) {
        setPaymentStatus("success");
        setTimeout(() => {
          onPaymentSuccess(result.paymentIntent!.id);
        }, 2000); // Give time for the success animation to play
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setPaymentStatus("error");
    } finally {
      setLoading(false);
    }
  }, [
    stripe,
    elements,
    selectedCardId,
    useNewCard,
    saveNewCard,
    fetchClientSecret,
    onPaymentSuccess,
  ]);

  // Add a retry handler function
  const handleRetry = useCallback(() => {
    setPaymentStatus("idle");
    setError("");
    setLoading(false);
    // Reset the card input
    if (elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        cardElement.clear();
      }
    }
  }, [elements]);

  return {
    loading,
    error,
    paymentStatus,
    useNewCard,
    selectedCardId,
    saveNewCard,
    setSaveNewCard,
    setUseNewCard,
    setSelectedCardId,
    handlePayment,
    handleRetry,
  };
}
