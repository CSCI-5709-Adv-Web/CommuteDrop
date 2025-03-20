"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LoaderIcon, MapPin } from "lucide-react";
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
  hasEnteredLocations?: boolean;
  isLoading?: boolean;
}

export default function Map({
  positions,
  center,
  drawRoute = true,
  hasEnteredLocations = false,
  isLoading = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const googleRef = useRef<typeof google | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Improve map initialization
  const initMap = useCallback(async () => {
    if (mapRef.current === null) return;
    setIsMapLoading(true);

    try {
      console.log(
        "Initializing map with API key:",
        API_CONFIG.MAPS_API_KEY ? "Available" : "Not available"
      );

      const loader = new GoogleMapsLoader({
        apiKey: API_CONFIG.MAPS_API_KEY || "",
        version: "weekly",
        libraries: ["places", "routes"],
      });

      // Load the global Google object first
      await loader.load();
      console.log("Google Maps API loaded successfully");

      // Now we can access the global google object
      googleRef.current = window.google;

      // Create new map instance
      const mapInstance = new googleRef.current.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        disableDefaultUI: false,
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

      console.log("Map instance created successfully");
      setMap(mapInstance);
      setIsMapLoading(false);

      // If we have positions, update the map immediately
      if (positions.length > 0) {
        console.log("Setting initial map bounds with positions:", positions);
        const bounds = new googleRef.current.maps.LatLngBounds();
        positions.forEach((position) => bounds.extend(position));
        mapInstance.fitBounds(bounds);
      }
    } catch (error) {
      console.error("Error loading Google Maps:", error);
      setError("Failed to load map. Please try again later.");
      setIsMapLoading(false);
    }
  }, [center, positions]);

  // Initialize map on mount
  useEffect(() => {
    if (!map) {
      initMap();
    }
  }, [map, initMap]);

  // Improve map responsiveness when positions change

  // Update the useEffect for handling position changes
  useEffect(() => {
    if (!map || !googleRef.current) return;

    const google = googleRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    console.log("Updating map with positions:", positions);

    if (positions.length === 0) {
      // No positions to show
      console.log("No positions to show on map");
      return;
    }

    // Create new markers
    const newMarkers = positions.map((position, index) => {
      console.log(`Creating marker ${index} at position:`, position);

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
          animation: google.maps.Animation.DROP, // Add animation for better visibility
        });
      }
    });

    // @ts-ignore - Store markers regardless of type
    markersRef.current = newMarkers;

    // Fit bounds to include all markers
    if (positions.length > 1) {
      console.log("Fitting bounds to multiple positions");
      const bounds = new google.maps.LatLngBounds();
      positions.forEach((position) => bounds.extend(position));
      map.fitBounds(bounds);

      // Don't zoom in too far - using a one-time listener to avoid infinite updates
      google.maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined && currentZoom > 16) {
          console.log("Adjusting zoom level to 16");
          map.setZoom(16);
        }
      });
    } else if (positions.length === 1) {
      console.log("Centering map on single position:", positions[0]);
      map.setCenter(positions[0]);
      map.setZoom(15);

      // Add a slight pan animation for single marker
      setTimeout(() => {
        map.panBy(0, -50);
        setTimeout(() => map.panBy(0, 50), 300);
      }, 300);
    }
  }, [map, positions]);

  // Draw polyline between points using directions API
  useEffect(() => {
    if (!map || !googleRef.current || positions.length < 2 || !drawRoute)
      return;

    // Always proceed with drawing route, even if hasEnteredLocations is false
    // This ensures the route updates properly when positions change

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
  }, [map, positions, drawRoute]); // Removed hasEnteredLocations dependency to ensure route always updates

  // Render map placeholder when no locations are entered
  if (!hasEnteredLocations) {
    return (
      <div className="relative w-full h-full rounded-lg bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Enter a location
          </h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Start typing a pickup or dropoff location to see it on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-lg"
      style={{ minHeight: "500px" }}
    >
      {(isMapLoading || isLoading) && (
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
