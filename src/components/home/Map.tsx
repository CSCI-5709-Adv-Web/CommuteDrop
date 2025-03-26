"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGoogleMaps } from "../../context/GoogleMapsContext";
import { useLocation } from "../../context/LocationContext";
import { Loader } from "lucide-react";
import type { Position } from "../../hooks/useLocationState";

import MapMarker from "./map/MapMarker";
import MapRoute from "./map/MapRoute";
import RouteInfo from "./map/RouteInfo";
import NoRouteMessage from "./map/NoRouteMessage";
import MapPlaceholder from "./map/MapPlaceholder";

// Remove the custom map styles array
const mapStyles = []; // Empty array to use default Google Maps styling

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
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [noRouteFound, setNoRouteFound] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState("");
  const [routeDestination, setRouteDestination] = useState("");

  // Use the location context instead of local state
  const { setRouteInfo, routeInfo } = useLocation();

  const { google, isLoading: isMapLoading, error } = useGoogleMaps();

  // Update map when Google Maps is loaded
  useEffect(() => {
    if (!google || !mapRef.current || googleMapRef.current) return;

    console.log("Initializing map with Google Maps API");

    try {
      // Update the map initialization to use default styling
      const mapOptions = {
        center: center,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        // Remove the styles property or set to empty array
        styles: [],
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: "cooperative",
        disableDefaultUI: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      setMapInitialized(true);

      console.log("Map initialized successfully");
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  }, [google, center]);

  // Update map bounds when positions change
  useEffect(() => {
    if (!google || !googleMapRef.current || positions.length === 0) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      positions.forEach((pos) => bounds.extend(pos));

      // Add padding to the bounds
      googleMapRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });

      // If only one position, set appropriate zoom
      if (positions.length === 1) {
        googleMapRef.current.setCenter(positions[0]);
        googleMapRef.current.setZoom(15);
      }
    } catch (err) {
      console.error("Error updating map bounds:", err);
    }
  }, [google, positions]);

  // Update the handleRouteInfoChange to use context
  const handleRouteInfoChange = useCallback(
    (info: { distance: string; duration: string } | null) => {
      setRouteInfo(info);
    },
    [setRouteInfo]
  );

  const handleRouteError = useCallback(
    (hasError: boolean, origin: string, destination: string) => {
      setNoRouteFound(hasError);
      setRouteOrigin(origin);
      setRouteDestination(destination);
    },
    []
  );

  // Show loading state or placeholder if needed
  if (isMapLoading || !google) {
    return (
      <div
        className="relative w-full h-full rounded-lg flex items-center justify-center bg-gray-100"
        style={{ minHeight: "500px" }}
      >
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-primary animate-spin" />
          <p className="mt-2 text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative w-full h-full rounded-lg flex items-center justify-center bg-red-50"
        style={{ minHeight: "500px" }}
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="mt-2 text-sm text-gray-600">
            Please check your Google Maps API key and internet connection.
          </p>
        </div>
      </div>
    );
  }

  if (!hasEnteredLocations) {
    return <MapPlaceholder />;
  }

  if (isLoading) {
    return (
      <div
        className="relative w-full h-full rounded-lg flex items-center justify-center bg-gray-100"
        style={{ minHeight: "500px" }}
      >
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-primary animate-spin" />
          <p className="mt-2 text-gray-600">Calculating route...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "500px" }}
    >
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ height: "100%", minHeight: "500px" }}
        aria-label="Map showing delivery route"
        role="application"
      />

      {googleMapRef.current &&
        mapInitialized &&
        positions.map((position, index) => (
          <MapMarker
            key={`marker-${index}-${position.lat}-${position.lng}`}
            position={position}
            map={googleMapRef.current}
            index={index}
            type={index === 0 ? "pickup" : "dropoff"}
          />
        ))}

      {googleMapRef.current && mapInitialized && positions.length > 1 && (
        <MapRoute
          origin={positions[0]}
          destination={positions[positions.length - 1]}
          map={googleMapRef.current}
          drawRoute={drawRoute}
          onRouteInfoChange={handleRouteInfoChange}
          onRouteError={handleRouteError}
        />
      )}

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
