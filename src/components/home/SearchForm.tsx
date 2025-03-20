"use client";

import type React from "react";

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
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { DeliveryFormData } from "./DeliveryFlow";
import { useGeocoding } from "../../hooks/useGeocoding";

interface SearchFormProps {
  formData: DeliveryFormData;
  setFormData: React.Dispatch<React.SetStateAction<DeliveryFormData>>;
  onNext: () => void;
  onLocationChange?: (pickup: string, dropoff: string) => void;
}

export default function SearchForm({
  formData,
  setFormData,
  onNext,
  onLocationChange,
}: SearchFormProps) {
  const [activeButton, setActiveButton] = useState<"send" | "receive">("send");
  const isInitialRender = useRef(true);

  // Use our new geocoding hooks
  const pickupGeocoding = useGeocoding({ initialAddress: formData.pickup });
  const dropoffGeocoding = useGeocoding({ initialAddress: formData.dropoff });

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

  // Handle pickup address changes
  const handlePickupChange = useCallback(
    (value: string) => {
      pickupGeocoding.setAddress(value);
      handleFormChange("pickup", value);

      // Clear the "Could not find coordinates" error when user starts typing again
      if (document.querySelector(".text-red-500")) {
        document.querySelector(".text-red-500")?.remove();
      }
    },
    [pickupGeocoding, handleFormChange]
  );

  // Handle dropoff address changes
  const handleDropoffChange = useCallback(
    (value: string) => {
      dropoffGeocoding.setAddress(value);
      handleFormChange("dropoff", value);

      // Clear any error messages when user starts typing again
      if (document.querySelector(".text-red-500")) {
        document.querySelector(".text-red-500")?.remove();
      }
    },
    [dropoffGeocoding, handleFormChange]
  );

  // Update location coordinates when geocoding completes
  useEffect(() => {
    // Only update coordinates if they exist and have changed
    if (pickupGeocoding.coordinates && dropoffGeocoding.coordinates) {
      // Extract coordinates from geocoding results
      const pickupCoords = pickupGeocoding.coordinates;
      const dropoffCoords = dropoffGeocoding.coordinates;

      // Check if coordinates have actually changed before updating state
      const pickupCoordsChanged =
        formData.pickupCoordinates?.lat !== pickupCoords.lat ||
        formData.pickupCoordinates?.lng !== pickupCoords.lng;

      const dropoffCoordsChanged =
        formData.dropoffCoordinates?.lat !== dropoffCoords.lat ||
        formData.dropoffCoordinates?.lng !== dropoffCoords.lng;

      // Only update state if coordinates have changed
      if (pickupCoordsChanged || dropoffCoordsChanged) {
        setFormData((prev) => ({
          ...prev,
          pickupCoordinates: pickupCoords,
          dropoffCoordinates: dropoffCoords,
        }));

        // Only notify parent if coordinates have changed
        if (onLocationChange) {
          onLocationChange(pickupGeocoding.address, dropoffGeocoding.address);
        }
      }
    }
  }, [
    pickupGeocoding.coordinates,
    dropoffGeocoding.coordinates,
    formData.pickupCoordinates,
    formData.dropoffCoordinates,
    onLocationChange,
    pickupGeocoding.address,
    pickupGeocoding.address,
  ]);

  // Geocode pickup when the user stops typing (debounce)
  useEffect(() => {
    // Skip geocoding if address is too short
    if (!formData.pickup || formData.pickup.length <= 3) return;

    const pickupTimer = setTimeout(() => {
      pickupGeocoding.geocode();
    }, 1000);

    return () => clearTimeout(pickupTimer);
  }, [formData.pickup, pickupGeocoding]);

  // Geocode dropoff when the user stops typing (debounce)
  useEffect(() => {
    // Skip geocoding if address is too short
    if (!formData.dropoff || formData.dropoff.length <= 3) return;

    const dropoffTimer = setTimeout(() => {
      dropoffGeocoding.geocode();
    }, 1000);

    return () => clearTimeout(dropoffTimer);
  }, [formData.dropoff, dropoffGeocoding]);

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
            value={pickupGeocoding.address}
            onChange={(e) => handlePickupChange(e.target.value)}
            placeholder="Pickup location"
            aria-label="Pickup location"
          />
          {pickupGeocoding.isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader
                className="w-4 h-4 text-gray-400 animate-spin"
                aria-hidden="true"
              />
            </div>
          )}
          {pickupGeocoding.error && (
            <p className="text-xs text-red-500 mt-1">{pickupGeocoding.error}</p>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 border-2 border-black rounded-full" />
          <input
            className="w-full p-4 pl-8 pr-10 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={dropoffGeocoding.address}
            onChange={(e) => handleDropoffChange(e.target.value)}
            placeholder="Dropoff location"
            aria-label="Dropoff location"
          />
          {dropoffGeocoding.isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader
                className="w-4 h-4 text-gray-400 animate-spin"
                aria-hidden="true"
              />
            </div>
          )}
          {dropoffGeocoding.error && (
            <p className="text-xs text-red-500 mt-1">
              {dropoffGeocoding.error}
            </p>
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
        disabled={
          !formData.pickup ||
          !formData.dropoff ||
          pickupGeocoding.isLoading ||
          dropoffGeocoding.isLoading
        }
      >
        Calculate Delivery
        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
