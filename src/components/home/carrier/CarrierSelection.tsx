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
        icon: <Car className="w-5 h-5" aria-hidden="true" />,
        label: "Car",
      },
      {
        type: "truck",
        icon: <Truck className="w-5 h-5" aria-hidden="true" />,
        label: "Truck",
      },
      {
        type: "bike",
        icon: <Bike className="w-5 h-5" aria-hidden="true" />,
        label: "Bike",
      },
      {
        type: "walk",
        icon: <Package className="w-5 h-5" aria-hidden="true" />,
        label: "Walk",
      },
    ],
    []
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 ml-1">Select carrier type:</p>
      <div className="grid grid-cols-2 gap-2">
        {carriers.map((carrier) => (
          <button
            key={carrier.type}
            onClick={() => onChange(carrier.type)}
            className={`p-3 rounded-lg flex items-center justify-center space-x-2 transition-all
            border-2 ${
              selectedCarrier === carrier.type
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 hover:border-primary/30 text-gray-800"
            }`}
            aria-pressed={selectedCarrier === carrier.type}
          >
            {carrier.icon}
            <span className="text-sm">{carrier.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
