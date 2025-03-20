"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import DeliveryFlow from "../components/home/DeliveryFlow";
import Map from "../components/home/Map";

interface Position {
  lat: number;
  lng: number;
}

// Mock geocoding function - in a real app, this would use Google's Geocoding API
const geocodeAddress = async (address: string): Promise<Position | null> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock geocoding results for Halifax area
  const mockLocations: Record<string, Position> = {
    "quinpool tower": { lat: 44.6454, lng: -63.5918 },
    "dalhousie dentistry faculty practice": { lat: 44.6366, lng: -63.585 },
    "halifax shopping centre": { lat: 44.6497, lng: -63.6108 },
    "halifax central library": { lat: 44.6434, lng: -63.5775 },
    "point pleasant park": { lat: 44.6228, lng: -63.5686 },
    "halifax citadel": { lat: 44.6478, lng: -63.5804 },
    "halifax waterfront": { lat: 44.6476, lng: -63.5683 },
    dartmouth: { lat: 44.6658, lng: -63.5669 },
    bedford: { lat: 44.7325, lng: -63.6556 },
    "downtown halifax": { lat: 44.6488, lng: -63.5752 },
    "south end": { lat: 44.6328, lng: -63.5714 },
    "north end": { lat: 44.6608, lng: -63.5908 },
    fairview: { lat: 44.6608, lng: -63.6328 },
    // Default fallback for unknown locations - random point in Halifax
    default: {
      lat: 44.6488 + (Math.random() * 0.02 - 0.01),
      lng: -63.5752 + (Math.random() * 0.02 - 0.01),
    },
  };

  // Normalize the address for lookup
  const normalizedAddress = address.toLowerCase().trim();

  // Find a matching location or return a point near the default
  for (const [key, location] of Object.entries(mockLocations)) {
    if (normalizedAddress.includes(key)) {
      return location;
    }
  }

  // Return default with slight randomization if no match
  return mockLocations.default;
};

export default function Home() {
  const [pickup, setPickup] = useState("Quinpool Tower");
  const [dropoff, setDropoff] = useState(
    "Dalhousie Dentistry Faculty Practice"
  );
  const [positions, setPositions] = useState<Position[]>([
    { lat: 44.6454, lng: -63.5918 },
    { lat: 44.6366, lng: -63.585 },
  ]);
  const [center, setCenter] = useState<Position>({
    lat: 44.6414,
    lng: -63.5827,
  });

  // Update map when pickup/dropoff changes
  useEffect(() => {
    const updateMapPositions = async () => {
      try {
        // Only geocode if both fields have values
        if (!pickup && !dropoff) {
          return;
        }

        const newPositions: Position[] = [];

        if (pickup) {
          const pickupCoords = await geocodeAddress(pickup);
          if (pickupCoords) newPositions.push(pickupCoords);
        }

        if (dropoff) {
          const dropoffCoords = await geocodeAddress(dropoff);
          if (dropoffCoords) newPositions.push(dropoffCoords);
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
          <Map positions={positions} center={center} drawRoute={true} />
        </div>
      </div>
    </div>
  );
}
