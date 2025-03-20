"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LoaderIcon } from "lucide-react";
import { Loader as GoogleMapsLoader } from "@googlemaps/js-api-loader";
import { mapService } from "../../services/map-service";
import { API_CONFIG } from "../../config/api-config";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  const initMap = useCallback(async () => {
    if (mapRef.current === null) return;
    setIsLoading(true);

    try {
      const loader = new GoogleMapsLoader({
        apiKey: API_CONFIG.MAPS_API_KEY,
        version: "weekly",
        libraries: ["places", "routes"],
      });

      // Load the global Google object first
      await loader.load();

      // Now we can access the global google object
      googleRef.current = window.google;

      // Create new map instance - don't set styles directly when using mapId
      const mapInstance = new googleRef.current.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        // Use either mapId OR styles, not both
        // mapId: "YOUR_MAP_ID", // If using a custom map style from Google Cloud Console
        disableDefaultUI: false,
        // Only set styles if not using mapId
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setMap(mapInstance);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading Google Maps:", error);
      setError("Failed to load map. Please try again later.");
      setIsLoading(false);
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

    // Create new markers using the updated AdvancedMarkerElement if available
    const newMarkers = positions.map((position, index) => {
      // Check if AdvancedMarkerElement is available
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        // Use the new AdvancedMarkerElement
        const markerElement = document.createElement("div");
        markerElement.className = "marker-pin";
        markerElement.style.width = "24px";
        markerElement.style.height = "24px";
        markerElement.style.borderRadius = "50%";
        markerElement.style.backgroundColor =
          index === 0 ? "#34D399" : "#EF4444";
        markerElement.style.border = "2px solid #ffffff";
        markerElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

        // @ts-ignore - AdvancedMarkerElement might not be in the types yet
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          map,
          content: markerElement,
        });
      } else {
        // Fallback to regular Marker
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
      }
    });

    // @ts-ignore - Store markers regardless of type
    markersRef.current = newMarkers;

    // Fit bounds to include all markers
    if (positions.length > 1) {
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
    } else if (positions.length === 1) {
      map.setCenter(positions[0]);
      map.setZoom(15);
    }
  }, [map, positions]);

  // Draw polyline between points using directions API
  useEffect(() => {
    if (!map || !googleRef.current || positions.length < 2 || !drawRoute)
      return;

    const google = googleRef.current;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const fetchDirections = async () => {
      try {
        const origin = positions[0];
        const destination = positions[positions.length - 1];

        // Get waypoints if there are more than 2 positions
        const waypoints =
          positions.length > 2
            ? positions.slice(1, positions.length - 1)
            : undefined;

        const directionsResult = await mapService.getDirections(
          origin,
          destination,
          waypoints
        );

        if (directionsResult.path.length > 0) {
          // Create polyline with the path from directions
          const newPolyline = new google.maps.Polyline({
            path: directionsResult.path,
            geodesic: true,
            strokeColor: "#2563EB", // Primary color
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
          });

          polylineRef.current = newPolyline;
        } else {
          // Fallback to direct line between points if directions failed
          const newPolyline = new google.maps.Polyline({
            path: positions,
            geodesic: true,
            strokeColor: "#2563EB", // Primary color
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
          });

          polylineRef.current = newPolyline;
        }
      } catch (error) {
        console.error("Error fetching directions:", error);

        // Fallback to direct line
        const newPolyline = new google.maps.Polyline({
          path: positions,
          geodesic: true,
          strokeColor: "#2563EB", // Primary color
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });

        polylineRef.current = newPolyline;
      }
    };

    fetchDirections();

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, positions, drawRoute]);

  return (
    <div
      className="relative w-full h-full rounded-lg"
      style={{ minHeight: "500px" }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="flex flex-col items-center">
            <LoaderIcon className="w-10 h-10 text-primary animate-spin" />
            <p className="mt-2 text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <div className="text-center p-4">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => initMap()}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        aria-label="Map showing delivery route"
        role="application"
      />
    </div>
  );
}
