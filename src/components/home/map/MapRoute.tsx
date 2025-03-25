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
  const progressLineRef = useRef<google.maps.Polyline | null>(null);
  const animationRef = useRef<number | null>(null);
  const { google } = useGoogleMaps();

  useEffect(() => {
    if (!map || !drawRoute || !google) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (progressLineRef.current) {
        progressLineRef.current.setMap(null);
        progressLineRef.current = null;
      }
      if (animationRef.current) {
        window.clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (progressLineRef.current) {
      progressLineRef.current.setMap(null);
      progressLineRef.current = null;
    }
    if (animationRef.current) {
      window.clearInterval(animationRef.current);
      animationRef.current = null;
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
        let pathCoordinates: google.maps.LatLngLiteral[] = [];
        if (directionsResult.path && directionsResult.path.length > 0) {
          pathCoordinates = directionsResult.path;
        } else if (
          directionsResult.route?.geometry &&
          Array.isArray(directionsResult.route.geometry)
        ) {
          pathCoordinates = directionsResult.route.geometry.map(
            (point: any[]) => ({
              lat: point[1],
              lng: point[0],
            })
          );
        } else {
          pathCoordinates = [
            typeof origin === "string" ? { lat: 0, lng: 0 } : origin,
            typeof destination === "string" ? { lat: 0, lng: 0 } : destination,
          ];
        }
        const polyline = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: "#000000",
          strokeOpacity: 0.8,
          strokeWeight: 5,
          map,
        });
        polylineRef.current = polyline;
        const progressLine = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#FFFFFF",
          strokeOpacity: 1,
          strokeWeight: 5,
          map,
          zIndex: 2,
        });
        progressLineRef.current = progressLine;
        let progress = 0;
        const animationSpeed = 1.5;
        animationRef.current = window.setInterval(() => {
          progress += animationSpeed;
          if (progress >= 100) {
            progress = 0;
          }
          const pointsToInclude = Math.max(
            1,
            Math.floor((pathCoordinates.length * progress) / 100)
          );
          let progressPath: google.maps.LatLngLiteral[] = [];
          if (pointsToInclude > 0) {
            progressPath = pathCoordinates.slice(0, pointsToInclude);
          }
          if (pointsToInclude < pathCoordinates.length && pointsToInclude > 0) {
            const lastPoint = pathCoordinates[pointsToInclude - 1];
            const nextPoint = pathCoordinates[pointsToInclude];
            const segmentProgress =
              (progress * pathCoordinates.length) / 100 - (pointsToInclude - 1);
            const interpolatedPoint: google.maps.LatLngLiteral = {
              lat:
                lastPoint.lat +
                (nextPoint.lat - lastPoint.lat) * segmentProgress,
              lng:
                lastPoint.lng +
                (nextPoint.lng - lastPoint.lng) * segmentProgress,
            };
            progressPath.push(interpolatedPoint);
          }
          progressLine.setPath(progressPath);
        }, 16);

        // Update route info if available
        if (onRouteInfoChange) {
          if (
            directionsResult.distance?.text &&
            directionsResult.duration?.text
          ) {
            onRouteInfoChange({
              distance: directionsResult.distance.text || "Unknown",
              duration: directionsResult.duration.text || "Unknown",
            });
          } else if (directionsResult.summary) {
            onRouteInfoChange({
              distance: `${directionsResult.summary.distance} km` || "Unknown",
              duration:
                `${directionsResult.summary.durationMinutes} mins` || "Unknown",
            });
          } else {
            onRouteInfoChange(null);
          }
        }

        if (onRouteError) {
          onRouteError(false, originStr, destinationStr);
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

    // Make sure to clean up the progress line in the cleanup function
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      if (progressLineRef.current) {
        progressLineRef.current.setMap(null);
        progressLineRef.current = null;
      }

      if (animationRef.current) {
        window.clearInterval(animationRef.current);
        animationRef.current = null;
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
