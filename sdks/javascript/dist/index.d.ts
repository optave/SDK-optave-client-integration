type AuthTransport$1 = 'subprotocol' | 'query';
interface GeneratedClientConfig$1 {
    websocketUrl: string;
    authUrl: string;
    supportedAuthTransports: AuthTransport$1[];
    OptaveTraceChatSessionId?: string;
}
type Logger = {
    debug: Function;
    info: Function;
    warn: Function;
    error: Function;
};
type Opts = GeneratedClientConfig$1 & {
    tokenProvider?: () => string | Promise<string>;
    authTransport?: AuthTransport$1;
    authenticationUrl?: string;
    clientId?: string;
    clientSecret?: string;
    strictValidation?: boolean;
    requestTimeoutMs?: number;
    logger?: Logger;
    tenantId?: string;
    organizationId?: string;
    debug?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
};
interface WebSocketOptions {
    url: string;
    protocols?: string | string[];
    headers?: Record<string, string>;
}
interface AuthTokenResponse {
    token: string;
    expiresAt: number;
    tokenType?: string;
}
interface AuthCredentials {
    clientId: string;
    clientSecret: string;
}
interface MessageEnvelope {
    headers: {
        correlationId: string;
        traceId: string;
        schemaRef: string;
    };
    payload: any;
}
interface SdkEvents {
    'connection:open': () => void;
    'connection:close': (code: number, reason: string) => void;
    'connection:error': (error: Error) => void;
    'message:received': (message: MessageEnvelope) => void;
    'message:sent': (message: MessageEnvelope) => void;
}
declare class OptaveJavaScriptSDK {
    constructor(options: Opts);
    authenticate(): Promise<string>;
    openConnection(token?: string): Promise<void>;
    validate(payload: any): boolean;
    adjust(params: any): Promise<any>;
    elevate(params: any): Promise<any>;
    customerInteraction(params: any): Promise<any>;
    interaction(params: any): Promise<any>;
    reception(params: any): Promise<any>;
    summarize(params: any): Promise<any>;
    translate(params: any): Promise<any>;
    recommend(params: any): Promise<any>;
    insights(params: any): Promise<any>;
    disconnect(): void;
    isConnected(): boolean;
    on(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
}

declare const OAUTH2_TOKEN_URL: string;

type AuthTransport = 'subprotocol' | 'query';
interface GeneratedClientConfig {
    websocketUrl: string;
    authUrl: string;
    supportedAuthTransports: AuthTransport[];
    OptaveTraceChatSessionId?: string;
}
declare const createDefaultConfig: () => GeneratedClientConfig;
declare const DEFAULT_CONFIG: GeneratedClientConfig;
declare const SERVER_ENVIRONMENTS: {
    readonly websocket: {
        readonly wsEnv: {
            readonly default: "default";
            readonly examples: readonly ["default", "staging", "production"];
        };
    };
    readonly auth: {
        readonly authEnv: {
            readonly default: "default";
            readonly examples: readonly ["default", "staging", "production"];
        };
    };
};
declare function buildWebSocketUrl(environment?: string): string;
declare function buildAuthUrl(environment?: string): string;

export { type AuthCredentials, type AuthTokenResponse, type AuthTransport, DEFAULT_CONFIG, type GeneratedClientConfig, type Logger, type MessageEnvelope, OAUTH2_TOKEN_URL, OptaveJavaScriptSDK, type Opts, SERVER_ENVIRONMENTS, type SdkEvents, type WebSocketOptions, buildAuthUrl, buildWebSocketUrl, createDefaultConfig };
