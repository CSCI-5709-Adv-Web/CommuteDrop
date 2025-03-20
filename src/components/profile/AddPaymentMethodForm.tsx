"use client";

import type React from "react";

import { useState } from "react";

interface AddPaymentMethodFormProps {
  onAddCard: (card: any) => void;
  onCancel: () => void;
}

export default function AddPaymentMethodForm({
  onAddCard,
  onCancel,
}: AddPaymentMethodFormProps) {
  const [newCardData, setNewCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    cardType: "visa",
    isDefault: false,
  });

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

        setNewCardData({
          ...newCardData,
          cardNumber: limited,
          cardType,
        });
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
      }
      // Handle other fields normally
      else {
        setNewCardData({
          ...newCardData,
          [name]: value,
        });
      }
    }
  };

  const handleAddCard = () => {
    // Basic validation
    if (
      newCardData.cardNumber.replace(/\s/g, "").length < 15 ||
      !newCardData.cardholderName ||
      !newCardData.expiryDate ||
      !newCardData.cvv
    ) {
      alert("Please fill in all card details correctly");
      return;
    }

    // Extract last 4 digits
    const last4 = newCardData.cardNumber.replace(/\s/g, "").slice(-4);

    // Add new card
    const newCard = {
      id: Date.now(),
      type: newCardData.cardType,
      last4,
      cardholderName: newCardData.cardholderName,
      expiryDate: newCardData.expiryDate,
      isDefault: newCardData.isDefault,
    };

    onAddCard(newCard);
  };

  return (
    <div className="border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Add Payment Method</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Card Number
          </label>
          <input
            type="text"
            name="cardNumber"
            value={newCardData.cardNumber}
            onChange={handleCardInputChange}
            placeholder="1234 5678 9012 3456"
            className="w-full p-2 border border-gray-300 rounded"
            maxLength={19}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            name="cardholderName"
            value={newCardData.cardholderName}
            onChange={handleCardInputChange}
            placeholder="John Doe"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              className="w-full p-2 border border-gray-300 rounded"
              maxLength={5}
            />
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
              className="w-full p-2 border border-gray-300 rounded"
              maxLength={4}
            />
          </div>
        </div>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={newCardData.isDefault}
            onChange={handleCardInputChange}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
          />
          <label
            htmlFor="isDefault"
            className="ml-2 block text-sm text-gray-700"
          >
            Set as default payment method
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCard}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}
