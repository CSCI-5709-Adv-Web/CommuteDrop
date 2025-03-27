import { tokenService } from "./token-service"
import { mapService } from "./map-service"

export const serviceFactory = {
    getTokenService: () => tokenService,
    getMapService: () => mapService,
}

