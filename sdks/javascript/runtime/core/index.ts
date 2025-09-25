// Main entry point for the Optave Client SDK
// This will be the primary export for the runtime library

// Export TypeScript types and interfaces
export * from './types';

// Manual export for generated config types to avoid broken import
export type AuthTransport = 'subprotocol' | 'query';
export interface GeneratedClientConfig {
    websocketUrl: string;
    authUrl: string;
    supportedAuthTransports: AuthTransport[];
    OptaveTraceChatSessionId?: string;
}

// Pure function-based approach for better tree-shaking
export const createDefaultConfig = (): GeneratedClientConfig => ({
    websocketUrl: 'wss://default.oco.optave.tech/',
    authUrl: 'https://default.oco.optave.tech/auth/oauth2/',
    supportedAuthTransports: ['subprotocol', 'query'],
    OptaveTraceChatSessionId: undefined
});

// Keep constant export for backwards compatibility
export const DEFAULT_CONFIG: GeneratedClientConfig = createDefaultConfig();

// Pure object for environments - frozen for immutability
export const SERVER_ENVIRONMENTS = {
    websocket: {
        wsEnv: {
            default: 'default',
            examples: ['default', 'staging', 'production']
        }
    },
    auth: {
        authEnv: {
            default: 'default',
            examples: ['default', 'staging', 'production']
        }
    }
} as const;

export function buildWebSocketUrl(environment?: string): string {
    const env = environment || 'default';
    return `wss://${env}.oco.optave.tech/`;
}

export function buildAuthUrl(environment?: string): string {
    const env = environment || 'default';
    return `https://${env}.oco.optave.tech/auth/oauth2/`;
}

// Re-export SDK class type (implementation will be in JavaScript)
export { OptaveJavaScriptSDK } from './types';

// Re-export OAuth2 token URL from generated config
export { OAUTH2_TOKEN_URL } from '../../generated/connection-config';