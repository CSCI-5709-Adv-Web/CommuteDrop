"use client";

import { MapPin } from "lucide-react";

interface RouteInfoProps {
  distance: string;
  duration: string;
}

export default function RouteInfo({ distance, duration }: RouteInfoProps) {
  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-md z-10 max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-black" />
        <span className="font-medium text-sm">Route Information</span>
      </div>
      <div className="text-xs text-gray-700">
        <div className="flex items-center gap-1 mb-1">
          <span className="font-medium">Distance:</span> {distance}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">Duration:</span> {duration}
        </div>
      </div>
    </div>
  );
}
