"use client";

import { useState, useCallback, useEffect } from "react";
import { mapService } from "../services/map-service";

interface UseNearbyLocationsProps {
  userLocation?: { lat: number; lng: number } | null;
  radius?: number;
  maxResults?: number;
}

export function useNearbyLocations({
  userLocation,
  radius = 10000, // 10km default radius
  maxResults = 5,
}: UseNearbyLocationsProps = {}) {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch nearby locations
  const fetchNearbyLocations = useCallback(async () => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get nearby locations
      const nearbyLocations = await mapService.getNearbyLocations(
        userLocation,
        radius,
        "point_of_interest",
        maxResults
      );

      setLocations(nearbyLocations);
    } catch (error) {
      console.error("Error fetching nearby locations:", error);
      setError("Failed to fetch nearby locations");
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, radius, maxResults]);

  // Fetch locations in a specific region
  const fetchLocationsInRegion = useCallback(
    async (regionName = "Nova Scotia") => {
      setIsLoading(true);
      setError(null);

      try {
        // Get locations within the specified region
        const regionLocations = await mapService.getLocationsInRegion(
          regionName,
          maxResults
        );

        if (regionLocations.length > 0) {
          setLocations(regionLocations);
        } else {
          setError("No locations found in this region");
        }
      } catch (error) {
        console.error("Error fetching region locations:", error);
        setError("Failed to fetch locations in region");
      } finally {
        setIsLoading(false);
      }
    },
    [maxResults]
  );

  // Auto-fetch nearby locations when userLocation changes
  useEffect(() => {
    if (userLocation) {
      fetchNearbyLocations();
    }
  }, [userLocation, fetchNearbyLocations]);

  return {
    locations,
    isLoading,
    error,
    fetchNearbyLocations,
    fetchLocationsInRegion,
  };
}
