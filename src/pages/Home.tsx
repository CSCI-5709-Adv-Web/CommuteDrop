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
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  // Replace the handleLocationUpdate function with this improved version
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
      }
    },
    [pickup, dropoff]
  );

  // Replace the updateMapPositions function with this improved version
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
        setIsLoadingMap(true);
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
    } finally {
      setIsLoadingMap(false);
    }
  }, [pickup, dropoff]);

  // Replace the useEffect with this more immediate version
  useEffect(() => {
    // Call updateMapPositions immediately when pickup or dropoff changes
    updateMapPositions();
  }, [pickup, dropoff, updateMapPositions]);

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50 overflow-hidden"
      style={{ maxHeight: "100vh" }}
    >
      <Navbar />
      <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-full md:w-[400px] overflow-hidden">
          <DeliveryFlow onLocationUpdate={handleLocationUpdate} />
        </div>
        <div className="hidden md:block flex-1 rounded-lg overflow-hidden">
          <Map
            positions={positions}
            center={center}
            drawRoute={positions.length > 1}
            hasEnteredLocations={hasEnteredLocations}
            isLoading={isLoadingMap}
          />
        </div>
      </div>
    </div>
  );
}
