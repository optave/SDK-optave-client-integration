// Generated from AsyncAPI specification
// DO NOT EDIT - This file is auto-generated from Optave Client WebSocket API v3.2.1

// Auth transport types derived from security schemes
export type AuthTransport = 'subprotocol' | 'query' | 'oauth2';

// Server configuration derived from AsyncAPI servers
export interface GeneratedClientConfig {
  // WebSocket server: wss://{wsEnv}.oco.optave.tech/
  websocketUrl: string;

  // Auth server: https://{authEnv}.oco.optave.tech/auth/oauth2 (base URL, SDK appends /token)
  authUrl: string;

  // Supported authentication transports
  supportedAuthTransports: AuthTransport[];


}

// Default configuration values
export const DEFAULT_CONFIG: GeneratedClientConfig = {
  websocketUrl: 'wss://{wsEnv}.oco.optave.tech/',
  authUrl: 'https://{authEnv}.oco.optave.tech/auth/oauth2', // Base URL - SDK will append /token
  supportedAuthTransports: ['subprotocol', 'query', 'oauth2'],

};

// OAuth2 token URL for client credentials flow (uses same server as auth)
export const OAUTH2_TOKEN_URL = DEFAULT_CONFIG.authUrl;

// Environment variable mappings for server URLs
export const SERVER_ENVIRONMENTS = {
  websocket: {
    wsEnv: {
      default: 'ws-incubator',
      examples: ['ws-incubator', 'ws-sandbox', 'ws-prod']
    }
  },
  auth: {
    authEnv: {
      default: 'incubator',
      examples: ['incubator', 'sandbox', 'prod']
    }
  }
};


// Helper function to build WebSocket URL with environment
export function buildWebSocketUrl(environment: string = SERVER_ENVIRONMENTS.websocket.wsEnv?.default): string {
  return DEFAULT_CONFIG.websocketUrl.replace('{wsEnv}', environment);
}

// Helper function to build Auth URL with environment
export function buildAuthUrl(environment: string = SERVER_ENVIRONMENTS.auth.authEnv?.default): string {
  return DEFAULT_CONFIG.authUrl.replace('{authEnv}', environment);
}