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
            params['Authorization'] = bearerToken;
        }

        if (this.sessionId) {
            params['OptaveTraceChatSessionId'] = this.sessionId;
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
            const { state } = event.data;

            if (state === 'error') {
                this.handleError(
                    ErrorCategory.ORCHESTRATOR,
                    'ERROR_STATE_MESSAGE',
                    'Received message in error state',
                    event.data);
            }
            else {
                this.emit('message', event.data);
            }
        };

        this.wss.onclose = event => {
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

                payload = this.buildPayload(requestType, action, params);
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

    // The following functions send messages of a specific type to the WebSocket
    adjust = params => this.send('message', 'adjust', params);
    elevate = params => this.send('message', 'elevate', params);
    customerInteraction = params => this.send('message', 'customerinteraction', params);
    summarize = params => this.send('message', 'summarize', params);
    translate = params => this.send('message', 'translate', params);
    recommend = params => this.send('message', 'recommend', params);
    insights = params => this.send('message', 'insights', params);
}

export default OptaveJavaScriptSDK;