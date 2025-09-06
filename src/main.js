import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import CONSTANTS from './constants.js';

const ErrorCategory = Object.freeze({
    AUTHENTICATION: 'AUTHENTICATION',
    ORCHESTRATOR: 'ORCHESTRATOR',
    VALIDATION: 'VALIDATION',
    WEBSOCKET: 'WEBSOCKET',
});

class OptaveJavaScriptSDK extends EventEmitter {
    options = {}

    wss = null;

    // Track pending promises for correlation-based replies
    _pendingReplies = new Map();

    // The validation schema
    schema = {
        type: "object",
        properties: {
            session: {
                type: "object",
                properties: {
                    // Keep pinned at top (do not move)
                    session_id: { type: "string" },
                    trace_id: { type: "string" },
                    // Alphabetize remaining: channel, interface, network
                    channel: {
                        type: "object",
                        properties: {
                            // Alphabetical
                            browser: { type: "string" },
                            device_info: { type: "string" },
                            device_type: { type: "string" },
                            language: { type: "string" },
                            location: { type: "string" },
                            medium: { type: "string" },
                            metadata: { type: "array" },
                            section: { type: "string" }
                        }
                    },
                    interface: {
                        type: "object",
                        properties: {
                            app_version: { type: "string" },
                            category: { type: "string" },
                            language: { type: "string" },
                            name: { type: "string" },
                            sdk_version: { type: "string" },
                            type: { type: "string" }
                        }
                    },
                    network: {
                        type: "object",
                        properties: {
                            latency_ms: { type: "number" }
                        }
                    }
                }
            },
            request: {
                type: "object",
                properties: {
                    request_id: {
                        type: "string"
                    },
                    attributes: {
                        type: "object",
                        properties: {
                            action: {
                                type: "string"
                            },
                            content: {
                                type: "string"
                            },
                            instruction: {
                                type: "string"
                            },
                            type: {
                                type: "string"
                            },
                            variant: {
                                type: "string"
                            }
                        }
                    },
                    connections: {
                        type: "object",
                        properties: {
                            journey_id: {
                                type: "string"
                            },
                            parent_id: {
                                type: "string"
                            },
                            thread_id: {
                                type: "string"
                            }
                        }
                    },
                    context: {
                        type: "object",
                        properties: {
                            case_id: {
                                type: "string"
                            },
                            department_id: {
                                type: "string"
                            },
                            operator_id: {
                                type: "string"
                            },
                            organization_id: {
                                type: "string"
                            },
                            tenant_id: {
                                type: "string"
                            },
                            user_id: {
                                type: "string"
                            }
                        }
                    },
                    reference: {
                        type: "object",
                        properties: {
                            ids: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: {
                                            type: "string"
                                        },
                                        value: {
                                            type: "string"
                                        }
                                    }
                                }
                            },
                            labels: {
                                type: "array"
                            },
                            tags: {
                                type: "array"
                            }
                        }
                    },
                    resources: {
                        type: "object",
                        properties: {
                            codes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: {
                                            type: "string"
                                        },
                                        label: {
                                            type: "string"
                                        },
                                        type: {
                                            type: "string"
                                        },
                                        value: {
                                            type: "string"
                                        }
                                    }
                                }
                            },
                            links: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        expires_at: {
                                            type: "string"
                                        },
                                        html: {
                                            type: "boolean"
                                        },
                                        id: {
                                            type: "string"
                                        },
                                        label: {
                                            type: "string"
                                        },
                                        type: {
                                            type: "string"
                                        },
                                        url: {
                                            type: "string"
                                        }
                                    }
                                }
                            },
                            offers: {
                                type: "array"
                            }
                        }
                    },
                    scope: {
                        type: "object",
                        properties: {
                            accounts: { type: "array" },
                            appointments: { type: "array" },
                            assets: { type: "array" },
                            bookings: { type: "array" },
                            cases: { type: "array" },
                            conversations: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        content: { type: "string" },
                                        display_name: { type: "string" },
                                        participant_id: { type: "string" },
                                        role: { type: "string" },
                                        timestamp: { type: "string" }
                                    }
                                }
                            },
                            documents: { type: "array" },
                            events: { type: "array" },
                            interactions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        content: { type: "string" },
                                        id: { type: "string" },
                                        name: { type: "string" },
                                        role: { type: "string" },
                                        timestamp: { type: "string" }
                                    }
                                }
                            },
                            items: { type: "array" },
                            locations: { type: "array" },
                            offers: { type: "array" },
                            operators: { type: "array" },
                            orders: { type: "array" },
                            organizations: { type: "array" },
                            persons: { type: "array" },
                            policies: { type: "array" },
                            products: { type: "array" },
                            properties: { type: "array" },
                            services: { type: "array" },
                            subscriptions: { type: "array" },
                            tickets: { type: "array" },
                            transactions: { type: "array" },
                            users: { type: "array" }
                        }
                    },
                    settings: {
                        type: "object",
                        properties: {
                            disable_browsing: {
                                type: "boolean"
                            },
                            disable_search: {
                                type: "boolean"
                            },
                            disable_sources: {
                                type: "boolean"
                            },
                            disable_stream: {
                                type: "boolean"
                            },
                            disable_tools: {
                                type: "boolean"
                            },
                            max_response_length: {
                                type: "number"
                            },
                            override_channel_medium: {
                                type: "string"
                            },
                            override_interface_language: {
                                type: "string"
                            },
                            override_output_language: {
                                type: "string"
                            }
                        }
                    },
                    cursor: {
                        type: "object",
                        properties: {
                            since: {
                                type: "string",
                                format: "date-time"
                            },
                            until: {
                                type: "string",
                                format: "date-time"
                            }
                        }
                    },
                    a2a: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: {
                                    type: "string"
                                },
                                name: {
                                    type: "string"
                                },
                                type: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            },
        }
    };

    // The default payload. The payload provided by the user is merged "on top" of these objects
    defaultPayload = {
        session: {
            session_id: "", // custom - lasts for the duration of a chat session or a call
            trace_id: "", // in v2, this was called "trace_session_ID"
            channel: {
                browser: "",
                device_info: "", // e.g. "iOS/18.2, iPhone15,3"
                device_type: "",
                language: "",
                location: "", // e.g. "45.42,-75.69"
                medium: "",  // options: "chat", "voice", "email" (defaults to chat)
                metadata: [], // custom metadata
                section: "", // e.g. "cart", "product_page"
            },
            interface: {
                app_version: "", // custom
                category: "", // e.g. "crm", "app", "auto", "widget"
                language: "", // the language from the crm agent
                name: "", // e.g. "salesforce", "zendesk"
                sdk_version: "3.1.1", 
                type: "", // e.g. "custom_components", "marketplace", "channel"
            },
            network: {
                latency_ms: 120,
            }
        },
        request: {
            request_id: "",
            attributes: {
                action: "",      
                content: "",
                instruction: "",
                type: "",
                variant: "A",
            },
            connections: {
                journey_id: "",
                parent_id: "", // in v2, this was called "trace_parent_ID"
                thread_id: "", // this ID should remain unique across all the requests related to the same ticket/case/conversation
            },
            context: { // generated by optave
                case_id: "", // advanced mode
                department_id: "", // advanced mode
                operator_id: "", // advanced mode
                organization_id: "",
                tenant_id: "",
                user_id: "", // advanced mode
            },
            reference: { // optionally generated by client, used for analytics
                ids: [
                    { name: "", value: ""}
                ],
                labels: [],
                tags: [],
            },
            resources: {
                codes: [
                    {
                        id: "", // optional for tracking/mapping
                        label: "", // optional, helps for display/templating - e.g. "Order Number"
                        type: "", // e.g., "order_number", "booking_reference", "ticket_code", etc.
                        value: "" // e.g. "ORD-56789"
                    }
                ],
                links: [
                    {
                        expires_at: "", //optional - e.g. "2025-08-06T00:00:00Z"
                        html: false, //optional
                        id: "", //optional
                        label: "", //optional - e.g. "Click here to pay"
                        type: "", // e.g., "payment_link", etc.  
                        url: "" // e.g. "https://checkout.stripe.com/pay/cs_test..."
                    }
                ],
                offers: [], // in v2, this was called "offering_details"
            },
            // Items below should only be sent if they are directly related to the request
            // There are two ways of sending it:
            // 1. Reference a previously created object (advanced mode)
            // Format: { id: "", name: "", type: "", timestamp: "" }, (mandatory: id)
            // 2. Send the object itself (risk: may exceed the payload size limit) - easy mode
            scope: {
                accounts: [],
                appointments: [],
                assets: [],
                bookings :[],
                cases: [], 
                conversations: [ // in v2, this was called "user_perspective"
                    {
                        content: "",
                        display_name: "",
                        participant_id: "", // sent by the client - optional
                        role: "", // options: "EndUser", "Agent", "Bot"
                        timestamp: ""
                    },
                ], 
                documents: [],
                events: [],
                interactions: [
                    {
                        content: "string",
                        id: "string",
                        name: "string",
                        role: "string", // options: "System"
                        timestamp: "datetime"
                    }
                ],
                items: [],
                locations: [],
                offers: [],
                operators: [],
                orders: [],
                organizations: [],
                persons: [],
                policies: [],
                products: [],
                properties: [],
                services: [],
                subscriptions: [],
                tickets :[],
                transactions: [],
                users: []
                // Missing something? We can add it for you, please contact our sales team.
            },
            settings: {
                disable_browsing: false,
                disable_search: false,
                disable_sources: false,
                disable_stream: false,
                disable_tools: false,
                max_response_length: 0,
                override_channel_medium: "",
                override_interface_language: "",
                override_output_language: "" // replaces the channel language
            },
            // Advanced mode:
            cursor: { 
                since: "", // e.g. "2024-01-15T10:30:00.000Z"
                until: "" // e.g. "2024-01-15T11:00:00.000Z"
            },
            a2a: [
                { id: "", name: "", type: "" } // e.g. { id: "bot_55", name: "Bot 55", type: "chatbot" }
            ]
        }
    };

    _validate = null;

    constructor(options) {
        super();
        this.options = { ...options };

        const ajv = new Ajv();
        addFormats(ajv, ['date', 'date-time']);

        this._validate = ajv.compile(this.schema);
    }

    validate(jsonObject) {
        if (!this._validate) {
            return false;
        }

        // Validation function (created in the constructor)
        return this._validate(jsonObject);
    }

    // Validates action-specific required fields
    validateRequiredFields(params, action) {
        const errors = [];

        // Common required fields for all actions
        if (!params.request?.context?.organization_id) {
            errors.push('request.context.organization_id is required');
        }
        if (!params.request?.context?.tenant_id) {
            errors.push('request.context.tenant_id is required');
        }
        if (!params.request?.connections?.thread_id) {
            errors.push('request.connections.thread_id is required');
        }

        // Action-specific required fields
        switch (action) {
            case 'adjust':
                if (!params.request?.attributes?.content) {
                    errors.push('request.attributes.content is required for adjust');
                }
                if (!params.request?.attributes?.instruction) {
                    errors.push('request.attributes.instruction is required for adjust');
                }
                if (!params.request?.connections?.parent_id) {
                    errors.push('request.connections.parent_id is required for adjust');
                }
                if (!params.request?.scope?.conversations || !Array.isArray(params.request.scope.conversations) || params.request.scope.conversations.length === 0) {
                    errors.push('request.scope.conversations is required for adjust and must be a non-empty array');
                }
                break;

            case 'elevate':
                if (!params.request?.attributes?.content) {
                    errors.push('request.attributes.content is required for elevate');
                }
                if (!params.request?.connections?.parent_id) {
                    errors.push('request.connections.parent_id is required for elevate');
                }
                if (!params.request?.scope?.conversations || !Array.isArray(params.request.scope.conversations) || params.request.scope.conversations.length === 0) {
                    errors.push('request.scope.conversations is required for elevate and must be a non-empty array');
                }
                break;

            case 'translate':
            case 'summarize':
            case 'insights':
                if (!params.request?.scope?.conversations || !Array.isArray(params.request.scope.conversations) || params.request.scope.conversations.length === 0) {
                    errors.push(`request.scope.conversations is required for ${action} and must be a non-empty array`);
                }
                break;

            case 'recommend':
                if (!params.request?.resources?.offers || !Array.isArray(params.request.resources.offers) || params.request.resources.offers.length === 0) {
                    errors.push('request.resources.offers is required for recommend and must be a non-empty array');
                }
                if (!params.request?.scope?.conversations || !Array.isArray(params.request.scope.conversations) || params.request.scope.conversations.length === 0) {
                    errors.push('request.scope.conversations is required for recommend and must be a non-empty array');
                }
                break;

            case 'customerinteraction':
                // CustomerInteraction has specific resource requirements but they're optional
                // Only thread_id, organization_id, and tenant_id are required (already checked above)
                break;

            default:
                // For unknown actions, just check common required fields
                break;
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    async authenticate() {
        let params = {
            grant_type: 'client_credentials',
        };

        if (!this.options.authenticationUrl) {
            this.handleError(
                ErrorCategory.AUTHENTICATION,
                'INVALID_AUTHENTICATION_URL',
                'Empty or invalid authentication URL');
            return null;
        }

        if (!this.options.clientId) {
            this.handleError(
                ErrorCategory.AUTHENTICATION,
                'INVALID_CLIENT_ID',
                'Empty or invalid client ID');
            return null;
        }

        params.client_id = this.options.clientId;
        params.client_secret = this.options.clientSecret;

        const paramsString = new URLSearchParams(params).toString();

        const url = `${this.options.authenticationUrl}?${paramsString}`;
        const response = await fetch(
            url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const responseJson = await response.json();

        if (!response.ok) {
            this.handleError(
                ErrorCategory.AUTHENTICATION,
                'INVALID_AUTHENTICATION_RESPONSE',
                'Could not fetch token',
                responseJson.error);
        }

        return responseJson.access_token;
    }

    openConnection(bearerToken) {
        if (!this.options.websocketUrl) {
            this.handleError(
                ErrorCategory.WEBSOCKET,
                'INVALID_WEBSOCKET_URL',
                'Empty or invalid Websocket URL',
                this.options.websocketUrl);
            return;
        }

        let params = {};

        if (bearerToken) {
            params['authorization'] = bearerToken;
        }

        if (this.sessionId) {
            params['x-optave-session-id'] = this.sessionId;
        }

        const paramsString = new URLSearchParams(params).toString();

        try {
            this.wss = new WebSocket(`${this.options.websocketUrl}?${paramsString}`);
        } catch (error) {
            this.handleError(
                ErrorCategory.WEBSOCKET,
                'WEBSOCKET_ERROR',
                'Error creating Websocket instance',
                error);
            return;
        }

        this.wss.onopen = event => {
            this.emit('open', event);
        };

        this.wss.onmessage = event => {
            let message;
            
            try {
                message = JSON.parse(event.data);
            } catch (error) {
                // Handle legacy or malformed messages
                const { state } = event.data;
                if (state === 'error') {
                    this.handleError(
                        ErrorCategory.ORCHESTRATOR,
                        'ERROR_STATE_MESSAGE',
                        'Received message in error state',
                        event.data);
                } else {
                    this.emit('message', event.data);
                }
                return;
            }

            // Determine if this is an enveloped message (version 3+) or legacy format
            const isEnvelopedMessage = message.headers && message.payload;
            
            if (isEnvelopedMessage) {
                // Handle enveloped message (version 3+)
                const correlationId = message.headers.correlationId;
                
                // Check if this is a response to a pending correlation
                if (correlationId && this._pendingReplies.has(correlationId)) {
                    const pending = this._pendingReplies.get(correlationId);
                    
                    // Clear timeout and resolve the promise
                    clearTimeout(pending.timeoutId);
                    this._pendingReplies.delete(correlationId);
                    pending.resolve(message);
                    return;
                }

                // Emit typed event based on schema reference or fall back to 'message'
                const eventType = message.headers.schemaRef || 'message';
                this.emit(eventType, message);
            } else {
                // Handle legacy message format (version 1-2)
                const { state } = message;
                
                if (state === 'error') {
                    this.handleError(
                        ErrorCategory.ORCHESTRATOR,
                        'ERROR_STATE_MESSAGE',
                        'Received message in error state',
                        message);
                } else {
                    this.emit('message', message);
                }
            }
        };

        this.wss.onclose = event => {
            // Reject all pending replies with connection closed error
            this._pendingReplies.forEach((pending, correlationId) => {
                clearTimeout(pending.timeoutId);
                pending.reject(new Error(`WebSocket connection closed while waiting for response to correlationId: ${correlationId}`));
            });
            this._pendingReplies.clear();
            
            this.emit('close', event);
        };

        this.wss.onerror = event => {
            this.handleError(
                ErrorCategory.WEBSOCKET,
                'CONNECTION_ERROR',
                'Websocket connection error',
                event);
        }
    }

    closeConnection() {
        if (this.wss) {
            this.wss.close();
        }
    }

    selectiveDeepMerge(target, source) {
        if (Array.isArray(target) && Array.isArray(source)) {
            // If both target and source are arrays, replace target with source
            return [...source];
        }

        if (target instanceof Object && source instanceof Object) {
            const result = {};
            for (let key in target) {
                if (key in source) {
                    // Recursively merge or replace values
                    result[key] = this.selectiveDeepMerge(target[key], source[key]);
                } else {
                    // Retain target value if key doesn't exist in source
                    result[key] = target[key];
                }
            }
            return result;
        }

        // For primitive values, return source value if it exists, else fallback to target
        return source !== undefined ? source : target;
    }

    isPayloadSizeValid(payloadString) {
        if (!payloadString) {
            return false;
        }

        // Check if the size is within the limit
        return (payloadString.length / 1024) <= CONSTANTS.MAX_PAYLOAD_SIZE_KB;
    }

    buildPayload(requestType, action, params) {
        let payload = this.selectiveDeepMerge(this.defaultPayload, params);

        payload.session.trace_id = uuidv4();

        // TODO: remove when v2 is phased out
        if (params?.request?.variation) {
            payload.request.attributes.variant = params.request.variation;
        }

        payload.request.attributes.variant = payload.request.attributes.variant.toUpperCase();
        payload.request.attributes.type = requestType;
        payload.request.attributes.action = action;

        // TO-DO: remove when unused (when everyone is using version 2 or later)
        payload.action = requestType;

        return payload;
    }

    // Maps action and request type to standardized AsyncAPI message ID
    resolveMessageId(requestType, action) {
        return `${action}.${requestType}.v3`.toLowerCase(); // e.g., "adjust.message.v3"
    }

    // Wraps payload in message envelope with headers for tracking and versioning
    buildMessageEnvelope(payload) {
        const messageId = this.resolveMessageId(
            payload?.request?.attributes?.type || 'message',
            payload?.request?.attributes?.action || 'unknown'
        );
        
        return {
            headers: {
                messageId: uuidv4(),
                correlationId: payload?.request?.request_id || payload?.session?.trace_id || uuidv4(),
                schemaRef: messageId
            },
            payload
        };
    }

    // Wait for a response that matches the given correlationId
    awaitResponse(correlationId, { timeoutMs = 15000 } = {}) {
        return new Promise((resolve, reject) => {
            // Store the promise resolvers
            this._pendingReplies.set(correlationId, { resolve, reject });

            // Set up timeout
            const timeoutId = setTimeout(() => {
                this._pendingReplies.delete(correlationId);
                reject(new Error(`Response timeout after ${timeoutMs}ms for correlationId: ${correlationId}`));
            }, timeoutMs);

            // Store timeout ID so we can clear it if response arrives
            this._pendingReplies.get(correlationId).timeoutId = timeoutId;
        });
    }

    handleError(category, code, message, details = null, suggestions = []) {
        // If the error is just a string and no error callbacks are attached,
        // just print the message, as it may be helpful for someone
        if (this.listenerCount('error') == 0) {
            if (typeof error === 'string') {
                console.error(error);
            }
        }
        else {
            this.emit('error', {
                category,
                code,
                message,
                details,
                suggestions,
            });
        }
    }

    send(requestType, action, params, version = 3) {
        if (this.wss && this.wss.readyState === WebSocket.OPEN) {
            let payload;

            if (version > 1) {
                if (!this.validate(params)) {
                    this.handleError(
                        ErrorCategory.VALIDATION,
                        'PAYLOAD_SCHEMA_MISMATCH',
                        'Validation error',
                        this._validate.errors);
                    return;
                }

                // Validate required fields based on action type
                const requiredFieldValidation = this.validateRequiredFields(action, params);
                if (!requiredFieldValidation.valid) {
                    this.handleError(
                        ErrorCategory.VALIDATION,
                        'REQUIRED_FIELDS_MISSING',
                        `Missing required fields for action '${action}': ${requiredFieldValidation.missingFields.join(', ')}`,
                        requiredFieldValidation.missingFields);
                    return;
                }

                payload = this.buildPayload(requestType, action, params);

                // For version 3+, wrap in message envelope
                if (version >= 3) {
                    payload = this.buildMessageEnvelope(payload);
                }
            }
            else {
                // TO-DO: Remove support for version 1 when unused
                payload = {
                    action: 'message',
                    actionType: action,
                    inputs: params,
                }
            }

            const payloadString = JSON.stringify(payload);

            if (this.isPayloadSizeValid(payloadString)) {
                this.wss.send(payloadString);
            }
            else {
                this.handleError(
                    ErrorCategory.VALIDATION,
                    'PAYLOAD_TOO_LARGE',
                    `Request not sent: payload size is too large (max size = ${CONSTANTS.MAX_PAYLOAD_SIZE_KB} KB)`,
                    CONSTANTS.MAX_PAYLOAD_SIZE_KB)
            }
        } else {
            this.handleError(
                ErrorCategory.WEBSOCKET,
                'WEBSOCKET_NOT_IN_OPEN_STATE',
                'Websocket not in OPEN state. Unable to send message.');
        }
    }

    // Send message and optionally await response
    async sendAndAwait(requestType, action, params, { awaitResponse = false, timeoutMs = 15000, version = 3 } = {}) {
        if (!awaitResponse) {
            this.send(requestType, action, params, version);
            return;
        }

        // Only support correlation for version 3+ (enveloped messages)
        if (version < 3) {
            throw new Error('awaitResponse requires version 3 or higher for message correlation');
        }

        // Build the payload to get the correlation ID
        const payload = this.buildPayload(requestType, action, params);
        const envelope = this.buildMessageEnvelope(payload);
        const correlationId = envelope.headers.correlationId;

        // Set up the promise to await the response
        const responsePromise = this.awaitResponse(correlationId, { timeoutMs });

        // Send the message
        this.send(requestType, action, params, version);

        // Return the promise that will resolve when the response arrives
        return responsePromise;
    }

    // The following functions send messages of a specific type to the WebSocket
    // They default to version 3 (enveloped) for new users, but can be overridden
    adjust = (params, version = 3) => this.send('message', 'adjust', params, version);
    elevate = (params, version = 3) => this.send('message', 'elevate', params, version);
    customerInteraction = (params, version = 3) => this.send('message', 'customerinteraction', params, version);
    summarize = (params, version = 3) => this.send('message', 'summarize', params, version);
    translate = (params, version = 3) => this.send('message', 'translate', params, version);
    recommend = (params, version = 3) => this.send('message', 'recommend', params, version);
    insights = (params, version = 3) => this.send('message', 'insights', params, version);
    
    // Async versions that can await responses (version 3+ only)
    adjustAndAwait = (params, options = {}) => this.sendAndAwait('message', 'adjust', params, { awaitResponse: true, ...options });
    elevateAndAwait = (params, options = {}) => this.sendAndAwait('message', 'elevate', params, { awaitResponse: true, ...options });
    customerInteractionAndAwait = (params, options = {}) => this.sendAndAwait('message', 'customerinteraction', params, { awaitResponse: true, ...options });
    summarizeAndAwait = (params, options = {}) => this.sendAndAwait('message', 'summarize', params, { awaitResponse: true, ...options });
    translateAndAwait = (params, options = {}) => this.sendAndAwait('message', 'translate', params, { awaitResponse: true, ...options });
    recommendAndAwait = (params, options = {}) => this.sendAndAwait('message', 'recommend', params, { awaitResponse: true, ...options });
    insightsAndAwait = (params, options = {}) => this.sendAndAwait('message', 'insights', params, { awaitResponse: true, ...options });
}

export default OptaveJavaScriptSDK;