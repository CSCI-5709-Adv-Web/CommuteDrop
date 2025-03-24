"use client";

import { MapPin } from "lucide-react";

interface NearbyLocationProps {
  location: {
    name: string;
    address: string;
    distance?: number;
    latitude?: number;
    longitude?: number;
  };
  onSelect: () => void;
}

export default function NearbyLocationSuggestion({
  location,
  onSelect,
}: NearbyLocationProps) {
  // Format the distance to show in km or m
  const formatDistance = (distance?: number): string => {
    if (distance === undefined) return "";

    if (distance < 1) {
      // Show in meters if less than 1km
      return `${Math.round(distance * 1000)}m away`;
    }

    // Show in km with 1 decimal place
    return `${distance.toFixed(1)}km away`;
  };

  return (
    <div
      className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex items-start flex-1"
      onClick={onSelect}
    >
      <MapPin className="w-4 h-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
      <div>
        <div className="font-medium">{location.name}</div>
        <div className="text-gray-500 text-xs">{location.address}</div>
        {location.distance !== undefined && (
          <div className="text-xs text-primary mt-1">
            {formatDistance(location.distance)}
          </div>
        )}
      </div>
    </div>
  );
}
