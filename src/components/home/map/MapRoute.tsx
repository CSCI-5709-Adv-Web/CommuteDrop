"use client";

import { useEffect, useRef } from "react";
import { mapService } from "../../../services/map-service";
import { useGoogleMaps } from "../../../context/GoogleMapsContext";

interface MapRouteProps {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  map: google.maps.Map | null;
  drawRoute: boolean;
  onRouteInfoChange?: (
    info: { distance: string; duration: string } | null
  ) => void;
  onRouteError?: (
    hasError: boolean,
    origin: string,
    destination: string
  ) => void;
}

export default function MapRoute({
  origin,
  destination,
  map,
  drawRoute,
  onRouteInfoChange,
  onRouteError,
}: MapRouteProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const { google } = useGoogleMaps();

  useEffect(() => {
    if (!map || !drawRoute || !google) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    const fetchDirections = async () => {
      try {
        const originStr =
          typeof origin === "string"
            ? origin
            : `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
        const destinationStr =
          typeof destination === "string"
            ? destination
            : `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
        const directionsResult = await mapService.getDirections(
          origin,
          destination
        );
        if (directionsResult.path && directionsResult.path.length > 0) {
          const polyline = new google.maps.Polyline({
            path: directionsResult.path,
            geodesic: true,
            strokeColor: "#000000", // Changed to black
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#000000",
                  fillOpacity: 1,
                  scale: 2,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 1,
                },
                offset: "0%",
                repeat: "20px",
              },
            ],
          });

          // Animate the flow along the route
          let offset = 0;
          window.setInterval(() => {
            offset = (offset + 1) % 100;
            const icons = polyline.get("icons");
            icons[0].offset = offset + "%";
            polyline.set("icons", icons);
          }, 50);

          polylineRef.current = polyline;

          if (onRouteInfoChange) {
            onRouteInfoChange({
              distance: directionsResult.distance?.text || "Unknown",
              duration: directionsResult.duration?.text || "Unknown",
            });
          }

          if (onRouteError) {
            onRouteError(false, originStr, destinationStr);
          }
        } else if (
          directionsResult.route?.geometry &&
          Array.isArray(directionsResult.route.geometry)
        ) {
          const pathCoordinates = directionsResult.route.geometry.map(
            (point: any[]) => ({
              lat: point[1],
              lng: point[0],
            })
          );

          const polyline = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: "#000000", // Changed to black
            strokeOpacity: 0.8,
            strokeWeight: 5,
            map,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#000000",
                  fillOpacity: 1,
                  scale: 2,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 1,
                },
                offset: "0%",
                repeat: "20px",
              },
            ],
          });

          // Animate the flow along the route
          let offset = 0;
          window.setInterval(() => {
            offset = (offset + 1) % 100;
            const icons = polyline.get("icons");
            icons[0].offset = offset + "%";
            polyline.set("icons", icons);
          }, 50);

          polylineRef.current = polyline;

          if (onRouteInfoChange && directionsResult.summary) {
            onRouteInfoChange({
              distance: `${directionsResult.summary.distance} km` || "Unknown",
              duration:
                `${directionsResult.summary.durationMinutes} mins` || "Unknown",
            });
          }

          if (onRouteError) {
            onRouteError(false, originStr, destinationStr);
          }
        } else {
          // Show a straight line as fallback
          const newPolyline = new google.maps.Polyline({
            path: [
              typeof origin === "string" ? { lat: 0, lng: 0 } : origin,
              typeof destination === "string"
                ? { lat: 0, lng: 0 }
                : destination,
            ],
            geodesic: true,
            strokeColor: "#000000", // Changed to black
            strokeOpacity: 0.7,
            strokeWeight: 3,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 2,
                  fillColor: "#000000",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 1,
                },
                offset: "0",
                repeat: "20px",
              },
            ],
            map,
          });

          polylineRef.current = newPolyline;

          if (onRouteInfoChange) {
            onRouteInfoChange(null);
          }

          if (onRouteError) {
            onRouteError(true, originStr, destinationStr);
          }
        }
      } catch (error) {
        console.error("Error fetching directions:", error);

        if (onRouteInfoChange) {
          onRouteInfoChange(null);
        }

        if (onRouteError) {
          const originStr =
            typeof origin === "string"
              ? origin
              : `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;

          const destinationStr =
            typeof destination === "string"
              ? destination
              : `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;

          onRouteError(true, originStr, destinationStr);
        }
      }
    };
    if (drawRoute) {
      fetchDirections();
    }
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [
    map,
    origin,
    destination,
    drawRoute,
    onRouteInfoChange,
    onRouteError,
    google,
  ]);

  return null;
}
