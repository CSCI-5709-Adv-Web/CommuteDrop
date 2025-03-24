/**
 * Utility functions for map operations
 */

import { mapService } from "../services/map-service"

/**
 * Calculate the center point between two coordinates
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Center coordinate
 */
export function calculateCenter(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number },
): { lat: number; lng: number } {
  return {
    lat: (point1.lat + point2.lat) / 2,
    lng: (point1.lng + point2.lng) / 2,
  }
}

/**
 * Format coordinates for display or API calls
 * @param coordinates Coordinates object
 * @returns Formatted string
 */
export function formatCoordinates(coordinates: { lat: number; lng: number }): string {
  return `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`
}

/**
 * Parse coordinates from string
 * @param coordString Coordinate string in format "lat,lng"
 * @returns Coordinates object or undefined if invalid
 */
export function parseCoordinates(coordString: string): { lat: number; lng: number } | undefined {
  try {
    const [lat, lng] = coordString.split(",").map(Number)
    if (isNaN(lat) || isNaN(lng)) return undefined
    return { lat, lng }
  } catch (error) {
    console.error("Error parsing coordinates:", error)
    return undefined
  }
}

/**
 * Get coordinates for an address with error handling
 * @param address Address to geocode
 * @param province Optional province/region
 * @returns Promise with coordinates or undefined
 */
export async function getCoordinatesForAddress(
  address: string,
  province = "Nova Scotia",
): Promise<{ lat: number; lng: number } | undefined> {
  if (!address || address.trim().length === 0) return undefined

  try {
    const result = await mapService.geocodeAddress(address, province)

    if (result && result.latitude !== 0 && result.longitude !== 0) {
      return {
        lat: result.latitude,
        lng: result.longitude,
      }
    }

    return undefined
  } catch (error) {
    console.error("Error getting coordinates for address:", error)
    return undefined
  }
}

