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
  MapPin,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { DeliveryFormData } from "./DeliveryFlow";
import { useGeocoding } from "../../hooks/useGeocoding";
import { mapService } from "../../services/map-service";

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
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState({
    pickup: false,
    dropoff: false,
  });
  const suggestionsTimerRef = useRef<{
    pickup: NodeJS.Timeout | null;
    dropoff: NodeJS.Timeout | null;
  }>({
    pickup: null,
    dropoff: null,
  });

  // Use our geocoding hooks with empty initial addresses and longer debounce
  const pickupGeocoding = useGeocoding({ debounceMs: 1000 });
  const dropoffGeocoding = useGeocoding({ debounceMs: 1000 });

  // Initialize form data with empty values on first render
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;

      // Clear the initial values
      handleFormChange("pickup", "");
      handleFormChange("dropoff", "");

      // Update the geocoding hooks
      pickupGeocoding.setAddress("");
      dropoffGeocoding.setAddress("");

      // Notify parent component
      if (onLocationChange) {
        onLocationChange("", "");
      }
    }

    // Cleanup function to clear any pending timers
    return () => {
      if (suggestionsTimerRef.current.pickup) {
        clearTimeout(suggestionsTimerRef.current.pickup);
      }
      if (suggestionsTimerRef.current.dropoff) {
        clearTimeout(suggestionsTimerRef.current.dropoff);
      }
    };
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

  // Debounced function to fetch address suggestions
  const fetchSuggestions = useCallback(
    async (text: string, type: "pickup" | "dropoff") => {
      if (!text.trim()) return;

      // Clear any existing timer
      if (suggestionsTimerRef.current[type]) {
        clearTimeout(suggestionsTimerRef.current[type]);
      }

      // Set a new timer with 300ms delay
      suggestionsTimerRef.current[type] = setTimeout(async () => {
        try {
          setIsFetchingSuggestions((prev) => ({ ...prev, [type]: true }));
          const suggestions = await mapService.getAddressSuggestions(text);

          // Log the suggestions to debug
          console.log(`${type} suggestions:`, suggestions);

          // Transform the suggestions if needed to match expected format
          const formattedSuggestions = Array.isArray(suggestions)
            ? suggestions.map((suggestion) => ({
                placeId: suggestion.placeId || "",
                description: suggestion.description || suggestion.text || "",
                mainText:
                  suggestion.mainText ||
                  suggestion.text ||
                  suggestion.description ||
                  "",
                secondaryText: suggestion.secondaryText || "",
              }))
            : [];

          if (type === "pickup") {
            setPickupSuggestions(formattedSuggestions);
          } else {
            setDropoffSuggestions(formattedSuggestions);
          }
        } catch (error) {
          console.error(`Error fetching ${type} suggestions:`, error);
        } finally {
          setIsFetchingSuggestions((prev) => ({ ...prev, [type]: false }));
        }
      }, 300);
    },
    []
  );

  // Handle pickup address changes
  const handlePickupChange = useCallback(
    (value: string) => {
      pickupGeocoding.setAddress(value);
      handleFormChange("pickup", value);

      // Show suggestions if there's text
      if (value.trim()) {
        setShowPickupSuggestions(true);
        // Fetch suggestions for every word
        fetchSuggestions(value, "pickup");
      } else {
        setShowPickupSuggestions(false);
        setPickupSuggestions([]);
      }
    },
    [pickupGeocoding, handleFormChange, fetchSuggestions]
  );

  // Handle dropoff address changes
  const handleDropoffChange = useCallback(
    (value: string) => {
      dropoffGeocoding.setAddress(value);
      handleFormChange("dropoff", value);

      // Show suggestions if there's text
      if (value.trim()) {
        setShowDropoffSuggestions(true);
        // Fetch suggestions for every word
        fetchSuggestions(value, "dropoff");
      } else {
        setShowDropoffSuggestions(false);
        setDropoffSuggestions([]);
      }
    },
    [dropoffGeocoding, handleFormChange, fetchSuggestions]
  );

  // Update the handlePickupSuggestionSelect and handleDropoffSuggestionSelect functions
  // to properly handle loading states

  // Handle suggestion selection for pickup
  const handlePickupSuggestionSelect = useCallback(
    (suggestion: any) => {
      // Get the full address from the suggestion
      const address = suggestion.description || suggestion.mainText || "";
      console.log("Selected pickup address:", address);

      // Update the input field and form data
      handleFormChange("pickup", address);
      pickupGeocoding.setAddress(address);

      // Hide suggestions immediately
      setShowPickupSuggestions(false);

      // Immediately geocode the selected address
      setIsFetchingSuggestions((prev) => ({ ...prev, pickup: true }));

      // Use a direct API call instead of going through the hook
      mapService
        .geocodeAddress(address)
        .then((result) => {
          console.log("Direct geocoding result for pickup:", result);

          if (result && result.latitude !== 0 && result.longitude !== 0) {
            // Update form data with coordinates
            setFormData((prev) => ({
              ...prev,
              pickup: address, // Ensure the address is set
              pickupCoordinates: {
                lat: result.latitude,
                lng: result.longitude,
              },
            }));

            // Also update the geocoding hook's result to keep things in sync
            // But don't call geocode again to avoid duplicate requests
            pickupGeocoding.setAddress(address);

            // Notify parent component
            if (onLocationChange) {
              onLocationChange(address, formData.dropoff);
            }
          } else {
            console.error(
              "Failed to get valid coordinates for pickup address:",
              address
            );
          }
        })
        .catch((err) => {
          console.error("Error geocoding pickup address:", err);
        })
        .finally(() => {
          setIsFetchingSuggestions((prev) => ({ ...prev, pickup: false }));
          // Ensure the geocoding hook's loading state is cleared
          pickupGeocoding.geocode(address);
        });
    },
    [
      handleFormChange,
      formData.dropoff,
      onLocationChange,
      pickupGeocoding,
      setFormData,
    ]
  );

  // Handle suggestion selection for dropoff
  const handleDropoffSuggestionSelect = useCallback(
    (suggestion: any) => {
      // Get the full address from the suggestion
      const address = suggestion.description || suggestion.mainText || "";
      console.log("Selected dropoff address:", address);

      // Update the input field and form data
      handleFormChange("dropoff", address);
      dropoffGeocoding.setAddress(address);

      // Hide suggestions immediately
      setShowDropoffSuggestions(false);

      // Immediately geocode the selected address
      setIsFetchingSuggestions((prev) => ({ ...prev, dropoff: true }));

      // Use a direct API call instead of going through the hook
      mapService
        .geocodeAddress(address)
        .then((result) => {
          console.log("Direct geocoding result for dropoff:", result);

          if (result && result.latitude !== 0 && result.longitude !== 0) {
            // Update form data with coordinates
            setFormData((prev) => ({
              ...prev,
              dropoff: address, // Ensure the address is set
              dropoffCoordinates: {
                lat: result.latitude,
                lng: result.longitude,
              },
            }));

            // Also update the geocoding hook's result to keep things in sync
            // But don't call geocode again to avoid duplicate requests
            dropoffGeocoding.setAddress(address);

            // Notify parent component
            if (onLocationChange) {
              onLocationChange(formData.pickup, address);
            }
          } else {
            console.error(
              "Failed to get valid coordinates for dropoff address:",
              address
            );
          }
        })
        .catch((err) => {
          console.error("Error geocoding dropoff address:", err);
        })
        .finally(() => {
          setIsFetchingSuggestions((prev) => ({ ...prev, dropoff: false }));
          // Ensure the geocoding hook's loading state is cleared
          dropoffGeocoding.geocode(address);
        });
    },
    [
      handleFormChange,
      formData.pickup,
      onLocationChange,
      dropoffGeocoding,
      setFormData,
    ]
  );

  // Clear input fields
  const handleClearPickup = useCallback(() => {
    handlePickupChange("");
  }, [handlePickupChange]);

  const handleClearDropoff = useCallback(() => {
    handleDropoffChange("");
  }, [handleDropoffChange]);

  // Update location coordinates when geocoding completes
  useEffect(() => {
    // Only update coordinates if they exist
    if (pickupGeocoding.coordinates) {
      setFormData((prev) => ({
        ...prev,
        pickupCoordinates: pickupGeocoding.coordinates, // This is already { lat, lng } or undefined
      }));
    }

    if (dropoffGeocoding.coordinates) {
      setFormData((prev) => ({
        ...prev,
        dropoffCoordinates: dropoffGeocoding.coordinates, // This is already { lat, lng } or undefined
      }));
    }

    // Notify parent component of address changes
    if (onLocationChange) {
      onLocationChange(pickupGeocoding.address, dropoffGeocoding.address);
    }
  }, [
    pickupGeocoding.coordinates,
    dropoffGeocoding.coordinates,
    pickupGeocoding.address,
    dropoffGeocoding.address,
    onLocationChange,
    setFormData,
  ]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close suggestions if clicking outside the suggestion containers
      const target = event.target as Node;
      const pickupContainer = document.getElementById(
        "pickup-suggestions-container"
      );
      const dropoffContainer = document.getElementById(
        "dropoff-suggestions-container"
      );

      if (pickupContainer && !pickupContainer.contains(target)) {
        setShowPickupSuggestions(false);
      }

      if (dropoffContainer && !dropoffContainer.contains(target)) {
        setShowDropoffSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine if the form is valid and ready to submit
  const isFormValid = useMemo(() => {
    // Check if both locations have valid coordinates
    const hasValidPickup =
      pickupGeocoding.address.trim().length > 0 &&
      formData.pickupCoordinates !== undefined;
    const hasValidDropoff =
      dropoffGeocoding.address.trim().length > 0 &&
      formData.dropoffCoordinates !== undefined;

    // Check if any loading process is happening
    const isLoading = pickupGeocoding.isLoading || dropoffGeocoding.isLoading;

    return hasValidPickup && hasValidDropoff && !isLoading;
  }, [
    pickupGeocoding.address,
    dropoffGeocoding.address,
    formData.pickupCoordinates,
    formData.dropoffCoordinates,
    pickupGeocoding.isLoading,
    dropoffGeocoding.isLoading,
  ]);

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
        {/* Pickup Location Field */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full" />
          <input
            className="w-full p-4 pl-8 pr-10 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={pickupGeocoding.address}
            onChange={(e) => handlePickupChange(e.target.value)}
            placeholder="Pickup location"
            aria-label="Pickup location"
            onFocus={() =>
              pickupGeocoding.address.length > 2 &&
              setShowPickupSuggestions(true)
            }
          />
          {pickupGeocoding.address && (
            <button
              onClick={handleClearPickup}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear pickup location"
            >
              <X size={16} />
            </button>
          )}
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

          {/* Pickup Suggestions */}
          {showPickupSuggestions && (
            <div
              id="pickup-suggestions-container"
              className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
            >
              {isFetchingSuggestions.pickup &&
                pickupSuggestions.length === 0 && (
                  <div className="p-2 text-sm text-gray-500 flex items-center justify-center">
                    <Loader className="w-3 h-3 mr-2 animate-spin" />
                    Loading suggestions...
                  </div>
                )}

              {!isFetchingSuggestions.pickup &&
                pickupSuggestions.length === 0 &&
                pickupGeocoding.address.length > 2 && (
                  <div className="p-2 text-sm text-gray-500">
                    No suggestions found
                  </div>
                )}

              {pickupSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handlePickupSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">
                        {suggestion.mainText || suggestion.description}
                      </div>
                      {suggestion.secondaryText && (
                        <div className="text-gray-500 text-xs">
                          {suggestion.secondaryText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dropoff Location Field */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 border-2 border-black rounded-full" />
          <input
            className="w-full p-4 pl-8 pr-10 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={dropoffGeocoding.address}
            onChange={(e) => handleDropoffChange(e.target.value)}
            placeholder="Dropoff location"
            aria-label="Dropoff location"
            onFocus={() =>
              dropoffGeocoding.address.length > 2 &&
              setShowDropoffSuggestions(true)
            }
          />
          {dropoffGeocoding.address && (
            <button
              onClick={handleClearDropoff}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear dropoff location"
            >
              <X size={16} />
            </button>
          )}
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

          {/* Dropoff Suggestions */}
          {showDropoffSuggestions && (
            <div
              id="dropoff-suggestions-container"
              className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
            >
              {isFetchingSuggestions.dropoff &&
                dropoffSuggestions.length === 0 && (
                  <div className="p-2 text-sm text-gray-500 flex items-center justify-center">
                    <Loader className="w-3 h-3 mr-2 animate-spin" />
                    Loading suggestions...
                  </div>
                )}

              {!isFetchingSuggestions.dropoff &&
                dropoffSuggestions.length === 0 &&
                dropoffGeocoding.address.length > 2 && (
                  <div className="p-2 text-sm text-gray-500">
                    No suggestions found
                  </div>
                )}

              {dropoffSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleDropoffSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">
                        {suggestion.mainText || suggestion.description}
                      </div>
                      {suggestion.secondaryText && (
                        <div className="text-gray-500 text-xs">
                          {suggestion.secondaryText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight Input */}
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

        {/* Carrier Selection */}
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

      {/* Calculate Delivery Button */}
      <button
        className={`w-full py-4 rounded-lg mt-6 text-sm font-medium transition-colors flex items-center justify-center
          ${
            isFormValid
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        onClick={onNext}
        disabled={!isFormValid}
        aria-disabled={!isFormValid}
      >
        {pickupGeocoding.isLoading || dropoffGeocoding.isLoading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Validating Locations...
          </>
        ) : !pickupGeocoding.address || !dropoffGeocoding.address ? (
          <>Enter Locations</>
        ) : (
          <>
            Calculate Delivery
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </>
        )}
      </button>

      {/* Form Validation Messages */}
      {!pickupGeocoding.address && !dropoffGeocoding.address && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Enter pickup and dropoff locations to continue
        </p>
      )}
    </motion.div>
  );
}
