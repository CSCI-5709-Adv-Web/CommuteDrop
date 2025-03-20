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

  // Update map when pickup/dropoff changes
  useEffect(() => {
    const updateMapPositions = async () => {
      try {
        // Check if either field has values
        const hasPickup = pickup && pickup.trim().length > 0;
        const hasDropoff = dropoff && dropoff.trim().length > 0;

        // Update the entered locations state
        setHasEnteredLocations(!!(hasPickup || hasDropoff));

        if (!hasPickup && !hasDropoff) {
          setPositions([]);
          return;
        }

        setIsLoadingMap(true);
        const newPositions: Position[] = [];

        if (hasPickup) {
          try {
            const pickupResult = await mapService.geocodeAddress(pickup);
            if (pickupResult.latitude !== 0 && pickupResult.longitude !== 0) {
              newPositions.push({
                lat: pickupResult.latitude,
                lng: pickupResult.longitude,
              });
            }
          } catch (error) {
            console.error("Error geocoding pickup address:", error);
          }
        }

        if (hasDropoff) {
          try {
            const dropoffResult = await mapService.geocodeAddress(dropoff);
            if (dropoffResult.latitude !== 0 && dropoffResult.longitude !== 0) {
              newPositions.push({
                lat: dropoffResult.latitude,
                lng: dropoffResult.longitude,
              });
            }
          } catch (error) {
            console.error("Error geocoding dropoff address:", error);
          }
        }

        // Only update state if we have positions
        if (newPositions.length > 0) {
          setPositions(newPositions);

          // Set center to the single point or midpoint
          if (newPositions.length === 1) {
            setCenter(newPositions[0]);
          } else if (newPositions.length === 2) {
            const centerLat = (newPositions[0].lat + newPositions[1].lat) / 2;
            const centerLng = (newPositions[0].lng + newPositions[1].lng) / 2;
            setCenter({ lat: centerLat, lng: centerLng });
          }
        }
      } catch (error) {
        console.error("Error updating map positions:", error);
      } finally {
        setIsLoadingMap(false);
      }
    };

    updateMapPositions();
  }, [pickup, dropoff]);

  // Handle location updates from DeliveryFlow
  const handleLocationUpdate = useCallback(
    (newPickup: string, newDropoff: string) => {
      setPickup(newPickup);
      setDropoff(newDropoff);
    },
    []
  );

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
