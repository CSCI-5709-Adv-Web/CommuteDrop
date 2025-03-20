"use client";

import { motion } from "framer-motion";
import {
  Send,
  Inbox,
  Car,
  Truck,
  Bike,
  Package,
  ArrowRight,
  Loader,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { DeliveryFormData } from "./DeliveryFlow";

interface SearchFormProps {
  formData: DeliveryFormData;
  setFormData: React.Dispatch<React.SetStateAction<DeliveryFormData>>;
  onNext: () => void;
  onLocationChange?: (pickup: string, dropoff: string) => void;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

// Mock geocoding function - in a real app, this would use Google's Geocoding API
const geocodeAddress = async (
  address: string
): Promise<GeocodingResult | null> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock geocoding results for Halifax area
  const mockLocations: Record<string, GeocodingResult> = {
    "quinpool tower": { lat: 44.6454, lng: -63.5918 },
    "dalhousie dentistry faculty practice": { lat: 44.6366, lng: -63.585 },
    "halifax shopping centre": { lat: 44.6497, lng: -63.6108 },
    "halifax central library": { lat: 44.6434, lng: -63.5775 },
    "point pleasant park": { lat: 44.6228, lng: -63.5686 },
    "halifax citadel": { lat: 44.6478, lng: -63.5804 },
    "halifax waterfront": { lat: 44.6476, lng: -63.5683 },
    dartmouth: { lat: 44.6658, lng: -63.5669 },
    bedford: { lat: 44.7325, lng: -63.6556 },
    "downtown halifax": { lat: 44.6488, lng: -63.5752 },
    "south end": { lat: 44.6328, lng: -63.5714 },
    "north end": { lat: 44.6608, lng: -63.5908 },
    fairview: { lat: 44.6608, lng: -63.6328 },
    // Default fallback for unknown locations - random point in Halifax
    default: {
      lat: 44.6488 + (Math.random() * 0.02 - 0.01),
      lng: -63.5752 + (Math.random() * 0.02 - 0.01),
    },
  };

  // Normalize the address for lookup
  const normalizedAddress = address.toLowerCase().trim();

  // Find a matching location or return a point near the default
  for (const [key, location] of Object.entries(mockLocations)) {
    if (normalizedAddress.includes(key)) {
      return location;
    }
  }

  // Return default with slight randomization if no match
  return mockLocations.default;
};

export default function SearchForm({
  formData,
  setFormData,
  onNext,
  onLocationChange,
}: SearchFormProps) {
  const [activeButton, setActiveButton] = useState<"send" | "receive">("send");
  const [isGeocodingPickup, setIsGeocodingPickup] = useState(false);
  const [isGeocodingDropoff, setIsGeocodingDropoff] = useState(false);

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

  // Handle form field updates
  const handleFormChange = useCallback(
    (field: string, value: string) => {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    },
    [setFormData]
  );

  // Handle location changes with debounce
  useEffect(() => {
    // Only proceed if both pickup and dropoff have values
    if (!formData.pickup || !formData.dropoff) return;

    // Set a single debounce timer for both fields
    const timer = setTimeout(async () => {
      if (onLocationChange) {
        onLocationChange(formData.pickup, formData.dropoff);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [formData.pickup, formData.dropoff, onLocationChange]);

  // Add loading indicators separately
  useEffect(() => {
    if (formData.pickup) {
      setIsGeocodingPickup(true);
      const timer = setTimeout(() => {
        setIsGeocodingPickup(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.pickup]);

  useEffect(() => {
    if (formData.dropoff) {
      setIsGeocodingDropoff(true);
      const timer = setTimeout(() => {
        setIsGeocodingDropoff(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.dropoff]);

  return (
    <motion.div
      key="search"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <h2 className="text-[32px] font-bold text-gray-800 mb-4">
        Deliver a package
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Have a courier deliver something for you. Get packages delivered in the
        time it takes to drive there.
      </p>

      <div className="mb-6 flex p-2 bg-gray-100 rounded-lg">
        <button
          className={`flex-1 py-3 text-center rounded-md transition-colors flex items-center justify-center ${
            activeButton === "send"
              ? "bg-white shadow-sm text-primary"
              : "text-gray-600"
          }`}
          onClick={() => setActiveButton("send")}
          aria-pressed={activeButton === "send"}
        >
          <Send className="w-4 h-4 mr-2" aria-hidden="true" />
          Send
        </button>
        <button
          className={`flex-1 py-3 text-center rounded-md transition-colors flex items-center justify-center ${
            activeButton === "receive"
              ? "bg-white shadow-sm text-primary"
              : "text-gray-600"
          }`}
          onClick={() => setActiveButton("receive")}
          aria-pressed={activeButton === "receive"}
        >
          <Inbox className="w-4 h-4 mr-2" aria-hidden="true" />
          Receive
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full" />
          <input
            className="w-full p-4 pl-8 pr-10 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.pickup}
            onChange={(e) => handleFormChange("pickup", e.target.value)}
            placeholder="Pickup location"
            aria-label="Pickup location"
          />
          {isGeocodingPickup && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader
                className="w-4 h-4 text-gray-400 animate-spin"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 border-2 border-black rounded-full" />
          <input
            className="w-full p-4 pl-8 pr-10 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.dropoff}
            onChange={(e) => handleFormChange("dropoff", e.target.value)}
            placeholder="Dropoff location"
            aria-label="Dropoff location"
          />
          {isGeocodingDropoff && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader
                className="w-4 h-4 text-gray-400 animate-spin"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        <div className="relative">
          <input
            type="number"
            className="w-full p-4 pr-12 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.weight}
            onChange={(e) => handleFormChange("weight", e.target.value)}
            placeholder="Item weight"
            aria-label="Item weight in kilograms"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            kg
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 ml-1">Select carrier type:</p>
          <div className="grid grid-cols-2 gap-2">
            {carriers.map((carrier) => (
              <button
                key={carrier.type}
                onClick={() => handleFormChange("carrier", carrier.type)}
                className={`p-3 rounded-lg flex items-center justify-center space-x-2 transition-all
                border-2 ${
                  formData.carrier === carrier.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 hover:border-primary/30 text-gray-800"
                }`}
                aria-pressed={formData.carrier === carrier.type}
              >
                {carrier.icon}
                <span className="text-sm">{carrier.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="w-full bg-black text-white py-4 rounded-lg mt-6 text-sm font-medium hover:bg-gray-900 transition-colors flex items-center justify-center"
        onClick={onNext}
      >
        Calculate Delivery
        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
