import axios from "axios"
import { API_CONFIG, ENDPOINTS } from "../config/api-config"

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface ServiceTokenConfig {
  clientId: string
  clientSecret: string
  scopes: string[]
}

interface CachedToken {
  token: string
  expiresAt: number
}

const SERVICE_CONFIGS: Record<string, ServiceTokenConfig> = API_CONFIG.SERVICES

class TokenService {
  private tokenCache: Record<string, CachedToken> = {}
  private tokenRequests: Record<string, Promise<string>> = {}
  private identityServerUrl: string

  constructor() {
    this.identityServerUrl = `${ENDPOINTS.TOKEN.NEW}`
  }

  /**
   * Get a service token for accessing protected microservices
   * This uses OAuth2 client credentials flow
   */
  public async getServiceToken(serviceName: string): Promise<string> {
    // Check cache first
    const cachedToken = this.tokenCache[serviceName]
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
      console.log(`Using cached token for ${serviceName} service`)
      return cachedToken.token
    }

    // If there's an ongoing request for this token, wait for it
    if (await this.tokenRequests[serviceName]) {
      console.log(`Waiting for existing token request for ${serviceName} service`)
      return this.tokenRequests[serviceName]
    }

    // Start a new token request
    const tokenPromise = this.fetchNewToken(serviceName)
    this.tokenRequests[serviceName] = tokenPromise

    try {
      const token = await tokenPromise
      return token
    } finally {
      // Clean up the request reference
      if (this.tokenRequests[serviceName] === tokenPromise) {
        delete this.tokenRequests[serviceName]
      }
    }
  }

  /**
   * Fetch a new service token using client credentials flow
   */
  private async fetchNewToken(serviceName: string): Promise<string> {
    const config = SERVICE_CONFIGS[serviceName]
    if (!config) {
      throw new Error(`No configuration found for service: ${serviceName}`)
    }

    try {
      console.log(`Fetching new token for ${serviceName} service`)

      // Create form data for token request
      const params = new URLSearchParams()
      params.append("grant_type", "client_credentials")
      params.append("client_id", config.clientId)
      params.append("client_secret", config.clientSecret)
      params.append("scope", config.scopes.join(" "))

      console.log(`Token request URL: ${this.identityServerUrl}`)
      console.log(`Token request params: ${params.toString()}`)

      // Make the request to the identity server
      const response = await axios.post<TokenResponse>(this.identityServerUrl, params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })

      // Extract token information
      const { access_token, expires_in } = response.data
      const expiresAt = Date.now() + expires_in * 1000

      // Cache the token
      this.tokenCache[serviceName] = {
        token: access_token,
        expiresAt,
      }

      console.log(`Successfully obtained token for ${serviceName} service`)
      return access_token
    } catch (error) {
      console.error(`Error fetching token for ${serviceName}:`, error)
      if (axios.isAxiosError(error)) {
        console.error(`Status: ${error.response?.status}, Data:`, error.response?.data)
      }
      throw error
    }
  }

  /**
   * Clear a specific service token from cache
   */
  public clearServiceToken(serviceName: string): void {
    delete this.tokenCache[serviceName]
  }

  /**
   * Clear all cached tokens
   */
  public clearAllTokens(): void {
    this.tokenCache = {}
  }
}

export const tokenService = new TokenService()

