"use client"

import { useEffect, useRef } from "react"
import { Loader } from "@googlemaps/js-api-loader"

interface MapProps {
  positions: { lat: number; lng: number }[]
  center: { lat: number; lng: number }
}

export default function Map({ positions, center }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: "weekly",
      })

      try {
        const { Map } = await loader.importLibrary("maps")
        const { Marker } = await loader.importLibrary("marker")

        const map = new Map(mapRef.current as HTMLElement, {
          center,
          zoom: 13,
          mapId: "YOUR_MAP_ID", // Optional: for styled maps
          disableDefaultUI: false, // Optional: show/hide default UI
          styles: [], // Optional: custom map styles
        })

        positions.forEach((position) => {
          new Marker({
            position: position,
            map: map,
          })
        })
      } catch (error) {
        console.error("Error loading Google Maps:", error)
      }
    }

    initMap()
  }, [center, positions])

  return (
    <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: "500px" }} />
  )
}

