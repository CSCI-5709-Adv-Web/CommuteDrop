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

// Update the base URL for location service
const LOCATION_SERVICE_URL = "http://localhost:5001/api/location"

// Updated service to use the actual proxy server API endpoints without caching
export const mapService = {
  /**
   * Get address suggestions for autocomplete
   */
  getAddressSuggestions: async (text: string, maxResults = 5): Promise<AutocompleteResult[]> => {
    if (!text.trim()) return []

    try {
      console.log("Fetching address suggestions for:", text)

      const response = await fetch(
        `${LOCATION_SERVICE_URL}/autocomplete?text=${encodeURIComponent(text)}&maxResults=${maxResults}`,
        {
          signal: AbortSignal.timeout(3000), // 3 second timeout
        },
      )

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
        // Handle Google Places API format
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
  geocodeAddress: async (address: string): Promise<GeocodingResult> => {
    if (!address || address.trim().length < 3) {
      console.warn("Address too short for geocoding:", address)
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }

    try {
      console.log(`Geocoding address: "${address}"`)

      // For debugging - log the exact request being sent
      console.log("Sending geocode request with payload:", JSON.stringify({ address }))

      // Use a more reliable approach with explicit error handling
      let response
      try {
        response = await fetch(`${LOCATION_SERVICE_URL}/geocode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address }),
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
      const response = await fetch(`${LOCATION_SERVICE_URL}/matrix`, {
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
    waypoints?: Array<{ lat: number; lng: number } | string>,
  ): Promise<Route> => {
    // Convert coordinates to addresses if needed
    const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
    const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

    try {
      // Call the actual route API
      const response = await fetch(`${LOCATION_SERVICE_URL}/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromAddress, toAddress }),
        signal: AbortSignal.timeout(8000), // 8 second timeout
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
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },
}

