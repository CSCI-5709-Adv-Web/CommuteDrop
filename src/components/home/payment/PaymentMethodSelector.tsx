"use client";

import { CreditCard } from "lucide-react";

// Define card types with their icons and colors
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
  selectedCardId: number | null;
  useNewCard: boolean;
  onSelectCard: (cardId: number) => void;
  onSelectNewCard: () => void;
}

export default function PaymentMethodSelector({
  savedCards,
  selectedCardId,
  useNewCard,
  onSelectCard,
  onSelectNewCard,
}: PaymentMethodSelectorProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Payment Method</h3>

      {/* Saved Cards */}
      <div className="space-y-3 mb-4">
        {savedCards.map((card) => {
          const cardType = CARD_TYPES[card.type as keyof typeof CARD_TYPES];
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

      {/* New Card Option */}
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
