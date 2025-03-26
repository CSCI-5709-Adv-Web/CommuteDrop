"use client";

import { useMemo } from "react";
import { Car, Truck, Bike, Package } from "lucide-react";

interface CarrierSelectionProps {
  selectedCarrier: string;
  onChange: (carrier: string) => void;
}

export default function CarrierSelection({
  selectedCarrier,
  onChange,
}: CarrierSelectionProps) {
  const carriers = useMemo(
    () => [
      {
        type: "car",
        icon: <Car className="w-5 h-5 text-blue-500" />,
        label: "Car",
        bgColor: "bg-blue-50",
      },
      {
        type: "truck",
        icon: <Truck className="w-5 h-5 text-green-500" />,
        label: "Truck",
        bgColor: "bg-green-50",
      },
      {
        type: "bike",
        icon: <Bike className="w-5 h-5 text-purple-500" />,
        label: "Bike",
        bgColor: "bg-purple-50",
      },
      {
        type: "walk",
        icon: <Package className="w-5 h-5 text-orange-500" />,
        label: "Walk",
        bgColor: "bg-orange-50",
      },
    ],
    []
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 ml-1">Select carrier type:</p>
      <div className="grid grid-cols-2 gap-2">
        {carriers.map((carrier) => {
          const isSelected = selectedCarrier === carrier.type;
          return (
            <button
              key={carrier.type}
              onClick={() => onChange(carrier.type)}
              className={`p-3 rounded-lg flex items-center justify-center space-x-2 transition-all
              border-2 ${
                isSelected
                  ? `border-primary ${carrier.bgColor} text-primary`
                  : "border-gray-200 hover:border-primary/30 text-gray-800"
              }`}
              aria-pressed={isSelected}
            >
              <div
                className={`p-1 rounded-full ${
                  isSelected ? carrier.bgColor : "bg-gray-50"
                }`}
              >
                {carrier.icon}
              </div>
              <span className="text-sm">{carrier.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
