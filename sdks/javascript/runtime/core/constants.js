/**
 * SDK Constants - PUBLIC API
 *
 * ⚠️ WARNING: This file is exported as part of the public API.
 * Do not add sensitive information such as API keys, secrets,
 * internal URLs, or confidential configuration values.
 *
 * Only include constants that are safe to expose to end users.
 */

// SDK Constants (imported from generated file based on AsyncAPI spec)
import { SPEC_VERSION, SCHEMA_REF } from '../../generated/constants.js';
export { SPEC_VERSION, SCHEMA_REF };

// Error categories
export const ErrorCategory = {
    AUTHENTICATION: "AUTHENTICATION",
    ORCHESTRATOR: "ORCHESTRATOR",
    VALIDATION: "VALIDATION",
    WEBSOCKET: "WEBSOCKET"
};

// Legacy events (for backward compatibility)
export const LegacyEvents = Object.freeze({
    MESSAGE: 'message',
    ERROR: 'error'
});

// SDK Events
export const EVENTS = Object.freeze({
    CONNECTION_OPEN: 'connection:open',
    CONNECTION_CLOSE: 'connection:close',
    CONNECTION_ERROR: 'connection:error',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_SENT: 'message:sent',
    ERROR: 'error',
    RESPONSE: 'response',
    LEGACY_ERROR: 'error',  // Both ERROR and LEGACY_ERROR map to 'error' for compatibility
    LEGACY_MESSAGE: 'message'  // Legacy message handling for backward compatibility
});

// New events (to migrate to)
export const InboundEvents = Object.freeze({
  SUPERPOWER_RESPONSE: 'superpower.response',
  SUPERPOWER_ERROR: 'superpower.error',
});

// Allowed SDK actions (as Set for has() method)
export const ALLOWED_ACTIONS = new Set([
    'adjust',
    'elevate',
    'interaction',
    'reception',
    'customerInteraction', // deprecated alias
    'summarize',
    'translate',
    'recommend',
    'insights'
]);

// Default payload size limit (128KB)
export const MAX_PAYLOAD_SIZE = 128 * 1024;
export const MAX_PAYLOAD_SIZE_KB = 128;

// Default request timeout (30 seconds)
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

// Default configuration object - exported as named export to avoid issues with tree-shaking default exports
export const CONSTANTS = {
    SPEC_VERSION,
    SCHEMA_REF,
    MAX_PAYLOAD_SIZE,
    MAX_PAYLOAD_SIZE_KB,
    DEFAULT_REQUEST_TIMEOUT_MS,
    ErrorCategory,
    LegacyEvents,
    EVENTS,
    InboundEvents,
    ALLOWED_ACTIONS
};

export default CONSTANTS;