import { tokenService } from "./token-service"
import { mapService } from "./map-service"

export const serviceFactory = {
  getTokenService: () => tokenService,
  getMapService: () => mapService,
  // Add other services as needed
  // getOrderService: () => orderService,
  // getDeliveryService: () => deliveryService,
}

