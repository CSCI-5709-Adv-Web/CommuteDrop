"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PaymentMethodCard from "./PaymentMethodCard";
import AddPaymentMethodForm from "./AddPaymentMethodForm";

interface PaymentMethodsSectionProps {
  userData: {
    paymentMethods: Array<{
      id: number;
      type: string;
      last4: string;
      cardholderName: string;
      expiryDate: string;
      isDefault: boolean;
    }>;
  };
}

export default function PaymentMethodsSection({
  userData,
}: PaymentMethodsSectionProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(userData.paymentMethods);

  const handleSetDefaultCard = (id: number) => {
    const updatedPaymentMethods = paymentMethods.map((method) => ({
      ...method,
      isDefault: method.id === id,
    }));

    setPaymentMethods(updatedPaymentMethods);
  };

  const handleDeleteCard = (id: number) => {
    // Check if it's the default card
    const isDefault = paymentMethods.find(
      (method) => method.id === id
    )?.isDefault;
    let updatedPaymentMethods = paymentMethods.filter(
      (method) => method.id !== id
    );

    // If we deleted the default card and there are other cards, make the first one default
    if (isDefault && updatedPaymentMethods.length > 0) {
      updatedPaymentMethods = updatedPaymentMethods.map((method, index) => ({
        ...method,
        isDefault: index === 0,
      }));
    }

    setPaymentMethods(updatedPaymentMethods);
  };

  const handleAddCard = (newCard: any) => {
    // If this is set as default, update other cards
    const updatedPaymentMethods = paymentMethods.map((method) => ({
      ...method,
      isDefault: newCard.isDefault ? false : method.isDefault,
    }));

    setPaymentMethods([...updatedPaymentMethods, newCard]);
    setIsAddingCard(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        <button
          onClick={() => setIsAddingCard(!isAddingCard)}
          className="flex items-center text-black font-medium"
        >
          {isAddingCard ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} className="mr-1" />
              Add Card
            </>
          )}
        </button>
      </div>
      <div className="border-t border-gray-200 mb-6"></div>

      {isAddingCard && (
        <div className="mb-8">
          <AddPaymentMethodForm
            onAddCard={handleAddCard}
            onCancel={() => setIsAddingCard(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <p className="text-gray-500">
            Your payment methods will appear here.
          </p>
        ) : (
          paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={handleSetDefaultCard}
              onDelete={handleDeleteCard}
            />
          ))
        )}
      </div>

      {paymentMethods.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Billing History</h3>
          <div className="border-t border-gray-200 mb-6"></div>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Feb 25, 2025
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Delivery DEL-1234
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    $12.50
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Feb 22, 2025
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Delivery DEL-1235
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    $8.75
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
