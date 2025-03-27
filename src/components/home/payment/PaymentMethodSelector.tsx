"use client";

import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { cardService, type Card } from "../../../services/card-service";

const CARD_TYPES = {
  visa: {
    name: "Visa",
    icon: "VISA",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  mastercard: {
    name: "Mastercard",
    icon: "MC",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  amex: {
    name: "American Express",
    icon: "AMEX",
    color: "text-green-700",
    bg: "bg-green-50",
  },
  discover: {
    name: "Discover",
    icon: "DISC",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

interface PaymentMethodSelectorProps {
  savedCards: any[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  isLoading?: boolean;
  useNewCard?: boolean;
  onSelectNewCard?: () => void;
}

export default function PaymentMethodSelector({
  savedCards: initialSavedCards,
  selectedCardId,
  onSelectCard,
  isLoading = false,
  useNewCard = false,
  onSelectNewCard = () => {},
}: PaymentMethodSelectorProps) {
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  // Fix the initial loading state to be false if we have cards
  const [loading, setLoading] = useState(
    initialSavedCards.length > 0 ? false : true
  );
  const [error, setError] = useState<string | null>(null);

  // Update the useEffect hook to properly handle undefined savedCards
  useEffect(() => {
    // Make sure initialSavedCards is an array before checking its length
    const cards = Array.isArray(initialSavedCards) ? initialSavedCards : [];

    // If we already have cards from props, use them and stop loading
    if (cards.length > 0) {
      setSavedCards(cards);
      setLoading(false);

      // Select a default card if none is selected
      if (!selectedCardId) {
        const defaultCard = cards.find((card) => card.isDefault);
        if (defaultCard) {
          onSelectCard(defaultCard.id);
        } else {
          onSelectCard(cards[0].id);
        }
      }
      return;
    }

    // Only fetch cards if we don't have any and we're not already loading
    if (cards.length === 0 && !loading) {
      const fetchCards = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await cardService.getUserCards();
          if (response.success) {
            setSavedCards(response.data || []);
            if (response.data && response.data.length > 0 && !selectedCardId) {
              const defaultCard = response.data.find((card) => card.isDefault);
              if (defaultCard) {
                onSelectCard(defaultCard.id);
              } else {
                onSelectCard(response.data[0].id);
              }
            }
          } else {
            setError(response.message || "Failed to load payment methods");
          }
        } catch (err) {
          setError(
            "An unexpected error occurred while loading payment methods"
          );
          console.error("Error fetching cards:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCards();
    }
  }, [initialSavedCards, selectedCardId, onSelectCard, loading]);
  if (loading || isLoading) {
    return (
      <div className="mb-6 flex justify-center items-center py-8">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Payment Method</h3>
      <div className="space-y-3 mb-4">
        {savedCards.map((card) => {
          const cardTypeKey =
            card.type &&
            typeof card.type === "string" &&
            Object.keys(CARD_TYPES).includes(card.type.toLowerCase())
              ? card.type.toLowerCase()
              : "visa";
          const cardType = CARD_TYPES[cardTypeKey as keyof typeof CARD_TYPES];
          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card.id)}
              className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                selectedCardId === card.id
                  ? `border-primary ${cardType.bg} shadow-md`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-8 bg-gray-200 rounded flex items-center justify-center`}
                >
                  <span className={`font-bold text-sm ${cardType.color}`}>
                    {cardType.icon}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {cardType.name} •••• {card.last4}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires {card.expiryDate}
                  </p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                {selectedCardId === card.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
