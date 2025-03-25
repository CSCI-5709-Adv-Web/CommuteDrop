"use client";

import { useState, useCallback, useEffect } from "react";
import { mapService } from "../services/map-service";

// Update the LocationState interface to include a showRoute flag
export interface LocationState {
  pickup: string;
  dropoff: string;
  pickupCoordinates?: Position;
  dropoffCoordinates?: Position;
  mapPositions: Position[];
  mapCenter: Position;
  hasEnteredLocations: boolean;
  isLoadingMap: boolean;
  showRoute: boolean; // Add this flag to control when to show the route
}

export interface Position {
  lat: number;
  lng: number;
}

// Update the initial state to include showRoute: false
export function useLocationState() {
  // Default center (Halifax)
  const defaultCenter = { lat: 44.6488, lng: -63.5752 };

  const [state, setState] = useState<LocationState>({
    pickup: "",
    dropoff: "",
    pickupCoordinates: undefined,
    dropoffCoordinates: undefined,
    mapPositions: [],
    mapCenter: defaultCenter,
    hasEnteredLocations: false,
    isLoadingMap: false,
    showRoute: false, // Initialize as false
  });

  // Geocode an address and return coordinates
  const geocodeAddress = useCallback(
    async (address: string): Promise<Position | undefined> => {
      if (!address || address.trim().length === 0) return undefined;

      try {
        console.log(`Geocoding address: "${address}"`);
        const result = await mapService.geocodeAddress(address);
        console.log("Geocoding result:", result);

        if (result.latitude !== 0 && result.longitude !== 0) {
          return {
            lat: result.latitude,
            lng: result.longitude,
          };
        }
        return undefined;
      } catch (error) {
        console.error("Error geocoding address:", error);
        return undefined;
      }
    },
    []
  );

  // Update setPickup to only geocode when the address is meaningful
  const setPickup = useCallback(
    async (address: string) => {
      setState((prev) => ({ ...prev, pickup: address }));

      // Only geocode if the address is meaningful (at least 3 characters)
      if (address.trim().length > 2) {
        setState((prev) => ({ ...prev, isLoadingMap: true }));
        const coordinates = await geocodeAddress(address);
        setState((prev) => ({
          ...prev,
          pickupCoordinates: coordinates,
          isLoadingMap: false,
          hasEnteredLocations: prev.hasEnteredLocations || !!coordinates,
        }));
      } else {
        setState((prev) => ({ ...prev, pickupCoordinates: undefined }));
      }
    },
    [geocodeAddress]
  );

  // Update setDropoff to only geocode when the address is meaningful
  const setDropoff = useCallback(
    async (address: string) => {
      setState((prev) => ({ ...prev, dropoff: address }));

      // Only geocode if the address is meaningful (at least 3 characters)
      if (address.trim().length > 2) {
        setState((prev) => ({ ...prev, isLoadingMap: true }));
        const coordinates = await geocodeAddress(address);
        setState((prev) => ({
          ...prev,
          dropoffCoordinates: coordinates,
          isLoadingMap: false,
          hasEnteredLocations: prev.hasEnteredLocations || !!coordinates,
        }));
      } else {
        setState((prev) => ({ ...prev, dropoffCoordinates: undefined }));
      }
    },
    [geocodeAddress]
  );

  // Set coordinates directly (used when selecting from suggestions or current location)
  const setPickupCoordinates = useCallback(
    (coordinates: Position | undefined) => {
      setState((prev) => ({
        ...prev,
        pickupCoordinates: coordinates,
        hasEnteredLocations: prev.hasEnteredLocations || !!coordinates,
      }));
    },
    []
  );

  const setDropoffCoordinates = useCallback(
    (coordinates: Position | undefined) => {
      setState((prev) => ({
        ...prev,
        dropoffCoordinates: coordinates,
        hasEnteredLocations: prev.hasEnteredLocations || !!coordinates,
      }));
    },
    []
  );

  // Update map positions and center based on coordinates
  useEffect(() => {
    const updateMapPositions = () => {
      const newPositions: Position[] = [];

      if (state.pickupCoordinates) {
        newPositions.push(state.pickupCoordinates);
      }

      if (state.dropoffCoordinates) {
        newPositions.push(state.dropoffCoordinates);
      }

      // Calculate new center if we have positions
      let newCenter = state.mapCenter;
      if (newPositions.length === 1) {
        newCenter = newPositions[0];
      } else if (newPositions.length === 2) {
        newCenter = {
          lat: (newPositions[0].lat + newPositions[1].lat) / 2,
          lng: (newPositions[0].lng + newPositions[1].lng) / 2,
        };
      }

      setState((prev) => ({
        ...prev,
        mapPositions: newPositions,
        mapCenter: newCenter,
      }));
    };

    updateMapPositions();
  }, [state.pickupCoordinates, state.dropoffCoordinates]);

  // Add a function to toggle the route visibility
  const setShowRoute = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showRoute: show }));
  }, []);

  // Modify the calculateRoute function to set showRoute to true
  const calculateRoute = useCallback(async () => {
    console.log("Calculating route");

    // Make sure we have at least one location
    if (!state.pickup && !state.dropoff) {
      console.warn("Cannot calculate route: no locations provided");
      return;
    }

    setState((prev) => ({
      ...prev,
      hasEnteredLocations: true,
      isLoadingMap: true,
    }));

    try {
      // Geocode pickup if needed
      if (state.pickup && !state.pickupCoordinates) {
        const pickupCoords = await geocodeAddress(state.pickup);
        if (pickupCoords) {
          setState((prev) => ({ ...prev, pickupCoordinates: pickupCoords }));
        }
      }

      // Geocode dropoff if needed
      if (state.dropoff && !state.dropoffCoordinates) {
        const dropoffCoords = await geocodeAddress(state.dropoff);
        if (dropoffCoords) {
          setState((prev) => ({ ...prev, dropoffCoordinates: dropoffCoords }));
        }
      }

      // Set showRoute to true after calculating
      setState((prev) => ({ ...prev, showRoute: true }));
    } catch (error) {
      console.error("Error calculating route:", error);
    } finally {
      setState((prev) => ({ ...prev, isLoadingMap: false }));
    }
  }, [
    state.pickup,
    state.dropoff,
    state.pickupCoordinates,
    state.dropoffCoordinates,
    geocodeAddress,
  ]);

  // Add a resetLocations function to completely reset the location state
  const resetLocations = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pickup: "",
      dropoff: "",
      pickupCoordinates: undefined,
      dropoffCoordinates: undefined,
      mapPositions: [],
      mapCenter: defaultCenter,
      hasEnteredLocations: false,
      showRoute: false,
    }));
  }, [defaultCenter]);

  // Update the return value to include setShowRoute
  return {
    ...state,
    setPickup,
    setDropoff,
    setPickupCoordinates,
    setDropoffCoordinates,
    calculateRoute,
    setShowRoute,
    resetLocations,
  };
}
