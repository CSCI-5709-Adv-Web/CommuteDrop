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

// Updated service to use mock data for development and avoid direct API calls
export const mapService = {
  /**
   * Geocode an address to latitude and longitude
   */
  geocodeAddress: async (address: string): Promise<GeocodingResult> => {
    try {
      // For development: Use mock geocoding data for common locations
      const mockLocations: Record<string, { lat: number; lng: number }> = {
        "quinpool tower": { lat: 44.6454, lng: -63.5918 },
        "dalhousie dentistry faculty practice": { lat: 44.6366, lng: -63.585 },
        "halifax shopping centre": { lat: 44.6497, lng: -63.6108 },
        "halifax central library": { lat: 44.6434, lng: -63.5775 },
        "point pleasant park": { lat: 44.6228, lng: -63.5686 },
        "halifax citadel": { lat: 44.6478, lng: -63.5804 },
        "halifax waterfront": { lat: 44.6476, lng: -63.5683 },
        dartmouth: { lat: 44.6658, lng: -63.5669 },
        bedford: { lat: 44.7325, lng: -63.6556 },
        "downtown halifax": { lat: 44.6488, lng: -63.5752 },
      }

      // Normalize the address for lookup
      const normalizedAddress = address.toLowerCase().trim()

      // Find a matching location or return a default location with slight randomization
      for (const [key, location] of Object.entries(mockLocations)) {
        if (normalizedAddress.includes(key)) {
          return {
            address,
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress: address,
          }
        }
      }

      // In production, you would use a server-side proxy endpoint
      // const response = await axios.get(`${API_CONFIG.BASE_URL}/maps/geocode`, {
      //   params: { address }
      // });
      // return response.data;

      // For development: Return a random location in Halifax if no match
      return {
        address,
        latitude: 44.6488 + (Math.random() * 0.02 - 0.01),
        longitude: -63.5752 + (Math.random() * 0.02 - 0.01),
        formattedAddress: address,
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
      // In production, you would use a server-side proxy endpoint
      // const response = await axios.get(`${API_CONFIG.BASE_URL}/maps/reverse-geocode`, {
      //   params: { lat: latitude, lng: longitude }
      // });
      // return response.data;

      // For development: Return mock data
      return {
        address: "Mock Address for " + latitude.toFixed(4) + ", " + longitude.toFixed(4),
        latitude,
        longitude,
        formattedAddress: "Mock Address, Halifax, NS",
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
      // In production, you would use a server-side proxy endpoint
      // const response = await axios.get(`${API_CONFIG.BASE_URL}/maps/distance-matrix`, {
      //   params: {
      //     origins: JSON.stringify(origins),
      //     destinations: JSON.stringify(destinations)
      //   }
      // });
      // return response.data;

      // For development: Calculate rough distance and return mock data
      const origin =
        typeof origins[0] === "string"
          ? { lat: 44.6488, lng: -63.5752 } // Default Halifax coordinates
          : (origins[0] as { lat: number; lng: number })

      const destination =
        typeof destinations[0] === "string"
          ? { lat: 44.6366, lng: -63.585 } // Default Dalhousie coordinates
          : (destinations[0] as { lat: number; lng: number })

      // Calculate rough distance in meters (very simplified)
      const distance = Math.sqrt(
        Math.pow((origin.lat - destination.lat) * 111000, 2) + Math.pow((origin.lng - destination.lng) * 85000, 2),
      )

      // Estimate duration (assuming 30 km/h average speed)
      const duration = (distance / 30) * 3.6

      return {
        distance: {
          text: `${(distance / 1000).toFixed(1)} km`,
          value: Math.round(distance),
        },
        duration: {
          text: `${Math.round(duration)} mins`,
          value: Math.round(duration * 60),
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
      // In production, you would use a server-side proxy endpoint
      // const response = await axios.get(`${API_CONFIG.BASE_URL}/maps/directions`, {
      //   params: {
      //     origin: JSON.stringify(origin),
      //     destination: JSON.stringify(destination),
      //     waypoints: waypoints ? JSON.stringify(waypoints) : undefined
      //   }
      // });
      // return response.data;

      // For development: Generate a simple straight line path
      const originPoint =
        typeof origin === "string"
          ? { lat: 44.6488, lng: -63.5752 } // Default Halifax coordinates
          : origin

      const destinationPoint =
        typeof destination === "string"
          ? { lat: 44.6366, lng: -63.585 } // Default Dalhousie coordinates
          : destination

      // Create a simple path with 5 points between origin and destination
      const path = [originPoint]

      for (let i = 1; i < 5; i++) {
        path.push({
          lat: originPoint.lat + (destinationPoint.lat - originPoint.lat) * (i / 5),
          lng: originPoint.lng + (destinationPoint.lng - originPoint.lng) * (i / 5),
        })
      }

      path.push(destinationPoint)

      // Calculate rough distance
      const distance = Math.sqrt(
        Math.pow((originPoint.lat - destinationPoint.lat) * 111000, 2) +
          Math.pow((originPoint.lng - destinationPoint.lng) * 85000, 2),
      )

      // Estimate duration (assuming 30 km/h average speed)
      const duration = (distance / 30) * 3.6

      return {
        path,
        distance: {
          text: `${(distance / 1000).toFixed(1)} km`,
          value: Math.round(distance),
        },
        duration: {
          text: `${Math.round(duration)} mins`,
          value: Math.round(duration * 60),
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

