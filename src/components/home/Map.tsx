"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface Position {
  lat: number;
  lng: number;
}

interface MapProps {
  positions: Position[];
  center: Position;
  drawRoute?: boolean;
}

export default function Map({ positions, center, drawRoute = true }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const googleRef = useRef<typeof google | null>(null);

  // Initialize map
  const initMap = useCallback(async () => {
    if (mapRef.current === null) return;

    try {
      const loader = new Loader({
        apiKey:
          (import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY as string) || "",
        version: "weekly",
        libraries: ["places", "routes"],
      });

      // Load Google Maps
      const { Map } = await loader.importLibrary("maps");
      googleRef.current = window.google;

      // Create new map instance
      const mapInstance = new Map(mapRef.current, {
        center,
        zoom: 13,
        mapId: "YOUR_MAP_ID", // Optional: for styled maps
        disableDefaultUI: false, // Optional: show/hide default UI
        styles: [], // Optional: custom map styles
      });

      setMap(mapInstance);
    } catch (error) {
      console.error("Error loading Google Maps:", error);
    }
  }, [center]);

  // Initialize map on mount
  useEffect(() => {
    if (!map) {
      initMap();
    }
  }, [map, initMap]);

  // Update markers when positions change
  useEffect(() => {
    if (!map || !googleRef.current) return;

    const google = googleRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const newMarkers = positions.map((position, index) => {
      return new google.maps.Marker({
        position,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: index === 0 ? "#34D399" : "#EF4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });
    });

    markersRef.current = newMarkers;

    // Fit bounds to include all markers
    if (positions.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      positions.forEach((position) => bounds.extend(position));
      map.fitBounds(bounds);

      // Don't zoom in too far - using a one-time listener to avoid infinite updates
      google.maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined && currentZoom > 16) {
          map.setZoom(16);
        }
      });
    }
  }, [map, positions]);

  // Draw polyline between points
  useEffect(() => {
    if (!map || !googleRef.current || positions.length < 2 || !drawRoute)
      return;

    const google = googleRef.current;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Create new polyline
    const newPolyline = new google.maps.Polyline({
      path: positions,
      geodesic: true,
      strokeColor: "#2563EB", // Primary color
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    });

    polylineRef.current = newPolyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, positions, drawRoute]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: "500px" }}
      aria-label="Map showing delivery route"
      role="application"
    />
  );
}
