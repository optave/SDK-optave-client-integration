/**
 * Browser-compatible validator implementation
 * Provides comprehensive validation without AJV dependency
 * This implementation must match the server-side validation logic for security
 */

// Helper function to create AJV-compatible error objects
function createError(instancePath, message, keyword = 'validation', params = {}) {
    return {
        instancePath,
        message,
        keyword,
        params
    };
}

// Validates payload structure and required fields
export function validatePayload(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: [createError('', 'must be object', 'type', { type: 'object' })] };
    }

    const errors = [];

    // Session validation
    if (!data.session) {
        errors.push(createError('/session', 'is required', 'required', { missingProperty: 'session' }));
    } else if (typeof data.session !== 'object') {
        errors.push(createError('/session', 'must be object', 'type', { type: 'object' }));
    } else {
        // sessionId validation (optional)
        if (data.session.sessionId !== undefined && typeof data.session.sessionId !== 'string') {
            errors.push(createError('/session/sessionId', 'must be string', 'type', { type: 'string' }));
        }
    }

    // Request validation
    if (!data.request) {
        errors.push(createError('/request', 'is required', 'required', { missingProperty: 'request' }));
    } else if (typeof data.request !== 'object') {
        errors.push(createError('/request', 'must be object', 'type', { type: 'object' }));
    } else {
        // Connections validation
        if (!data.request.connections) {
            errors.push(createError('/request/connections', 'is required', 'required', { missingProperty: 'connections' }));
        } else if (typeof data.request.connections !== 'object') {
            errors.push(createError('/request/connections', 'must be object', 'type', { type: 'object' }));
        } else {
            // threadId validation - required for ALL actions per SDK logic
            if (!data.request.connections.threadId) {
                errors.push(createError('/request/connections/threadId', 'is required', 'required', { missingProperty: 'threadId' }));
            } else if (typeof data.request.connections.threadId !== 'string') {
                errors.push(createError('/request/connections/threadId', 'must be string', 'type', { type: 'string' }));
            }

            // parentId type validation (if present)
            if (data.request.connections.parentId !== undefined && typeof data.request.connections.parentId !== 'string') {
                errors.push(createError('/request/connections/parentId', 'must be string', 'type', { type: 'string' }));
            }
        }

        // Context validation (if present)
        if (data.request.context !== undefined && typeof data.request.context !== 'object') {
            errors.push(createError('/request/context', 'must be object', 'type', { type: 'object' }));
        }

        // Attributes validation (if present)
        if (data.request.attributes !== undefined && typeof data.request.attributes !== 'object') {
            errors.push(createError('/request/attributes', 'must be object', 'type', { type: 'object' }));
        }

        // Scope validation (if present)
        if (data.request.scope !== undefined) {
            if (typeof data.request.scope !== 'object') {
                errors.push(createError('/request/scope', 'must be object', 'type', { type: 'object' }));
            } else if (data.request.scope.conversations !== undefined) {
                if (!Array.isArray(data.request.scope.conversations)) {
                    errors.push(createError('/request/scope/conversations', 'must be array', 'type', { type: 'array' }));
                }
            }
        }

        // Resources validation (if present)
        if (data.request.resources !== undefined) {
            if (typeof data.request.resources !== 'object') {
                errors.push(createError('/request/resources', 'must be object', 'type', { type: 'object' }));
            } else if (data.request.resources.offers !== undefined) {
                if (!Array.isArray(data.request.resources.offers)) {
                    errors.push(createError('/request/resources/offers', 'must be array', 'type', { type: 'array' }));
                }
            }
        }
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true, errors: null };
}

export function validateMessageEnvelope(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, errors: [createError('', 'must be object', 'type', { type: 'object' })] };
    }

    const errors = [];

    // Headers validation
    if (!data.headers) {
        errors.push(createError('/headers', 'is required', 'required', { missingProperty: 'headers' }));
    } else if (typeof data.headers !== 'object') {
        errors.push(createError('/headers', 'must be object', 'type', { type: 'object' }));
    } else {
        // correlationId validation
        if (!data.headers.correlationId) {
            errors.push(createError('/headers/correlationId', 'is required', 'required', { missingProperty: 'correlationId' }));
        } else if (typeof data.headers.correlationId !== 'string') {
            errors.push(createError('/headers/correlationId', 'must be string', 'type', { type: 'string' }));
        }

        // action validation
        if (!data.headers.action) {
            errors.push(createError('/headers/action', 'is required', 'required', { missingProperty: 'action' }));
        } else if (typeof data.headers.action !== 'string') {
            errors.push(createError('/headers/action', 'must be string', 'type', { type: 'string' }));
        } else {
            // Validate allowed actions
            const allowedActions = ['adjust', 'elevate', 'interaction', 'customerinteraction', 'reception', 'summarize', 'translate', 'recommend', 'insights'];
            if (!allowedActions.includes(data.headers.action)) {
                errors.push(createError('/headers/action', 'must be equal to one of the allowed values', 'enum', { allowedValues: allowedActions }));
            }
        }

        // Optional fields validation
        if (data.headers.identifier !== undefined && typeof data.headers.identifier !== 'string') {
            errors.push(createError('/headers/identifier', 'must be string', 'type', { type: 'string' }));
        }

        if (data.headers.schemaRef !== undefined && typeof data.headers.schemaRef !== 'string') {
            errors.push(createError('/headers/schemaRef', 'must be string', 'type', { type: 'string' }));
        }

        if (data.headers.timestamp !== undefined && typeof data.headers.timestamp !== 'string') {
            errors.push(createError('/headers/timestamp', 'must be string', 'type', { type: 'string' }));
        }
    }

    // Payload validation
    if (!data.payload) {
        errors.push(createError('/payload', 'is required', 'required', { missingProperty: 'payload' }));
    } else if (typeof data.payload !== 'object') {
        errors.push(createError('/payload', 'must be object', 'type', { type: 'object' }));
    } else {
        // Action-specific conversation validation
        if (data.headers && data.headers.action && data.payload) {
            const action = data.headers.action;
            const requiresConversations = ['adjust', 'elevate', 'interaction', 'customerinteraction', 'customerInteraction', 'summarize', 'translate', 'insights', 'recommend'];

            if (requiresConversations.includes(action)) {
                if (!data.payload.request) {
                    errors.push(createError('/payload/request', 'is required', 'required', { missingProperty: 'request' }));
                } else if (!data.payload.request.scope) {
                    errors.push(createError('/payload/request/scope', 'is required', 'required', { missingProperty: 'scope' }));
                } else if (!data.payload.request.scope.conversations) {
                    errors.push(createError('/payload/request/scope/conversations', `is required for ${action}`, 'required', { missingProperty: 'conversations' }));
                } else if (!Array.isArray(data.payload.request.scope.conversations)) {
                    errors.push(createError('/payload/request/scope/conversations', 'must be array', 'type', { type: 'array' }));
                } else if (data.payload.request.scope.conversations.length === 0) {
                    errors.push(createError('/payload/request/scope/conversations', `must be non-empty array for ${action}`, 'minItems', { limit: 1 }));
                }
            }
        }
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true, errors: null };
}

// Validator functions are already exported above

export const availableValidators = ['Payload', 'MessageEnvelope'];