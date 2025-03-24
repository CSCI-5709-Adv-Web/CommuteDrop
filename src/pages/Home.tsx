"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import DeliveryFlow from "../components/home/DeliveryFlow";
import Map from "../components/home/Map";
import { mapService } from "../services/map-service";

interface Position {
  lat: number;
  lng: number;
}

export default function Home() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [center, setCenter] = useState<Position>({
    lat: 44.6488, // Default center (Halifax)
    lng: -63.5752,
  });
  const [hasEnteredLocations, setHasEnteredLocations] = useState(false);
  // Removed isLoadingMap state

  // Update the updateMapPositions function to remove loading state references
  const updateMapPositions = useCallback(async () => {
    try {
      // Check if either field has values
      const hasPickup = pickup && pickup.trim().length > 0;
      const hasDropoff = dropoff && dropoff.trim().length > 0;

      console.log("Updating map positions with addresses:", {
        pickup,
        dropoff,
      });

      // Update the entered locations state - this is key to showing the map
      setHasEnteredLocations(!!(hasPickup || hasDropoff));

      // If no locations, clear positions and return early
      if (!hasPickup && !hasDropoff) {
        setPositions([]);
        return;
      }

      // Proceed with geocoding if we have at least one location
      if (hasPickup || hasDropoff) {
        const newPositions: Position[] = [];

        // Process pickup location if it exists
        if (hasPickup) {
          try {
            console.log(`Geocoding pickup address in Home: "${pickup}"`);
            const pickupResult = await mapService.geocodeAddress(pickup);
            console.log("Pickup geocoding result in Home:", pickupResult);

            if (pickupResult.latitude !== 0 && pickupResult.longitude !== 0) {
              newPositions.push({
                lat: pickupResult.latitude,
                lng: pickupResult.longitude,
              });
              console.log("Added pickup position:", {
                lat: pickupResult.latitude,
                lng: pickupResult.longitude,
              });
            } else {
              console.warn(
                `No valid coordinates returned for pickup address: "${pickup}"`
              );
            }
          } catch (error) {
            console.error("Error geocoding pickup address:", error);
          }
        }

        // Process dropoff location if it exists
        if (hasDropoff) {
          try {
            console.log(`Geocoding dropoff address in Home: "${dropoff}"`);
            const dropoffResult = await mapService.geocodeAddress(dropoff);
            console.log("Dropoff geocoding result in Home:", dropoffResult);

            if (dropoffResult.latitude !== 0 && dropoffResult.longitude !== 0) {
              newPositions.push({
                lat: dropoffResult.latitude,
                lng: dropoffResult.longitude,
              });
              console.log("Added dropoff position:", {
                lat: dropoffResult.latitude,
                lng: dropoffResult.longitude,
              });
            } else {
              console.warn(
                `No valid coordinates returned for dropoff address: "${dropoff}"`
              );
            }
          } catch (error) {
            console.error("Error geocoding dropoff address:", error);
          }
        }

        // Only update state if we have positions
        if (newPositions.length > 0) {
          console.log("Setting map positions:", newPositions);
          setPositions(newPositions);

          // Set center to the single point or midpoint
          if (newPositions.length === 1) {
            setCenter(newPositions[0]);
            console.log("Setting map center to single point:", newPositions[0]);
          } else if (newPositions.length === 2) {
            const centerLat = (newPositions[0].lat + newPositions[1].lat) / 2;
            const centerLng = (newPositions[0].lng + newPositions[1].lng) / 2;
            const newCenter = { lat: centerLat, lng: centerLng };
            setCenter(newCenter);
            console.log("Setting map center to midpoint:", newCenter);
          }
        } else {
          console.warn("No valid positions found for addresses:", {
            pickup,
            dropoff,
          });
        }
      }
    } catch (error) {
      console.error("Error updating map positions:", error);
    }
  }, [pickup, dropoff]);

  // Update the calculateAndDisplayRoute function to remove loading state references
  const calculateAndDisplayRoute = useCallback(() => {
    console.log("Explicitly calculating and displaying route");

    // Make sure we have at least one location before proceeding
    if (!pickup && !dropoff) {
      console.warn("Cannot calculate route: no locations provided");
      return;
    }

    setHasEnteredLocations(true); // Always show map when calculating route

    // If we don't have coordinates yet, we need to geocode the addresses first
    const geocodeAddresses = async () => {
      let needsUpdate = false;
      const newPositions: Position[] = [...positions];

      try {
        // Geocode pickup if needed
        if (pickup && (!positions[0] || positions.length === 0)) {
          try {
            console.log(`Geocoding pickup address: "${pickup}"`);
            const pickupResult = await mapService.geocodeAddress(pickup);

            if (pickupResult.latitude !== 0 && pickupResult.longitude !== 0) {
              const pickupPos = {
                lat: pickupResult.latitude,
                lng: pickupResult.longitude,
              };

              if (newPositions.length === 0) {
                newPositions.push(pickupPos);
              } else {
                newPositions[0] = pickupPos;
              }

              needsUpdate = true;
              console.log("Added pickup position:", pickupPos);
            }
          } catch (error) {
            console.error("Error geocoding pickup address:", error);
          }
        }

        // Geocode dropoff if needed
        if (dropoff && (!positions[1] || positions.length < 2)) {
          try {
            console.log(`Geocoding dropoff address: "${dropoff}"`);
            const dropoffResult = await mapService.geocodeAddress(dropoff);

            if (dropoffResult.latitude !== 0 && dropoffResult.longitude !== 0) {
              const dropoffPos = {
                lat: dropoffResult.latitude,
                lng: dropoffResult.longitude,
              };

              if (newPositions.length < 2) {
                newPositions.push(dropoffPos);
              } else {
                newPositions[1] = dropoffPos;
              }

              needsUpdate = true;
              console.log("Added dropoff position:", dropoffPos);
            }
          } catch (error) {
            console.error("Error geocoding dropoff address:", error);
          }
        }

        // Update positions if we got new ones
        if (needsUpdate) {
          console.log("Updating positions with:", newPositions);
          setPositions(newPositions);

          // Update center
          if (newPositions.length === 1) {
            setCenter(newPositions[0]);
          } else if (newPositions.length === 2) {
            const centerLat = (newPositions[0].lat + newPositions[1].lat) / 2;
            const centerLng = (newPositions[0].lng + newPositions[1].lng) / 2;
            setCenter({ lat: centerLat, lng: centerLng });
          }
        }
      } catch (error) {
        console.error("Error in geocoding operation:", error);
      }
    };

    // Start the geocoding process
    geocodeAddresses();
  }, [pickup, dropoff, positions]);

  // Update the handleLocationUpdate function to remove loading state references
  const handleLocationUpdate = useCallback(
    (newPickup: string, newDropoff: string) => {
      console.log("Location update received:", { newPickup, newDropoff });

      // Only update if values have changed
      if (pickup !== newPickup) {
        setPickup(newPickup);
      }

      if (dropoff !== newDropoff) {
        setDropoff(newDropoff);
      }

      // Set hasEnteredLocations to true if either location is provided
      if (
        (newPickup && newPickup.trim().length > 0) ||
        (newDropoff && newDropoff.trim().length > 0)
      ) {
        setHasEnteredLocations(true);

        // Trigger map update when locations change
        if (pickup !== newPickup || dropoff !== newDropoff) {
          // Use a short timeout to allow state updates to complete
          setTimeout(() => {
            calculateAndDisplayRoute();
          }, 100);
        }
      }
    },
    [pickup, dropoff, calculateAndDisplayRoute]
  );

  // Replace the existing useEffect for positions with a simpler version without loading state
  useEffect(() => {
    // Only run geocoding when pickup or dropoff changes AND they have content
    if (
      (pickup && pickup.trim().length > 0) ||
      (dropoff && dropoff.trim().length > 0)
    ) {
      // Use a simple timeout for debouncing
      const timer = setTimeout(async () => {
        await updateMapPositions();
      }, 800);

      // Clean up the timer on unmount or when dependencies change
      return () => clearTimeout(timer);
    }
  }, [pickup, dropoff, updateMapPositions]);

  // Update the return statement to remove isLoading prop
  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50 overflow-hidden"
      style={{ maxHeight: "100vh" }}
    >
      <Navbar />
      <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-full md:w-[400px] overflow-hidden">
          <DeliveryFlow
            onLocationUpdate={handleLocationUpdate}
            onCalculateRoute={calculateAndDisplayRoute}
          />
        </div>
        <div
          className="hidden md:block flex-1 rounded-lg overflow-hidden"
          style={{ height: "calc(100vh - 4rem - 48px)" }}
        >
          <Map
            positions={positions}
            center={center}
            drawRoute={positions.length > 1}
            hasEnteredLocations={hasEnteredLocations}
          />
        </div>
      </div>
    </div>
  );
}
