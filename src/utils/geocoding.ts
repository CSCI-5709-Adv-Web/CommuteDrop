/**
 * Utility functions for geocoding operations
 */

import { mapService } from "../services/map-service"

/**
 * Geocode an address to coordinates
 * @param address The address to geocode
 * @param province Optional province/region to improve accuracy
 * @returns Promise with coordinates or undefined if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  province = "Nova Scotia",
): Promise<{ lat: number; lng: number } | undefined> {
  if (!address || address.trim().length === 0) {
    return undefined
  }

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
    console.error("Error geocoding address:", error)
    return undefined
  }
}

/**
 * Check if coordinates are valid
 * @param coordinates The coordinates to check
 * @returns Boolean indicating if coordinates are valid
 */
export function isValidCoordinates(coordinates: { lat: number; lng: number } | undefined): boolean {
  if (!coordinates) return false

  const { lat, lng } = coordinates

  // Check if coordinates are within valid ranges
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

