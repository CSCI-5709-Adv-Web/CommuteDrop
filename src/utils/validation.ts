/**
 * Utility functions for form validation
 */

/**
 * Check if a location is valid (has address and coordinates)
 * @param address The address string
 * @param coordinates The coordinates object
 * @returns Boolean indicating if location is valid
 */
export function isValidLocation(address: string, coordinates?: { lat: number; lng: number }): boolean {
  return address.trim().length > 0 && !!coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng)
}

/**
 * Check if a weight value is valid
 * @param weight The weight string
 * @returns Boolean indicating if weight is valid
 */
export function isValidWeight(weight: string): boolean {
  const weightNum = Number.parseFloat(weight)
  return !isNaN(weightNum) && weightNum > 0
}

/**
 * Check if a carrier type is valid
 * @param carrier The carrier type
 * @param validCarriers Array of valid carrier types
 * @returns Boolean indicating if carrier is valid
 */
export function isValidCarrier(carrier: string, validCarriers: string[] = ["car", "truck", "bike", "walk"]): boolean {
  return validCarriers.includes(carrier)
}

/**
 * Validate a complete delivery form
 * @param formData The delivery form data
 * @returns Object with validation result and error messages
 */
export function validateDeliveryForm(formData: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate pickup location
  if (!isValidLocation(formData.pickup, formData.pickupCoordinates)) {
    errors.pickup = "Please enter a valid pickup location"
  }

  // Validate dropoff location
  if (!isValidLocation(formData.dropoff, formData.dropoffCoordinates)) {
    errors.dropoff = "Please enter a valid dropoff location"
  }

  // Validate weight if provided
  if (formData.weight && !isValidWeight(formData.weight)) {
    errors.weight = "Please enter a valid weight"
  }

  // Validate carrier
  if (!isValidCarrier(formData.carrier)) {
    errors.carrier = "Please select a valid carrier type"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

