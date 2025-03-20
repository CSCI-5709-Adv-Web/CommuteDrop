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

export interface AutocompleteResult {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

// Update the base URL for location service
const LOCATION_SERVICE_URL = "http://localhost:5001/api/location"

// Updated service to use the actual proxy server API endpoints
export const mapService = {
  /**
   * Get address suggestions for autocomplete
   */
  getAddressSuggestions: async (text: string, maxResults = 5): Promise<AutocompleteResult[]> => {
    try {
      const response = await fetch(
        `${LOCATION_SERVICE_URL}/autocomplete?text=${encodeURIComponent(text)}&maxResults=${maxResults}`,
      )

      if (!response.ok) {
        throw new Error(`Autocomplete failed with status: ${response.status}`)
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (error) {
      console.error("Autocomplete error:", error)
      return []
    }
  },

  /**
   * Geocode an address to latitude and longitude
   */
  geocodeAddress: async (address: string): Promise<GeocodingResult> => {
    try {
      console.log("Geocoding address:", address)

      // Call the actual location service endpoint
      const response = await fetch(`${LOCATION_SERVICE_URL}/geocode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        console.error(`Geocoding failed with status: ${response.status}`)
        throw new Error(`Geocoding failed with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Geocoding result:", data)

      // Return the geocoding result
      return {
        address,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        formattedAddress: data.formattedAddress || address,
        placeId: data.placeId,
      }
    } catch (error: any) {
      console.error("Geocoding error:", error)
      // Return a placeholder result with original address
      return {
        address,
        latitude: 44.6488, // Default to Halifax coordinates
        longitude: -63.5752,
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
      const response = await fetch(`${LOCATION_SERVICE_URL}/matrix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromAddress, toAddress }),
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
        distance: { text: "3.2 km", value: 3200 },
        duration: { text: "10 mins", value: 600 },
      }
    }
  },

  /**
   * Get directions between two points
   */
  getDirections: async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    waypoints?: Array<{ lat: number; lng: number } | string>,
  ): Promise<Route> => {
    try {
      // Convert coordinates to addresses if needed
      const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`

      const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

      // Call the actual route API
      const response = await fetch(`${LOCATION_SERVICE_URL}/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromAddress, toAddress }),
      })

      if (!response.ok) {
        throw new Error(`Directions failed with status: ${response.status}`)
      }

      const data = await response.json()

      return {
        path: data.path || [],
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
      console.error("Directions error:", error)
      return {
        path: [],
        distance: { text: "3.2 km", value: 3200 },
        duration: { text: "10 mins", value: 600 },
      }
    }
  },
}

