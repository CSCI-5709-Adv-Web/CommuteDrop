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
    if (!map || !google) {
      return;
    }

    // Cleanup existing elements
    const cleanup = () => {
      console.log("Cleaning up route polylines");

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

      // Clear path reference
      pathRef.current = [];

      // Notify parent that route info is cleared
      if (onRouteInfoChange) {
        onRouteInfoChange(null);
      }
    };

    // Always clean up existing polylines when positions change or drawRoute is false
    cleanup();

    // If we're not supposed to draw the route, exit early
    if (!drawRoute) {
      return;
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

        // Create a subtle background polyline for the entire route
        const backgroundPolyline = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: "#e2e8f0", // Light gray (slate-200)
          strokeOpacity: 0.6,
          strokeWeight: 5,
          map,
          zIndex: 1,
          strokeCap: "round",
          strokeJoin: "round",
        });

        // Create the main route polyline (initially empty - will follow the animation)
        const mainPolyline = new google.maps.Polyline({
          path: [], // Start empty
          geodesic: true,
          strokeColor: "#2563eb", // Primary blue color
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map,
          zIndex: 2, // Above the background
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
          zIndex: 4, // Highest z-index to appear on top
          strokeCap: "round",
          strokeJoin: "round",
        });
        animatedPolylineRef.current = animatedPolyline;

        // Create a glow effect around the white light
        const glowPolyline = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#93c5fd", // Light blue glow (blue-300)
          strokeOpacity: 0.6,
          strokeWeight: 10, // Wider than the white line to create glow
          map,
          zIndex: 3, // Between main route and animated line
          strokeCap: "round",
          strokeJoin: "round",
        });
        pulsePolylineRef.current = glowPolyline;

        // Animation variables
        const animationDuration = 8000; // 8 seconds for one complete cycle
        let startTime: number | null = null;
        let lastPulseTime = 0;
        let pulseOpacity = 0.6;
        let pulseDirection = -1; // Start by decreasing opacity

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;

          const elapsed = timestamp - startTime;
          const progress = (elapsed % animationDuration) / animationDuration;

          // Calculate how many points to include based on progress
          const pointCount = Math.max(
            2,
            Math.floor(pathCoordinates.length * progress)
          );

          // Create the animated path - this will be used for both the main blue line and the animated white line
          const animatedPath = pathCoordinates.slice(0, pointCount);

          // Add interpolated point for smooth animation at the end
          if (pointCount < pathCoordinates.length) {
            const lastPoint = pathCoordinates[pointCount - 1];
            const nextPoint = pathCoordinates[pointCount];
            const segmentProgress = (progress * pathCoordinates.length) % 1;

            // Use spherical interpolation for more accurate geographic interpolation
            if (google.maps.geometry && google.maps.geometry.spherical) {
              const interpolated = google.maps.geometry.spherical.interpolate(
                new google.maps.LatLng(lastPoint),
                new google.maps.LatLng(nextPoint),
                segmentProgress
              );

              animatedPath.push({
                lat: interpolated.lat(),
                lng: interpolated.lng(),
              });
            } else {
              // Fallback to linear interpolation
              const interpolatedPoint = {
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

          // Update the main blue polyline to follow the animation
          if (mainPolylineRef.current) {
            mainPolylineRef.current.setPath(animatedPath);
          }

          // Update the animated white polyline
          if (animatedPolylineRef.current) {
            // For the animated white line, we only want to show the very tip
            const tipLength = Math.min(3, animatedPath.length);
            const tipPath = animatedPath.slice(animatedPath.length - tipLength);
            animatedPolylineRef.current.setPath(tipPath);
          }

          // Create glow effect around the white light
          if (pulsePolylineRef.current && animatedPath.length > 0) {
            // Use the last few points of the animated path for the glow
            const glowLength = Math.min(5, animatedPath.length);
            const glowPath = animatedPath.slice(
              animatedPath.length - glowLength
            );
            pulsePolylineRef.current.setPath(glowPath);

            // Pulse the glow opacity for a more dynamic effect
            if (timestamp - lastPulseTime > 50) {
              // Update every 50ms
              pulseOpacity += 0.03 * pulseDirection;

              // Reverse direction when reaching bounds
              if (pulseOpacity <= 0.4) {
                pulseOpacity = 0.4;
                pulseDirection = 1;
              } else if (pulseOpacity >= 0.8) {
                pulseOpacity = 0.8;
                pulseDirection = -1;
              }

              pulsePolylineRef.current.setOptions({
                strokeOpacity: pulseOpacity,
              });
              lastPulseTime = timestamp;
            }
          }

          // Continue animation
          animationFrameRef.current = window.requestAnimationFrame(animate);
        };

        // Start animation
        animationFrameRef.current = window.requestAnimationFrame(animate);

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
    return cleanup;
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
