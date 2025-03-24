"use client";

interface OrderSummaryProps {
  deliveryFee: string;
  serviceFee: string;
  total: string;
}

export default function OrderSummary({
  deliveryFee,
  serviceFee,
  total,
}: OrderSummaryProps) {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Delivery Fee</span>
          <span>${deliveryFee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Service Fee</span>
          <span>${serviceFee}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
          <span className="font-medium">Total</span>
          <span className="font-medium">${total}</span>
        </div>
      </div>
    </div>
  );
}
