"use client";

import { useEffect, useRef } from "react";

interface MapMarkerProps {
  position: { lat: number; lng: number };
  map: google.maps.Map | null;
  index: number;
  type: "pickup" | "dropoff";
}

export default function MapMarker({ position, map, type }: MapMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers to prevent duplicates
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create custom marker icons based on type
    const markerIcon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: type === "pickup" ? "#10b981" : "#ef4444", // Green for pickup, red for dropoff
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2,
      scale: 8,
    };

    // Create a pulse effect marker (larger circle with animation)
    const pulseCircle = new window.google.maps.Marker({
      position,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: type === "pickup" ? "#10b981" : "#ef4444",
        fillOpacity: 0.3,
        strokeColor: type === "pickup" ? "#10b981" : "#ef4444",
        strokeWeight: 1,
        scale: 16,
      },
      zIndex: 1,
    });

    // Create the main marker
    const marker = new window.google.maps.Marker({
      position,
      map,
      icon: markerIcon,
      zIndex: 2,
      animation: window.google.maps.Animation.DROP,
    });

    markerRef.current = marker;

    // Add pulse animation
    let scale = 16;
    let increasing = false;
    const animatePulse = () => {
      if (increasing) {
        scale += 0.2;
        if (scale >= 20) {
          increasing = false;
        }
      } else {
        scale -= 0.2;
        if (scale <= 16) {
          increasing = true;
        }
      }

      if (pulseCircle) {
        pulseCircle.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: type === "pickup" ? "#10b981" : "#ef4444",
          fillOpacity: 0.3,
          strokeColor: type === "pickup" ? "#10b981" : "#ef4444",
          strokeWeight: 1,
          scale: scale,
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(animatePulse);
    };

    const animationFrameRef = {
      current: window.requestAnimationFrame(animatePulse),
    };

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (pulseCircle) {
        pulseCircle.setMap(null);
      }
    };
  }, [map, position, type]);

  return null;
}
