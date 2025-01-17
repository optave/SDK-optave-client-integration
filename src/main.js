const EventEmitter = require('events');
const uuid = require('uuid');

const Ajv = require('ajv');
import addFormats from "ajv-formats"

let CONSTANTS = require('./constants');

const ErrorCategory = Object.freeze({
    AUTHENTICATION: 'AUTHENTICATION',
    ORCHESTRATOR: 'ORCHESTRATOR',
    VALIDATION: 'VALIDATION',
    WEBSOCKET: 'WEBSOCKET',
});

class OptaveJavascriptSDK extends EventEmitter {
    options = {}

    wss = null;

    // The validation schema
    schema = {
        type: "object",
        // additionalProperties: false,
        properties: {
            session: {
                type: "object",
                properties: {
                    sdk_version: {
                        type: "string"
                    },
                    trace_session_ID: {
                        type: "string"
                    },
                    trace_parent_ID: {
                        type: "string"
                    },
                    user_perspective: {
                        type: "array"
                    },
                    interactions: {
                        type: "array"
                    },
                    feedbacks: {
                        type: "array"
                    },
                    escalations: {
                        type: "array"
                    },
                    notes: {
                        type: "array"
                    },
                    tags: {
                        type: "array"
                    },
                    open_orders: {
                        type: "array"
                    }
                }
            },
            request: {
                type: "object",
                properties: {
                    request_ID: {
                        type: "string"
                    },
                    request_type: {
                        type: "string"
                    },
                    action: {
                        type: "string"
                    },
                    status: {
                        type: "string"
                    },
                    instruction: {
                        type: "string"
                    },
                    content: {
                        type: "string"
                    },
                    medium: {
                        type: "string"
                    },
                    variation: {
                        type: "string"
                    },
                    product_ID: {
                        type: "string"
                    },
                    crm: {
                        type: "string"
                    },
                    output_language: {
                        type: "string"
                    },
                    interface_language: {
                        type: "string"
                    },
                    channel: {
                        type: "object",
                        properties: {
                            c_name: {
                                type: "string"
                            },
                            c_language: {
                                type: "string"
                            },
                            c_section: {
                                type: "string"
                            }
                        }
                    },
                    settings: {
                        type: "object",
                        properties: {
                            disable_search: {
                                type: "boolean"
                            },
                            disable_stream: {
                                type: "boolean"
                            }
                        }
                    },
                    offering_details: {
                        type: "array"
                    }
                }
            },
            client: {
                type: "object",
                properties: {
                    client_ID: {
                        type: "string"
                    },
                    organization_name: {
                        type: "string"
                    },
                    organization_ID: {
                        type: "string"
                    },
                    department_name: {
                        type: "string"
                    },
                    department_ID: {
                        type: "string"
                    }
                }
            },
            agent: {
                type: "object",
                properties: {
                    agent_ID: {
                        type: "string"
                    },
                    agent_name: {
                        type: "string"
                    },
                    support_team_name: {
                        type: "string"
                    },
                    support_team_ID: {
                        type: "string"
                    },
                    timezone: {
                        type: "string"
                    },
                    languages: {
                        type: "array"
                    },
                    skills: {
                        type: "array"
                    },
                    in_training: {
                        type: "boolean"
                    },
                    experience_level: {
                        type: "string"
                    },
                    current_workload: {
                        type: "integer"
                    },
                    availability_status: {
                        type: "string"
                    }
                }
            },
            user: {
                type: "object",
                properties: {
                    user_ID: {
                        type: "string"
                    },
                    user_name: {
                        type: "string"
                    },
                    preferred_pronouns: {
                        type: "string"
                    },
                    user_type: {
                        type: "string"
                    },
                    preferred_contact_method: {
                        type: "string"
                    },
                    preferred_contact_times: {
                        type: "array"
                    },
                    preferred_support_languages: {
                        type: "array"
                    },
                    primary_language: {
                        type: "string"
                    },
                    consent_and_preferences: {
                        type: "object",
                        properties: {
                            marketing_consent: {
                                type: "boolean"
                            },
                            privacy_settings: {
                                type: "string"
                            }
                        }
                    },
                    loyalty_details: {
                        type: "object",
                        properties: {
                            points_balance: {
                                type: "integer"
                            },
                            tier_expiry_date: {
                                type: ["null", "string"],
                                format: "date-time"
                            }
                        }
                    },
                    total_spend: {
                        type: "number"
                    },
                    last_contacted_timestamp: {
                        type: ["null", "string"],
                        format: "date-time"
                    },
                    technical_information: {
                        type: "object",
                        properties: {
                            devices_used: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                            browser_or_app_version: {
                                type: "string"
                            }
                        }
                    },
                    behavioral_data: {
                        type: "object",
                        properties: {
                            average_response_time: {
                                type: "number"
                            },
                            interaction_frequency: {
                                type: "number"
                            },
                            preferred_interaction_channels: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            },
                            product_preferences: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            }
                        }
                    },
                    pending_queries: {
                        type: "array"
                    },
                    past_sessions: {
                        type: "array"
                    },
                    follow_up_required: {
                        type: "boolean"
                    },
                    follow_up_details: {
                        type: "array"
                    }
                }
            }
        }
    }

    // The default payload. The payload provided by the user is merged "on top" of this objects
    defaultPayload = {
        session: {
            sdk_version: '3.0.0-rc.0',
            trace_session_ID: '',
            trace_parent_ID: '',
            user_perspective: [], // in v1, this was called "history"
            interactions: [],
            feedbacks: [],
            escalations: [],
            notes: [],
            tags: [],
            open_orders: [],
        },
        request: {
            request_ID: '',
            request_type: '', // in v1, this was called "action"
            action: '',      // in v1, this was called  "actionType"
            status: '',
            instruction: '',
            content: '',
            medium: '',
            variation: 'A',
            product_ID: '',
            crm: '',
            output_language: '',
            interface_language: '',
            channel: {
                c_name: '',
                c_language: '',
                c_section: '',
            },
            settings: {
                disable_search: false,
                disable_stream: false
            },
            offering_details: [],
        },
        client: {
            client_ID: '',
            organization_name: '',
            organization_ID: '',
            department_name: '',
            department_ID: '',
        },
        agent: {
            agent_ID: '',
            agent_name: '',
            support_team_name: '',
            support_team_ID: '',
            timezone: '',
            languages: [],
            skills: [],
            in_training: false,
            experience_level: '',
            current_workload: 0,
            availability_status: '',
        },
        user: {
            user_ID: '',
            user_name: '',
            preferred_pronouns: '',
            user_type: '',
            preferred_contact_method: '',
            preferred_contact_times: [],
            preferred_support_languages: [],
            primary_language: '',
            consent_and_preferences: {},
            loyalty_details: {},
            total_spend: 0,
            last_contacted_timestamp: null,
            technical_information: {},
            behavioral_data: {},
            pending_queries: [],
            past_sessions: [],
            follow_up_required: false,
            follow_up_details: [],
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

        payload.session.trace_session_ID = uuid.v4();

        payload.request.variation = payload.request.variation.toUpperCase();
        payload.request.request_type = requestType;
        payload.request.action = action;

        // TO-DO: remove when unused (when everyone is using version 2 or later)
        payload.action = requestType;

        return payload;
    }

    handleError(category, code, message, details = null, suggestions = []) {
        // If the error is just a string and no error callbacks were attached,
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

    send(requestType, action, params, version = 2) {
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

    // The following function send messages of a specific type to the Websocket
    adjust = params => this.send('message', 'adjust', params);
    elevate = params => this.send('message', 'elevate', params);
    customerInteraction = params => this.send('message', 'customerinteraction', params);
    summarize = params => this.send('message', 'summarize', params);
    translate = params => this.send('message', 'translate', params);
    recommend = params => this.send('message', 'recommend', params);
    insights = params => this.send('message', 'insights', params);
}

module.exports = OptaveJavascriptSDK;

// Explicitly add a default export for ES6 environments
exports.default = OptaveJavascriptSDK;