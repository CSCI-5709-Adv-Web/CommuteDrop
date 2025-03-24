"use client";

import { useEffect, useRef } from "react";
import type { google } from "@googlemaps/js-api-loader";

interface MapMarkerProps {
  position: { lat: number; lng: number };
  map: google.maps.Map | null;
  index: number;
  type: "pickup" | "dropoff";
}

export default function MapMarker({
  position,
  map,
  index,
  type,
}: MapMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const marker = new window.google.maps.Marker({
      position,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: type === "pickup" ? "#000000" : "#EF4444",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
        scale: 8,
      },
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, position, type]);

  return null;
}
