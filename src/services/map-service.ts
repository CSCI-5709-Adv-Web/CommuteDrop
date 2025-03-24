const geocodeCache: Record<string, GeocodingResult> = {}

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
    value: number
  }
  duration: {
    text: string
    value: number
  }
}

export interface AutocompleteResult {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
  text?: string
}

interface DetectedLocation {
  city: string
  province: string
  country: string
}

let detectedLocation: DetectedLocation | null = null

const detectUserLocation = async (): Promise<DetectedLocation> => {
  if (detectedLocation) {
    return detectedLocation
  }

  const defaultLocation: DetectedLocation = {
    city: "Halifax",
    province: "Nova Scotia",
    country: "Canada",
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        })
      } else {
        reject(new Error("Geolocation not supported"))
      }
    })

    const { latitude, longitude } = position.coords

    const response = await fetch(`${ENDPOINTS.MAPS.REVERSE_GEOCODE}?lat=${latitude}&lng=${longitude}`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status: ${response.status}`)
    }

    const data = await response.json()

    const location: DetectedLocation = {
      city:
        data.city ||
        data.address?.city ||
        data.address_components?.find((c: any) => c.types.includes("locality") || c.types.includes("sublocality"))
          ?.long_name ||
        defaultLocation.city,

      province:
        data.province ||
        data.state ||
        data.address?.province ||
        data.address?.state ||
        data.address_components?.find((c: any) => c.types.includes("administrative_area_level_1"))?.long_name ||
        defaultLocation.province,

      country:
        data.country ||
        data.address?.country ||
        data.address_components?.find((c: any) => c.types.includes("country"))?.long_name ||
        defaultLocation.country,
    }

    detectedLocation = location
    return location
  } catch (error) {
    detectedLocation = defaultLocation
    return defaultLocation
  }
}

export const mapService = {
  getAddressSuggestions: async (
    text: string,
    maxResults = 5,
    language = "en",
    locationBias?: { lat: number; lng: number },
  ): Promise<AutocompleteResult[]> => {
    if (!text.trim()) return []

    try {
      const location = await detectUserLocation()

      const hasCity = text.toLowerCase().includes(location.city.toLowerCase())
      const hasProvince = text.toLowerCase().includes(location.province.toLowerCase())
      const hasCountry = text.toLowerCase().includes(location.country.toLowerCase())

      let searchText = text

      if (
        !hasCity &&
        !searchText.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)
      ) {
        searchText = `${searchText}, ${location.city}`
      }

      if (!hasProvince) {
        searchText = `${searchText}, ${location.province}`
      }

      if (!hasCountry) {
        searchText = `${searchText}, ${location.country}`
      }

      let url = `${ENDPOINTS.MAPS.AUTOCOMPLETE}?text=${encodeURIComponent(searchText)}`

      if (maxResults) {
        url += `&maxResults=${maxResults}`
      }

      url += `&language=${encodeURIComponent(language)}`

      if (language === "en") {
        url += "&region=US"
      }

      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: {
          "Accept-Language": language,
        },
      })

      if (!response.ok) {
        throw new Error(`Autocomplete failed with status: ${response.status}`)
      }

      const data = await response.json()

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
        return data.predictions.map((item: Record<string, any>) => ({
          placeId: item.place_id || "",
          description: item.description || "",
          mainText: item.structured_formatting?.main_text || item.description || "",
          secondaryText: item.structured_formatting?.secondary_text || "",
          text: item.description || "",
        }))
      } else {
        return []
      }
    } catch (error) {
      return []
    }
  },

  geocodeAddress: async (address: string, province?: string): Promise<GeocodingResult> => {
    if (!address || address.trim().length < 3) {
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }

    try {
      const isCoordinatePair = address.match(
        /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
      )

      let addressWithContext = address

      if (!isCoordinatePair) {
        const location = await detectUserLocation()

        const hasCity = address.toLowerCase().includes(location.city.toLowerCase())
        const hasProvince = address.toLowerCase().includes(location.province.toLowerCase())
        const hasCountry = address.toLowerCase().includes(location.country.toLowerCase())

        if (!hasCity) {
          addressWithContext = `${addressWithContext}, ${location.city}`
        }

        if (!hasProvince) {
          addressWithContext = `${addressWithContext}, ${location.province}`
        }

        if (!hasCountry) {
          addressWithContext = `${addressWithContext}, ${location.country}`
        }
      }

      const cacheKey = `${addressWithContext}|${province || ""}`

      if (geocodeCache[cacheKey]) {
        return geocodeCache[cacheKey]
      }

      const payload = { address: addressWithContext }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(ENDPOINTS.MAPS.GEOCODE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Geocoding failed with status: ${response.status}`)
        }

        const data = await response.json()

        if (!data || (data.latitude === undefined && data.lat === undefined)) {
          throw new Error("Invalid geocoding response format")
        }

        const latitude = data.latitude !== undefined ? data.latitude : data.lat
        const longitude = data.longitude !== undefined ? data.longitude : data.lng

        const result = {
          address,
          latitude: latitude || 0,
          longitude: longitude || 0,
          formattedAddress: data.formattedAddress || data.formatted_address || address,
          placeId: data.placeId || data.place_id,
        }

        if (latitude !== 0 && longitude !== 0) {
          geocodeCache[cacheKey] = result
        }

        return result
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Geocoding request timed out")
        }

        throw new Error(
          `Network error during geocoding: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        )
      }
    } catch (error: any) {
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }
  },

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
        signal: AbortSignal.timeout(5000),
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
      return {
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },

  getDirections: async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    waypoints?: Array<{ lat: number; lng: number } | string>,
  ): Promise<any> => {
    const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
    const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

    try {
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
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        throw new Error(`Directions failed with status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return {
        path: [],
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },

  getNearbyLocations: async (
    location: { lat: number; lng: number } | string,
    radius = 5000,
    type = "point_of_interest",
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
      const locationStr = typeof location === "string" ? location : `${location.lat},${location.lng}`
      return []
    } catch (error) {
      return []
    }
  },

  isRoutePossible: async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
  ): Promise<boolean> => {
    try {
      const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
      const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

      const response = await fetch(ENDPOINTS.MAPS.DIRECTIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromAddress, toAddress }),
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return Array.isArray(data.path) && data.path.length >= 2
    } catch (error) {
      return false
    }
  },

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
      return []
    } catch (error) {
      return []
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(ENDPOINTS.MAPS.HEALTH, {
        signal: AbortSignal.timeout(3000),
      })

      return response.ok
    } catch (error) {
      return false
    }
  },
}

