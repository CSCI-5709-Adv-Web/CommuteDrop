"use client";

import type React from "react";
import { useState } from "react";
import { Loader } from "lucide-react";
import { motion } from "framer-motion";

interface AddPaymentMethodFormProps {
  onAddCard: (card: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function AddPaymentMethodForm({
  onAddCard,
  onCancel,
  isSubmitting = false,
}: AddPaymentMethodFormProps) {
  const [newCardData, setNewCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    cardType: "visa",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCardInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setNewCardData({
        ...newCardData,
        [name]: checked,
      });
    } else {
      // Format card number with spaces
      if (name === "cardNumber") {
        // Remove non-digits
        const digitsOnly = value.replace(/\D/g, "");
        // Add spaces every 4 digits
        const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ");
        // Limit to 19 characters (16 digits + 3 spaces)
        const limited = formatted.slice(0, 19);

        // Detect card type based on first digits
        let cardType = "visa";
        if (/^4/.test(digitsOnly)) cardType = "visa";
        else if (/^5[1-5]/.test(digitsOnly)) cardType = "mastercard";
        else if (/^3[47]/.test(digitsOnly)) cardType = "amex";
        else if (/^6(?:011|5)/.test(digitsOnly)) cardType = "discover";
        else if (/^35/.test(digitsOnly)) cardType = "jcb";
        else if (/^3(?:0[0-5]|[68])/.test(digitsOnly)) cardType = "diners";
        else if (/^62/.test(digitsOnly)) cardType = "unionpay";

        setNewCardData({
          ...newCardData,
          cardNumber: limited,
          cardType,
        });

        // Clear error when user types
        if (errors.cardNumber) {
          setErrors({
            ...errors,
            cardNumber: "",
          });
        }
      }
      // Format expiry date
      else if (name === "expiryDate") {
        const digitsOnly = value.replace(/\D/g, "");
        let formatted = digitsOnly;

        if (digitsOnly.length > 2) {
          formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}`;
        }

        setNewCardData({
          ...newCardData,
          [name]: formatted,
        });

        // Clear error when user types
        if (errors.expiryDate) {
          setErrors({
            ...errors,
            expiryDate: "",
          });
        }
      }
      // Handle other fields normally
      else {
        setNewCardData({
          ...newCardData,
          [name]: value,
        });

        // Clear error when user types
        if (errors[name]) {
          setErrors({
            ...errors,
            [name]: "",
          });
        }
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate card number
    const cardNumberDigits = newCardData.cardNumber.replace(/\s/g, "");
    if (!cardNumberDigits) {
      newErrors.cardNumber = "Card number is required";
    } else if (cardNumberDigits.length < 15 || cardNumberDigits.length > 16) {
      newErrors.cardNumber = "Card number must be 15-16 digits";
    }

    // Validate cardholder name
    if (!newCardData.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    // Validate expiry date
    if (!newCardData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const [month, year] = newCardData.expiryDate.split("/");
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
      const currentMonth = new Date().getMonth() + 1; // 1-12

      if (!month || !year || month.length !== 2 || year.length !== 2) {
        newErrors.expiryDate = "Invalid format (MM/YY)";
      } else if (Number.parseInt(month) < 1 || Number.parseInt(month) > 12) {
        newErrors.expiryDate = "Month must be between 01-12";
      } else if (
        Number.parseInt(year) < currentYear ||
        (Number.parseInt(year) === currentYear &&
          Number.parseInt(month) < currentMonth)
      ) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    // Validate CVV
    if (!newCardData.cvv) {
      newErrors.cvv = "CVV is required";
    } else if (newCardData.cvv.length < 3 || newCardData.cvv.length > 4) {
      newErrors.cvv = "CVV must be 3-4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCard = () => {
    if (!validateForm()) {
      return;
    }

    // Extract last 4 digits
    const last4 = newCardData.cardNumber.replace(/\s/g, "").slice(-4);

    // Add new card
    const newCard = {
      cardNumber: newCardData.cardNumber.replace(/\s/g, ""),
      cardholderName: newCardData.cardholderName,
      expiryDate: newCardData.expiryDate,
      cvv: newCardData.cvv,
      type: newCardData.cardType,
      last4,
      isDefault: newCardData.isDefault,
    };

    onAddCard(newCard);
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      className="border rounded-lg p-6 mb-6"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 className="text-lg font-medium mb-4" variants={itemVariants}>
        Add Payment Method
      </motion.h3>
      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Card Number
          </label>
          <input
            type="text"
            name="cardNumber"
            value={newCardData.cardNumber}
            onChange={handleCardInputChange}
            placeholder="1234 5678 9012 3456"
            className={`w-full p-2 border ${
              errors.cardNumber ? "border-red-500" : "border-gray-300"
            } rounded`}
            maxLength={19}
            disabled={isSubmitting}
          />
          {errors.cardNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            name="cardholderName"
            value={newCardData.cardholderName}
            onChange={handleCardInputChange}
            placeholder="John Doe"
            className={`w-full p-2 border ${
              errors.cardholderName ? "border-red-500" : "border-gray-300"
            } rounded`}
            disabled={isSubmitting}
          />
          {errors.cardholderName && (
            <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
          )}
        </motion.div>

        <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Expiry Date
            </label>
            <input
              type="text"
              name="expiryDate"
              value={newCardData.expiryDate}
              onChange={handleCardInputChange}
              placeholder="MM/YY"
              className={`w-full p-2 border ${
                errors.expiryDate ? "border-red-500" : "border-gray-300"
              } rounded`}
              maxLength={5}
              disabled={isSubmitting}
            />
            {errors.expiryDate && (
              <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              CVV
            </label>
            <input
              type="text"
              name="cvv"
              value={newCardData.cvv}
              onChange={handleCardInputChange}
              placeholder="123"
              className={`w-full p-2 border ${
                errors.cvv ? "border-red-500" : "border-gray-300"
              } rounded`}
              maxLength={4}
              disabled={isSubmitting}
            />
            {errors.cvv && (
              <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
            )}
          </div>
        </motion.div>

        <motion.div className="flex items-center mt-2" variants={itemVariants}>
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={newCardData.isDefault}
            onChange={handleCardInputChange}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label
            htmlFor="isDefault"
            className="ml-2 block text-sm text-gray-700"
          >
            Set as default payment method
          </label>
        </motion.div>

        <motion.div
          className="flex justify-end gap-3 pt-4"
          variants={itemVariants}
        >
          <motion.button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
            type="button"
            whileHover={{ scale: 1.03, backgroundColor: "rgba(0, 0, 0, 0.02)" }}
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleAddCard}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
            type="button"
            whileHover={{ scale: 1.03, backgroundColor: "#333" }}
            whileTap={{ scale: 0.97 }}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Adding...
              </>
            ) : (
              "Add Card"
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
