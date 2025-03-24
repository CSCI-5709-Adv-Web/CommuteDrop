"use client";

import type React from "react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { DeliveryFormData } from "./DeliveryFlow";

import LocationInput from "./location/LocationInput";
import WeightInput from "./weight/WeightInput";
import CarrierSelection from "./carrier/CarrierSelection";
import CalculateButton from "./buttons/CalculateButton";
import FormValidationMessage from "./validation/FormValidationMessage";
import { useLoadingState } from "../../hooks/useLoadingState";

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
  const isInitialRender = useRef(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isLoading, startLoading, stopLoading } = useLoadingState([
    "pickupSuggestions",
    "dropoffSuggestions",
    "geocoding",
  ]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      handleFormChange("pickup", "");
      handleFormChange("dropoff", "");

      if (onLocationChange) {
        onLocationChange("", "");
      }
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

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

  const handleFormChange = useCallback(
    (field: string, value: string) => {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    },
    [setFormData]
  );

  const handlePickupChange = useCallback(
    (value: string) => {
      handleFormChange("pickup", value);

      if (!value.trim()) {
        setFormData((prev) => ({
          ...prev,
          pickupCoordinates: undefined,
        }));
      }
    },
    [handleFormChange, setFormData]
  );

  const handleDropoffChange = useCallback(
    (value: string) => {
      handleFormChange("dropoff", value);

      if (!value.trim()) {
        setFormData((prev) => ({
          ...prev,
          dropoffCoordinates: undefined,
        }));
      }
    },
    [handleFormChange, setFormData]
  );

  const handlePickupCoordinatesChange = useCallback(
    (coordinates: { lat: number; lng: number } | undefined) => {
      setFormData((prev) => ({
        ...prev,
        pickupCoordinates: coordinates,
      }));

      if (onLocationChange) {
        onLocationChange(formData.pickup, formData.dropoff);
      }
    },
    [formData.pickup, formData.dropoff, onLocationChange, setFormData]
  );

  const handleDropoffCoordinatesChange = useCallback(
    (coordinates: { lat: number; lng: number } | undefined) => {
      setFormData((prev) => ({
        ...prev,
        dropoffCoordinates: coordinates,
      }));

      if (onLocationChange) {
        onLocationChange(formData.pickup, formData.dropoff);
      }
    },
    [formData.pickup, formData.dropoff, onLocationChange, setFormData]
  );

  const isFormValid = useMemo(() => {
    const hasPickupAddress = formData.pickup.trim().length > 0;
    const hasDropoffAddress = formData.dropoff.trim().length > 0;
    return hasPickupAddress && hasDropoffAddress;
  }, [formData.pickup, formData.dropoff]);

  const isLoadingData = useMemo(() => {
    return (
      isLoading("pickupSuggestions") ||
      isLoading("dropoffSuggestions") ||
      isLoading("geocoding")
    );
  }, [isLoading]);

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

      <div className="space-y-4">
        <LocationInput
          value={formData.pickup}
          onChange={handlePickupChange}
          onCoordinatesChange={handlePickupCoordinatesChange}
          placeholder="Pickup location"
          icon={<div className="w-2 h-2 bg-black rounded-full" />}
          type="pickup"
        />

        <LocationInput
          value={formData.dropoff}
          onChange={handleDropoffChange}
          onCoordinatesChange={handleDropoffCoordinatesChange}
          placeholder="Dropoff location"
          icon={<div className="w-2 h-2 border-2 border-black rounded-full" />}
          type="dropoff"
        />

        <WeightInput
          value={formData.weight}
          onChange={(value) => handleFormChange("weight", value)}
        />

        <CarrierSelection
          selectedCarrier={formData.carrier}
          onChange={(carrier) => handleFormChange("carrier", carrier)}
        />
      </div>

      <CalculateButton
        isValid={isFormValid}
        isLoading={isLoadingData}
        pickupAddress={formData.pickup}
        dropoffAddress={formData.dropoff}
        hasPickupCoordinates={!!formData.pickupCoordinates}
        hasDropoffCoordinates={!!formData.dropoffCoordinates}
        onClick={onNext}
      />

      <FormValidationMessage
        isValid={isFormValid}
        pickupAddress={formData.pickup}
        dropoffAddress={formData.dropoff}
        hasPickupCoordinates={!!formData.pickupCoordinates}
        hasDropoffCoordinates={!!formData.dropoffCoordinates}
      />
    </motion.div>
  );
}

import { Car, Truck, Bike, Package } from "lucide-react";
