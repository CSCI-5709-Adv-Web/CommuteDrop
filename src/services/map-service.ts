// Update the getAddressSuggestions function to use the ENDPOINTS from api-config
import { ENDPOINTS } from "../config/api-config"

export interface GeocodingResult {
  address: string
  latitude: number
  longitude: number
  formattedAddress?: string
  placeId?: string
}

export interface Route {
  path: Array<{ lat: number; lng: number }>
  distance: {
    text: string
    value: number // in meters
  }
  duration: {
    text: string
    value: number // in seconds
  }
}

// Update the AutocompleteResult interface to include the 'text' property
export interface AutocompleteResult {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
  text?: string // Add optional text property
}

// Updated service to use the proxy server API endpoints without caching
export const mapService = {
  /**
   * Get address suggestions for autocomplete
   */
  getAddressSuggestions: async (text: string, maxResults = 5, province?: string): Promise<AutocompleteResult[]> => {
    if (!text.trim()) return []

    try {
      console.log("Fetching address suggestions for:", text, province ? `in ${province}` : "")

      // Build the URL with province parameter if provided
      let url = `${ENDPOINTS.MAPS.AUTOCOMPLETE}?text=${encodeURIComponent(text)}&maxResults=${maxResults}`
      if (province) {
        url += `&region=${encodeURIComponent(province)}`
      }

      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      })

      if (!response.ok) {
        throw new Error(`Autocomplete failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Raw autocomplete response:", data)

      // Handle different response formats
      if (Array.isArray(data)) {
        return data.map((item: Record<string, any>) => ({
          placeId: item.placeId || "",
          description: item.description || item.text || "",
          mainText: item.mainText || item.text || item.description || "",
          secondaryText: item.secondaryText || "",
          text: item.text || item.description || "",
        }))
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        return data.suggestions.map((item: Record<string, any>) => ({
          placeId: item.placeId || "",
          description: item.description || item.text || "",
          mainText: item.mainText || item.text || item.description || "",
          secondaryText: item.secondaryText || "",
          text: item.text || item.description || "",
        }))
      } else if (data.predictions && Array.isArray(data.predictions)) {
        // Handle proxy server format that might still use Google Places API format
        return data.predictions.map((item: Record<string, any>) => ({
          placeId: item.place_id || "",
          description: item.description || "",
          mainText: item.structured_formatting?.main_text || item.description || "",
          secondaryText: item.structured_formatting?.secondary_text || "",
          text: item.description || "",
        }))
      } else {
        console.warn("Unexpected autocomplete response format:", data)
        return []
      }
    } catch (error) {
      console.error("Autocomplete error:", error)
      return []
    }
  },

  /**
   * Geocode an address to latitude and longitude
   */
  geocodeAddress: async (address: string, province?: string): Promise<GeocodingResult> => {
    if (!address || address.trim().length < 3) {
      console.warn("Address too short for geocoding:", address)
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }

    try {
      console.log(`Geocoding address: "${address}"${province ? ` in ${province}` : ""}`)

      // For debugging - log the exact request being sent
      const payload = province ? { address, region: province } : { address }
      console.log("Sending geocode request with payload:", JSON.stringify(payload))

      // Use a more reliable approach with explicit error handling
      let response
      try {
        response = await fetch(ENDPOINTS.MAPS.GEOCODE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000), // Increased timeout
        })
      } catch (fetchError) {
        console.error("Network error during geocoding fetch:", fetchError)
        throw new Error(
          `Network error during geocoding: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        )
      }

      if (!response.ok) {
        console.error(`Geocoding failed with status: ${response.status}`)
        throw new Error(`Geocoding failed with status: ${response.status}`)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing geocoding response:", jsonError)
        throw new Error("Invalid response format from geocoding service")
      }

      console.log("Geocoding result:", data)

      // Validate the response data
      if (!data || (data.latitude === undefined && data.lat === undefined)) {
        console.error("Invalid geocoding response format:", data)
        throw new Error("Invalid geocoding response format")
      }

      // Handle different response formats
      const latitude = data.latitude !== undefined ? data.latitude : data.lat
      const longitude = data.longitude !== undefined ? data.longitude : data.lng

      // Return the geocoding result
      return {
        address,
        latitude: latitude || 0,
        longitude: longitude || 0,
        formattedAddress: data.formattedAddress || data.formatted_address || address,
        placeId: data.placeId || data.place_id,
      }
    } catch (error: any) {
      console.error(`Geocoding error for address "${address}":`, error)

      // Return a placeholder result with original address but no coordinates
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }
  },

  /**
   * Get distance and duration between two points
   */
  getDistanceMatrix: async (
    fromAddress: string,
    toAddress: string,
  ): Promise<{
    distance: { text: string; value: number }
    duration: { text: string; value: number }
  }> => {
    try {
      const response = await fetch(ENDPOINTS.MAPS.DISTANCE_MATRIX, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromAddress, toAddress }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`Distance matrix failed with status: ${response.status}`)
      }

      const data = await response.json()

      return {
        distance: {
          text: data.distance?.text || "0 km",
          value: data.distance?.value || 0,
        },
        duration: {
          text: data.duration?.text || "0 mins",
          value: data.duration?.value || 0,
        },
      }
    } catch (error) {
      console.error("Distance matrix error:", error)
      return {
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },

  /**
   * Get directions between two points
   */
  getDirections: async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    waypoints?: Array<{ lat: number; lng: number } | string>, // Currently unused but kept for future implementation
  ): Promise<any> => {
    // Changed return type to any to accommodate different response formats
    // Convert coordinates to addresses if needed
    const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
    const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

    try {
      // Call the actual route API
      const response = await fetch(ENDPOINTS.MAPS.DIRECTIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          waypoints: waypoints?.map((wp) => (typeof wp === "string" ? wp : `${wp.lat},${wp.lng}`)),
        }),
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      if (!response.ok) {
        throw new Error(`Directions failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Directions API response:", data)

      // Return the raw data to handle different response formats
      return data
    } catch (error) {
      console.error("Directions error:", error)
      return {
        path: [],
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },

  // Add a new function to get nearby locations based on user's location
  /**
   * Get nearby locations based on a reference point
   */
  getNearbyLocations: async (
    location: { lat: number; lng: number } | string,
    radius = 5000, // Default 5km radius
    type = "point_of_interest", // Default to points of interest
    maxResults = 10,
  ): Promise<
    Array<{
      name: string
      address: string
      latitude: number
      longitude: number
      distance: number
      placeId?: string
    }>
  > => {
    try {
      // Convert location to string format if it's coordinates
      const locationStr = typeof location === "string" ? location : `${location.lat},${location.lng}`

      console.log(`Fetching nearby locations around: ${locationStr}`)

      const response = await fetch(
        `${ENDPOINTS.MAPS.NEARBY}?location=${encodeURIComponent(locationStr)}&radius=${radius}&type=${type}&maxResults=${maxResults}`,
        {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        },
      )

      if (!response.ok) {
        throw new Error(`Nearby search failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Nearby locations response:", data)

      // Handle different response formats
      if (Array.isArray(data)) {
        return data.map((place) => ({
          name: place.name || "Unnamed Location",
          address: place.address || place.vicinity || "",
          latitude: place.latitude || place.lat || 0,
          longitude: place.longitude || place.lng || 0,
          distance: place.distance || 0,
          placeId: place.placeId || place.place_id || "",
        }))
      } else if (data.results && Array.isArray(data.results)) {
        return data.results.map((place: any) => ({
          name: place.name || "Unnamed Location",
          address: place.address || place.vicinity || "",
          latitude: place.geometry?.location?.lat || place.latitude || 0,
          longitude: place.geometry?.location?.lng || place.longitude || 0,
          distance: place.distance || 0,
          placeId: place.place_id || place.placeId || "",
        }))
      }

      return []
    } catch (error) {
      console.error("Error fetching nearby locations:", error)
      return []
    }
  },

  /**
   * Check if a route is possible between two points
   */
  isRoutePossible: async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
  ): Promise<boolean> => {
    try {
      // Convert coordinates to addresses if needed
      const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
      const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

      // Call the route API
      const response = await fetch(ENDPOINTS.MAPS.DIRECTIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromAddress, toAddress }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      // If we have a path with at least 2 points, a route is possible
      return Array.isArray(data.path) && data.path.length >= 2
    } catch (error) {
      console.error("Error checking route possibility:", error)
      return false
    }
  },

  /**
   * Get locations within a province or region
   */
  getLocationsInRegion: async (
    regionName: string,
    maxResults = 10,
  ): Promise<
    Array<{
      name: string
      address: string
      latitude: number
      longitude: number
      placeId?: string
    }>
  > => {
    try {
      console.log(`Fetching locations in region: ${regionName}`)

      const response = await fetch(
        `${ENDPOINTS.MAPS.REGION}?name=${encodeURIComponent(regionName)}&maxResults=${maxResults}`,
        {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        },
      )

      if (!response.ok) {
        throw new Error(`Region search failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Region locations response:", data)

      // Handle different response formats
      if (Array.isArray(data)) {
        return data.map((place) => ({
          name: place.name || "Unnamed Location",
          address: place.address || place.formatted_address || "",
          latitude: place.latitude || place.geometry?.location?.lat || 0,
          longitude: place.longitude || place.geometry?.location?.lng || 0,
          placeId: place.placeId || place.place_id || "",
        }))
      } else if (data.results && Array.isArray(data.results)) {
        return data.results.map((place: any) => ({
          name: place.name || "Unnamed Location",
          address: place.address || place.formatted_address || "",
          latitude: place.geometry?.location?.lat || place.latitude || 0,
          longitude: place.geometry?.location?.lng || place.longitude || 0,
          placeId: place.place_id || place.placeId || "",
        }))
      }

      return []
    } catch (error) {
      console.error("Error fetching locations in region:", error)
      return []
    }
  },
}

