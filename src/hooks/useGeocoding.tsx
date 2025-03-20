"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { mapService, type GeocodingResult } from "../services/map-service";

interface UseGeocodingProps {
  initialAddress?: string;
  autoGeocode?: boolean;
  debounceMs?: number;
}

export function useGeocoding({
  initialAddress,
  autoGeocode = false,
  debounceMs = 800, // Increased debounce time for better performance
}: UseGeocodingProps = {}) {
  const [address, setAddress] = useState(initialAddress || "");
  const [result, setResult] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Clear any existing timer when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fix the geocode function to properly handle loading states
  const geocode = useCallback(
    async (addressToGeocode?: string) => {
      const addressToUse = addressToGeocode || address;

      if (!addressToUse.trim()) {
        setError("Address is required");
        setResult(null);
        setIsLoading(false); // Make sure to clear loading state
        return null;
      }

      // Clear any existing timer when directly geocoding
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Don't geocode if we're already loading and it's the same address
      if (isLoading && addressToUse === address) {
        console.log("Skipping duplicate geocoding request for:", addressToUse);
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`Geocoding address in hook: "${addressToUse}"`);
        const geocodingResult = await mapService.geocodeAddress(addressToUse);

        // Only update if component is still mounted
        if (!isMountedRef.current) return null;

        // Check if we got valid coordinates
        if (geocodingResult.latitude === 0 && geocodingResult.longitude === 0) {
          console.warn(
            `No valid coordinates returned for address: "${addressToUse}"`
          );
          setError("Could not find coordinates for this address");
          setResult(null);
          return null;
        } else {
          // Update state with new result
          setResult(geocodingResult);
          setError(null);

          // Log success for debugging
          console.log(
            "Successfully geocoded address in hook:",
            addressToUse,
            geocodingResult
          );
          return geocodingResult;
        }
      } catch (err) {
        if (!isMountedRef.current) return null;

        console.error("Geocoding error in hook:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during geocoding"
        );
        setResult(null);
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false); // Always ensure loading state is cleared
        }
      }
    },
    [address, isLoading]
  );

  // Debounced geocode function
  const debouncedGeocode = useCallback(
    (addressToGeocode?: string) => {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        geocode(addressToGeocode);
      }, debounceMs);
    },
    [geocode, debounceMs]
  );

  // Auto-geocode when initialAddress changes (if enabled)
  useEffect(() => {
    if (initialAddress && autoGeocode) {
      setAddress(initialAddress);
      debouncedGeocode(initialAddress);
    }
  }, [initialAddress, autoGeocode, debouncedGeocode]);

  // Fix the updateAddress function to properly handle loading states
  const updateAddress = useCallback(
    (newAddress: string) => {
      // Always update the address state
      setAddress(newAddress);

      // Trigger geocoding for any non-empty value
      if (newAddress.trim()) {
        // Clear any existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set loading state immediately for UI feedback
        setIsLoading(true);

        // Set a new timer for debounced geocoding
        debounceTimerRef.current = setTimeout(() => {
          geocode(newAddress);
        }, debounceMs);
      } else {
        // If address is empty, clear the result and loading state
        setResult(null);
        setIsLoading(false);
      }
    },
    [geocode, debounceMs]
  );

  // Modify the return object to expose the direct geocode function
  return {
    address,
    setAddress: updateAddress,
    geocode: geocode, // Expose the direct geocode function
    debouncedGeocode, // Keep the debounced version available
    result,
    isLoading,
    error,
    coordinates: result
      ? { lat: result.latitude, lng: result.longitude }
      : undefined,
  };
}
