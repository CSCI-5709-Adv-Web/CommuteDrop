"use client";

import { Check, Trash2 } from "lucide-react";

// Define card types with their icons and colors
const CARD_TYPES = {
  visa: {
    name: "Visa",
    icon: "VISA",
    color: "text-blue-700",
  },
  mastercard: {
    name: "Mastercard",
    icon: "MC",
    color: "text-red-600",
  },
  amex: {
    name: "American Express",
    icon: "AMEX",
    color: "text-green-700",
  },
  discover: {
    name: "Discover",
    icon: "DISC",
    color: "text-orange-600",
  },
};

interface PaymentMethodCardProps {
  method: {
    id: number;
    type: string;
    last4: string;
    cardholderName: string;
    expiryDate: string;
    isDefault: boolean;
  };
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  const cardType = CARD_TYPES[method.type as keyof typeof CARD_TYPES];

  return (
    <div
      className={`p-4 border rounded-lg flex items-center justify-between ${
        method.isDefault ? "border-black" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
          <span className={`font-bold text-sm ${cardType.color}`}>
            {cardType.icon}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {cardType.name} •••• {method.last4}
          </p>
          <p className="text-xs text-gray-500">
            {method.cardholderName} • Expires {method.expiryDate}
          </p>
          {method.isDefault && (
            <span className="text-xs text-black">Default</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="p-2 text-gray-500 hover:text-black rounded-full transition-colors"
            title="Set as default"
          >
            <Check size={16} />
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          className="p-2 text-gray-500 hover:text-red-500 rounded-full transition-colors"
          title="Delete card"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
