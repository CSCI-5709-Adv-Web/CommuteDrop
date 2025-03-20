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

// Updated service to use proxy server API endpoints
export const mapService = {
  /**
   * Geocode an address to latitude and longitude
   */
  geocodeAddress: async (address: string): Promise<GeocodingResult> => {
    try {
      console.log("Geocoding address:", address)

      // Call the proxy server API endpoint
      const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`)

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
   * Reverse geocode latitude and longitude to address
   */
  reverseGeocode: async (latitude: number, longitude: number): Promise<GeocodingResult> => {
    try {
      // Call the proxy server API endpoint
      const response = await fetch(`/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`)

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status: ${response.status}`)
      }

      const data = await response.json()

      return {
        address: data.address || "Unknown location",
        latitude,
        longitude,
        formattedAddress: data.formattedAddress,
        placeId: data.placeId,
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return {
        address: "Unknown location",
        latitude,
        longitude,
      }
    }
  },

  /**
   * Get distance and duration between two points
   */
  getDistanceMatrix: async (
    origins: Array<{ lat: number; lng: number } | string>,
    destinations: Array<{ lat: number; lng: number } | string>,
  ): Promise<{
    distance: { text: string; value: number }
    duration: { text: string; value: number }
  }> => {
    try {
      // Format origins and destinations for the API
      const originsParam = origins
        .map((origin) => (typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`))
        .join("|")

      const destinationsParam = destinations
        .map((dest) => (typeof dest === "string" ? dest : `${dest.lat},${dest.lng}`))
        .join("|")

      // Call the proxy server API endpoint
      const response = await fetch(
        `/api/maps/distance-matrix?origins=${encodeURIComponent(originsParam)}&destinations=${encodeURIComponent(destinationsParam)}`,
      )

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
      // Format origin, destination and waypoints for the API
      const originParam = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
      const destinationParam = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

      let waypointsParam = ""
      if (waypoints && waypoints.length > 0) {
        waypointsParam = waypoints.map((wp) => (typeof wp === "string" ? wp : `${wp.lat},${wp.lng}`)).join("|")
      }

      // Build the URL with query parameters
      let url = `/api/maps/directions?origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destinationParam)}`
      if (waypointsParam) {
        url += `&waypoints=${encodeURIComponent(waypointsParam)}`
      }

      // Call the proxy server API endpoint
      const response = await fetch(url)

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

  /**
   * Helper function to decode Google's encoded polyline format
   */
  decodePath(encoded: string): Array<{ lat: number; lng: number }> {
    if (!encoded) {
      return []
    }

    const points: Array<{ lat: number; lng: number }> = []
    let index = 0,
      lat = 0,
      lng = 0

    while (index < encoded.length) {
      let b,
        shift = 0,
        result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlat = result & 1 ? ~(result >> 1) : result >> 1
      lat += dlat

      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlng = result & 1 ? ~(result >> 1) : result >> 1
      lng += dlng

      points.push({
        lat: lat * 1e-5,
        lng: lng * 1e-5,
      })
    }

    return points
  },
}

