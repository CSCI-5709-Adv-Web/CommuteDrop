"use client";

import { Check, Trash2, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

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
    id: string;
    type: string;
    last4: string;
    cardholderName: string;
    expiryDate: string;
    isDefault: boolean;
  };
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing?: boolean;
}

export default function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
  isProcessing = false,
}: PaymentMethodCardProps) {
  // Determine card type - default to visa if not recognized
  const cardTypeKey = method.type
    ? Object.keys(CARD_TYPES).includes(method.type.toLowerCase())
      ? method.type.toLowerCase()
      : "visa"
    : "visa";

  const cardType = CARD_TYPES[cardTypeKey as keyof typeof CARD_TYPES];

  // Add state to track delete button loading state
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${cardType.name} card ending in ${method.last4}?`
      )
    ) {
      setIsDeleting(true);
      try {
        await onDelete(method.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.div
      className={`p-4 border rounded-lg flex items-center justify-between ${
        method.isDefault ? "border-black" : "border-gray-200"
      }`}
      whileHover={{
        scale: 1.02,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        borderColor: method.isDefault
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(0, 0, 0, 0.2)",
        y: -3,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
        mass: 0.6,
      }}
      layout
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <span className={`font-bold text-sm ${cardType.color}`}>
            {cardType.icon}
          </span>
        </motion.div>
        <div>
          <p className="font-medium text-gray-900">
            {cardType.name} •••• {method.last4}
          </p>
          <p className="text-xs text-gray-500">
            {method.cardholderName} • Expires {method.expiryDate}
          </p>
          {method.isDefault && (
            <motion.span
              className="text-xs text-black"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              Default
            </motion.span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isProcessing || isDeleting ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Loader size={16} className="text-primary animate-spin" />
          </motion.div>
        ) : (
          <>
            {!method.isDefault && (
              <motion.button
                onClick={() => onSetDefault(method.id)}
                className="p-2 text-gray-500 hover:text-black rounded-full transition-colors"
                title="Set as default"
                disabled={isProcessing || isDeleting}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Check size={16} />
              </motion.button>
            )}
            <motion.button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-500 rounded-full transition-colors"
              title="Delete card"
              disabled={isProcessing || isDeleting}
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(239, 68, 68, 0.05)",
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 size={16} />
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
