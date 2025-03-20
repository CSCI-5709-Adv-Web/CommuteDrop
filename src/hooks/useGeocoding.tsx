"use client";

import { useState, useCallback, useEffect } from "react";
import { mapService, type GeocodingResult } from "../services/map-service";

interface UseGeocodingProps {
  initialAddress?: string;
  autoGeocode?: boolean;
}

export function useGeocoding({
  initialAddress,
  autoGeocode = false,
}: UseGeocodingProps = {}) {
  const [address, setAddress] = useState(initialAddress || "");
  const [result, setResult] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(
    async (addressToGeocode?: string) => {
      const addressToUse = addressToGeocode || address;

      if (!addressToUse.trim()) {
        setError("Address is required");
        return;
      }

      // Don't geocode if we're already loading or if the address hasn't changed
      if (isLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const geocodingResult = await mapService.geocodeAddress(addressToUse);

        // Check if we got valid coordinates (now using Halifax as default instead of 0,0)
        if (geocodingResult.latitude === 0 && geocodingResult.longitude === 0) {
          setError("Could not find coordinates for this address");
          setResult(null);
        } else {
          // Only update result if it's different from current result
          const hasChanged =
            !result ||
            result.latitude !== geocodingResult.latitude ||
            result.longitude !== geocodingResult.longitude;

          if (hasChanged) {
            setResult(geocodingResult);
            // Clear any previous error
            setError(null);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during geocoding"
        );
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [address, isLoading, result]
  );

  // Auto-geocode when initialAddress changes (if enabled)
  useEffect(() => {
    if (initialAddress && autoGeocode) {
      setAddress(initialAddress);
      geocode(initialAddress);
    }
  }, [initialAddress, autoGeocode, geocode]);

  // Update address without geocoding
  const updateAddress = useCallback(
    (newAddress: string) => {
      // Only update if address has changed
      if (address !== newAddress) {
        setAddress(newAddress);
      }
    },
    [address]
  );

  return {
    address,
    setAddress: updateAddress,
    geocode,
    result,
    isLoading,
    error,
    coordinates: result
      ? { lat: result.latitude, lng: result.longitude }
      : null,
  };
}
