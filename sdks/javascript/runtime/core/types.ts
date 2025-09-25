// TypeScript type definitions for the Optave Client SDK
// Using manual type definitions to avoid broken generated files

export type AuthTransport = 'subprotocol' | 'query';
export interface GeneratedClientConfig {
    websocketUrl: string;
    authUrl: string;
    supportedAuthTransports: AuthTransport[];
    OptaveTraceChatSessionId?: string;
}

// Logger interface for SDK operations
export type Logger = {
  debug: Function;
  info: Function;
  warn: Function;
  error: Function;
};

// SDK Options that extend generated connection config
export type Opts = GeneratedClientConfig & {
  // Token provider for authentication (client environments)
  tokenProvider?: () => string | Promise<string>;

  // Authentication transport method (default: 'subprotocol')
  authTransport?: AuthTransport;

  // Server-only authentication options (Client Credentials Grant)
  authenticationUrl?: string;    // Override default auth URL
  clientId?: string;            // OAuth2 client ID
  clientSecret?: string;        // OAuth2 client secret (server only!)

  // SDK behavior options
  strictValidation?: boolean;   // Enable strict payload validation
  requestTimeoutMs?: number;    // Request timeout in milliseconds
  logger?: Logger;              // Custom logger instance

  // Tenant/organization options
  tenantId?: string;           // Tenant identifier
  organizationId?: string;     // Organization identifier

  // Development/debugging options
  debug?: boolean;             // Enable debug logging
  retryAttempts?: number;      // Number of retry attempts
  retryDelay?: number;         // Delay between retries (ms)
};

// WebSocket connection types
export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  headers?: Record<string, string>;
}

// Authentication types
export interface AuthTokenResponse {
  token: string;
  expiresAt: number;
  tokenType?: string;
}

export interface AuthCredentials {
  clientId: string;
  clientSecret: string;
}


// Message envelope types
export interface MessageEnvelope {
  headers: {
    correlationId: string;
    traceId: string;
    schemaRef: string;
  };
  payload: any;
}

// Event types for EventEmitter
export interface SdkEvents {
  'connection:open': () => void;
  'connection:close': (code: number, reason: string) => void;
  'connection:error': (error: Error) => void;
  'message:received': (message: MessageEnvelope) => void;
  'message:sent': (message: MessageEnvelope) => void;
}

// Main SDK class declaration
export declare class OptaveJavaScriptSDK {
  constructor(options: Opts);

  // Core methods
  authenticate(): Promise<string>;
  openConnection(token?: string): Promise<void>;
  validate(payload: any): boolean;

  // Action methods
  adjust(params: any): Promise<any>;
  elevate(params: any): Promise<any>;
  customerInteraction(params: any): Promise<any>;
  interaction(params: any): Promise<any>;
  reception(params: any): Promise<any>;
  summarize(params: any): Promise<any>;
  translate(params: any): Promise<any>;
  recommend(params: any): Promise<any>;
  insights(params: any): Promise<any>;

  // Connection management
  disconnect(): void;
  isConnected(): boolean;

  // Event handling (extends EventEmitter)
  on(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
}