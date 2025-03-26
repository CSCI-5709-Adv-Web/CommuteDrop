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
  const mainPolylineRef = useRef<google.maps.Polyline | null>(null);
  const animatedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const pulsePolylineRef = useRef<google.maps.Polyline | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pathRef = useRef<google.maps.LatLngLiteral[]>([]);
  const { google } = useGoogleMaps();

  useEffect(() => {
    if (!map || !drawRoute || !google) {
      // Clean up existing polylines and animation
      if (mainPolylineRef.current) {
        mainPolylineRef.current.setMap(null);
        mainPolylineRef.current = null;
      }
      if (animatedPolylineRef.current) {
        animatedPolylineRef.current.setMap(null);
        animatedPolylineRef.current = null;
      }
      if (pulsePolylineRef.current) {
        pulsePolylineRef.current.setMap(null);
        pulsePolylineRef.current = null;
      }
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Clean up existing polylines and animation before creating new ones
    if (mainPolylineRef.current) {
      mainPolylineRef.current.setMap(null);
      mainPolylineRef.current = null;
    }
    if (animatedPolylineRef.current) {
      animatedPolylineRef.current.setMap(null);
      animatedPolylineRef.current = null;
    }
    if (pulsePolylineRef.current) {
      pulsePolylineRef.current.setMap(null);
      pulsePolylineRef.current = null;
    }
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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

        // Extract path coordinates
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

        // Store path for animation
        pathRef.current = pathCoordinates;

        // Create the main route polyline
        if (google) {
          const mainPolyline = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: "#000000", // Black tunnel
            strokeOpacity: 1,
            strokeWeight: 6, // Slightly thicker
            map,
            zIndex: 1,
            strokeCap: "round",
            strokeJoin: "round",
          });
          mainPolylineRef.current = mainPolyline;

          // Create the animated polyline (initially empty)
          const animatedPolyline = new google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: "#FFFFFF", // Bright white light
            strokeOpacity: 1,
            strokeWeight: 3,
            map,
            zIndex: 2,
            strokeCap: "round",
            strokeJoin: "round",
          });
          animatedPolylineRef.current = animatedPolyline;

          // Remove the pulse polyline as we want a cleaner "light in tunnel" effect
          // Instead, create a glow effect around the white light
          const glowPolyline = new google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: "#FFFFFF", // White glow
            strokeOpacity: 0.4, // Transparent for glow effect
            strokeWeight: 9, // Wider than the white line to create glow
            map,
            zIndex: 0,
            strokeCap: "round",
            strokeJoin: "round",
          });
          pulsePolylineRef.current = glowPolyline;

          // Start the animation
          let progress = 0;
          const direction = 1; // 1 for forward, -1 for backward
          let lastTimestamp = 0;

          const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;

            // Calculate time delta and adjust progress
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            // Adjust speed based on path length for consistent animation
            const speedFactor =
              0.000025 * Math.min(pathCoordinates.length, 100); // Reduced by half for slower animation
            progress += speedFactor * delta;

            // Reset to beginning when reaching the end for one-way animation
            if (progress >= 1) {
              progress = 0;
              // Keep direction as 1 to always move forward
            }

            // Calculate how many points to include in the animated path
            const pointsToInclude = Math.max(
              1,
              Math.floor(pathCoordinates.length * progress)
            );

            // Create the animated path
            let animatedPath: google.maps.LatLngLiteral[] = [];
            if (pointsToInclude > 0) {
              animatedPath = pathCoordinates.slice(0, pointsToInclude);

              // Add interpolated point for smooth animation
              if (pointsToInclude < pathCoordinates.length) {
                const lastPoint = pathCoordinates[pointsToInclude - 1];
                const nextPoint = pathCoordinates[pointsToInclude];
                const segmentProgress =
                  progress * pathCoordinates.length - (pointsToInclude - 1);

                const interpolatedPoint: google.maps.LatLngLiteral = {
                  lat:
                    lastPoint.lat +
                    (nextPoint.lat - lastPoint.lat) * segmentProgress,
                  lng:
                    lastPoint.lng +
                    (nextPoint.lng - lastPoint.lng) * segmentProgress,
                };

                animatedPath.push(interpolatedPoint);
              }
            }

            // Update the animated polyline
            if (animatedPolylineRef.current) {
              animatedPolylineRef.current.setPath(animatedPath);
            }

            // Create glow effect around the white light
            if (pulsePolylineRef.current && animatedPath.length > 0) {
              // Use the same path as the animated polyline for the glow
              // But only take the last few points to make it look like a moving light
              const glowLength = Math.min(3, animatedPath.length);
              const glowPath = animatedPath.slice(
                animatedPath.length - glowLength
              );
              pulsePolylineRef.current.setPath(glowPath);
            }

            // Continue animation
            animationFrameRef.current = window.requestAnimationFrame(animate);
          };

          // Start animation
          animationFrameRef.current = window.requestAnimationFrame(animate);
        }

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

    // Clean up function
    return () => {
      if (mainPolylineRef.current) {
        mainPolylineRef.current.setMap(null);
        mainPolylineRef.current = null;
      }
      if (animatedPolylineRef.current) {
        animatedPolylineRef.current.setMap(null);
        animatedPolylineRef.current = null;
      }
      if (pulsePolylineRef.current) {
        pulsePolylineRef.current.setMap(null);
        pulsePolylineRef.current = null;
      }
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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
