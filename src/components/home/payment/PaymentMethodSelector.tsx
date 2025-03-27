"use client";

import { CreditCard, Loader } from "lucide-react";
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
  useNewCard: boolean;
  onSelectCard: (cardId: string) => void;
  onSelectNewCard: () => void;
  isLoading?: boolean;
}

export default function PaymentMethodSelector({
  savedCards: initialSavedCards,
  selectedCardId,
  useNewCard,
  onSelectCard,
  onSelectNewCard,
  isLoading = false,
}: PaymentMethodSelectorProps) {
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await cardService.getUserCards();
        if (response.success) {
          setSavedCards(response.data);
          if (response.data.length > 0 && !selectedCardId && !useNewCard) {
            const defaultCard = response.data.find((card) => card.isDefault);
            if (defaultCard) {
              onSelectCard(defaultCard.id);
            } else {
              onSelectCard(response.data[0].id);
            }
          }
        } else {
          setError(response.message || "Failed to load payment methods");
          if (initialSavedCards.length > 0) {
            setSavedCards(initialSavedCards);
          }
        }
      } catch (err) {
        setError("An unexpected error occurred while loading payment methods");
        console.error("Error fetching cards:", err);
        if (initialSavedCards.length > 0) {
          setSavedCards(initialSavedCards);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [initialSavedCards, onSelectCard, selectedCardId, useNewCard]);
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
          const cardTypeKey = Object.keys(CARD_TYPES).includes(
            card.type.toLowerCase()
          )
            ? card.type.toLowerCase()
            : "visa";
          const cardType = CARD_TYPES[cardTypeKey as keyof typeof CARD_TYPES];
          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card.id)}
              className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                selectedCardId === card.id && !useNewCard
                  ? `border-primary ${cardType.bg}`
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
                {selectedCardId === card.id && !useNewCard && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div
        onClick={onSelectNewCard}
        className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
          useNewCard
            ? "border-primary bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">Use a new card</p>
          </div>
        </div>
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
          {useNewCard && <div className="w-3 h-3 rounded-full bg-primary" />}
        </div>
      </div>
    </div>
  );
}
