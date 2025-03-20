"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LoaderIcon, MapPin, AlertTriangle } from "lucide-react";
import { mapService } from "../../services/map-service";
import MapBackground from "./MapBackground";
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

// Add this new interface for the NoRouteMessage component
interface NoRouteMessageProps {
  origin: string;
  destination: string;
}

// Add this new component for displaying no route messages
function NoRouteMessage({ origin, destination }: NoRouteMessageProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg max-w-md text-center pointer-events-auto">
        <div className="flex justify-center mb-2">
          <AlertTriangle className="text-amber-500 w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Route Available
        </h3>
        <p className="text-gray-600 mb-3">
          We couldn't find a valid route between these locations:
        </p>
        <div className="bg-gray-50 p-2 rounded mb-3 text-sm">
          <div className="font-medium">
            From: <span className="font-normal">{origin}</span>
          </div>
          <div className="font-medium">
            To: <span className="font-normal">{destination}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          This may be because the locations are too far apart, across water, or
          not connected by roads.
        </p>
      </div>
    </div>
  );
}

// Add a new component to display route information
interface RouteInfoProps {
  distance: string;
  duration: string;
}

function RouteInfo({ distance, duration }: RouteInfoProps) {
  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-md z-10 max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-primary" />
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

// Declare google variable
declare global {
  interface Window {
    google: any;
  }
}

export default function Map({
  positions,
  center,
  drawRoute = true,
  hasEnteredLocations = false,
  isLoading = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<
    google.maps.Polyline | google.maps.DirectionsRenderer | null
  >(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noRouteFound, setNoRouteFound] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState("");
  const [routeDestination, setRouteDestination] = useState("");
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleLoaded(true);
      return;
    }

    const googleMapScript = document.createElement("script");
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${API_CONFIG.MAPS_API_KEY}&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;
    googleMapScript.onload = () => {
      setGoogleLoaded(true);
    };
    googleMapScript.onerror = () => {
      setError(
        "Failed to load Google Maps. Please check your internet connection and try again."
      );
    };
    document.body.appendChild(googleMapScript);

    return () => {
      // Clean up script if component unmounts before script loads
      document.body.removeChild(googleMapScript);
    };
  }, []);

  // Initialize map
  const initMap = useCallback(() => {
    if (!googleLoaded || !mapRef.current) return;
    setIsMapLoading(true);

    try {
      const mapOptions: google.maps.MapOptions = {
        center: center,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;

      // If we have positions, update the map immediately
      if (positions.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        positions.forEach((pos) => bounds.extend(pos));
        map.fitBounds(bounds);
      }

      setIsMapLoading(false);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setError("Failed to initialize map. Please try again later.");
      setIsMapLoading(false);
    }
  }, [center, googleLoaded, positions]);

  // Initialize map when Google Maps API is loaded
  useEffect(() => {
    if (googleLoaded && !googleMapRef.current) {
      initMap();
    }
  }, [googleLoaded, initMap]);

  // Update markers when positions change
  useEffect(() => {
    if (!googleMapRef.current || !googleLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (positions.length === 0) return;

    // Create new markers
    const newMarkers = positions.map((position, index) => {
      const marker = new window.google.maps.Marker({
        position: position,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: index === 0 ? "#34D399" : "#EF4444", // Green for pickup, red for dropoff
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
          scale: 8,
        },
      });
      return marker;
    });

    markersRef.current = newMarkers;

    // Fit bounds to include all markers
    if (positions.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      positions.forEach((pos) => bounds.extend(pos));
      googleMapRef.current.fitBounds(bounds);
    } else if (positions.length === 1) {
      googleMapRef.current.setCenter(positions[0]);
      googleMapRef.current.setZoom(15);
    }
  }, [googleMapRef.current, googleLoaded, positions]);

  // Draw route when positions change
  useEffect(() => {
    if (
      !googleMapRef.current ||
      !googleLoaded ||
      positions.length < 2 ||
      !drawRoute
    )
      return;

    // Clear existing polyline or directions renderer
    if (polylineRef.current) {
      if (
        polylineRef.current instanceof window.google.maps.DirectionsRenderer
      ) {
        polylineRef.current.setMap(null);
      } else if (polylineRef.current instanceof window.google.maps.Polyline) {
        polylineRef.current.setMap(null);
      }
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

        // Store origin and destination addresses for potential error message
        const originAddress =
          typeof origin === "string"
            ? origin
            : `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
        const destinationAddress =
          typeof destination === "string"
            ? destination
            : `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;

        setRouteOrigin(originAddress);
        setRouteDestination(destinationAddress);

        // Use the proxy server to get directions
        const directionsResult = await mapService.getDirections(
          origin,
          destination,
          waypoints
        );

        // Check if we have a valid route
        if (directionsResult.path && directionsResult.path.length > 0) {
          // Create a polyline with the path from the proxy server
          const polyline = new window.google.maps.Polyline({
            path: directionsResult.path,
            geodesic: true,
            strokeColor: "#2563EB", // Primary color
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: googleMapRef.current,
          });

          polylineRef.current = polyline;

          // Set route information
          setRouteInfo({
            distance: directionsResult.distance?.text || "Unknown",
            duration: directionsResult.duration?.text || "Unknown",
          });

          setNoRouteFound(false);
          console.log("Route successfully displayed using proxy server");
        }
        // Check if we have route geometry in the format from your endpoint
        else if (
          directionsResult.route?.geometry &&
          Array.isArray(directionsResult.route.geometry)
        ) {
          console.log("Using route geometry from response");

          // Convert the [lng, lat] format to {lat, lng} objects that Google Maps expects
          const pathCoordinates = directionsResult.route.geometry.map(
            (point: any[]) => ({
              lat: point[1], // Second element is latitude
              lng: point[0], // First element is longitude
            })
          );

          // Create a polyline with the converted path
          const polyline = new window.google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: "#2563EB", // Primary color
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map: googleMapRef.current,
          });

          polylineRef.current = polyline;

          // Set route information from summary if available
          if (directionsResult.summary) {
            setRouteInfo({
              distance: `${directionsResult.summary.distance} km` || "Unknown",
              duration:
                `${directionsResult.summary.durationMinutes} mins` || "Unknown",
            });
          }

          setNoRouteFound(false);
          console.log("Route successfully displayed using route geometry");
        } else {
          console.warn("No route available between these locations");

          // Show a straight line as last resort with dashed style to indicate it's not a real route
          const newPolyline = new window.google.maps.Polyline({
            path: positions,
            geodesic: true,
            strokeColor: "#EF4444", // Red color to indicate not a real route
            strokeOpacity: 0.7,
            strokeWeight: 3,
            icons: [
              {
                icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 1 },
                offset: "0",
                repeat: "10px",
              },
            ],
            map: googleMapRef.current,
          });

          polylineRef.current = newPolyline;
          setNoRouteFound(true);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);

        // Last resort - straight line with warning
        const newPolyline = new window.google.maps.Polyline({
          path: positions,
          geodesic: true,
          strokeColor: "#EF4444", // Red color
          strokeOpacity: 0.7,
          strokeWeight: 3,
          icons: [
            {
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 1 },
              offset: "0",
              repeat: "10px",
            },
          ],
          map: googleMapRef.current,
        });

        polylineRef.current = newPolyline;
        setNoRouteFound(true);
      }
    };

    fetchDirections();

    return () => {
      if (polylineRef.current) {
        if (
          polylineRef.current instanceof window.google.maps.DirectionsRenderer
        ) {
          polylineRef.current.setMap(null);
        } else if (polylineRef.current instanceof window.google.maps.Polyline) {
          polylineRef.current.setMap(null);
        }
        polylineRef.current = null;
      }
    };
  }, [googleMapRef.current, googleLoaded, positions, drawRoute]);

  // Render map placeholder when no locations are entered
  if (!hasEnteredLocations) {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <MapBackground />
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-opacity-60 backdrop-blur-sm">
          <div className="text-center p-8 bg-white bg-opacity-80 rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Enter a location
            </h3>
            <p className="text-gray-600 max-w-xs mx-auto">
              Start typing a pickup or dropoff location to see it on the map
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-lg"
      style={{ minHeight: "500px" }}
    >
      {(isMapLoading || isLoading || !googleLoaded) && (
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

      {routeInfo && !noRouteFound && positions.length > 1 && (
        <RouteInfo
          distance={routeInfo.distance}
          duration={routeInfo.duration}
        />
      )}

      {noRouteFound && positions.length > 1 && (
        <NoRouteMessage origin={routeOrigin} destination={routeDestination} />
      )}
    </div>
  );
}
