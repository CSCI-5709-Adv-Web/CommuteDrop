"use client";

import { useState, useCallback, useEffect } from "react";
import { mapService } from "../services/map-service";

// Update the LocationState interface to include routeInfo
export interface LocationState {
  pickup: string;
  dropoff: string;
  pickupCoordinates?: Position;
  dropoffCoordinates?: Position;
  mapPositions: Position[];
  mapCenter: Position;
  hasEnteredLocations: boolean;
  isLoadingMap: boolean;
  showRoute: boolean;
  routeInfo: {
    distance: string;
    duration: string;
  } | null;
}

export interface Position {
  lat: number;
  lng: number;
}

// Update the initial state to include routeInfo: null
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
    showRoute: false,
    routeInfo: null,
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

  // Update setPickup to NOT geocode automatically
  const setPickup = useCallback(async (address: string) => {
    setState((prev) => ({
      ...prev,
      pickup: address,
      // Don't update coordinates here - only update the text value
    }));
  }, []);

  // Update setDropoff to NOT geocode automatically
  const setDropoff = useCallback(async (address: string) => {
    setState((prev) => ({
      ...prev,
      dropoff: address,
      // Don't update coordinates here - only update the text value
    }));
  }, []);

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

  // Keep the calculateRoute function to geocode if needed
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
      // Geocode pickup if needed (only if we don't already have coordinates)
      if (state.pickup && !state.pickupCoordinates) {
        const pickupCoords = await geocodeAddress(state.pickup);
        if (pickupCoords) {
          setState((prev) => ({ ...prev, pickupCoordinates: pickupCoords }));
        }
      }

      // Geocode dropoff if needed (only if we don't already have coordinates)
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
      routeInfo: null,
    }));
  }, [defaultCenter]);

  // Add a function to update routeInfo
  const setRouteInfo = useCallback(
    (info: { distance: string; duration: string } | null) => {
      setState((prev) => ({ ...prev, routeInfo: info }));
    },
    []
  );

  // Update the return value to include routeInfo and setRouteInfo
  return {
    ...state,
    setPickup,
    setDropoff,
    setPickupCoordinates,
    setDropoffCoordinates,
    calculateRoute,
    setShowRoute,
    resetLocations,
    setRouteInfo,
  };
}
