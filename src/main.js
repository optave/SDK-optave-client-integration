const EventEmitter = require('events');
const uuid = require('uuid');

let CONSTANTS = require('./constants');

class OptaveClientSDK extends EventEmitter {
    options = {}
    
    wss = null;

    // The default payload. The payload provided by the user is merged "on top" of this objects
    defaultPayload = {
        session: {
            sdk_version: '2.0.4',
            trace_session_ID: '',
            trace_parent_ID: '',
            user_perspective: [ // in v1, this was called "history"
                // {
                //     timestamp: "datetime",
                //     id: "string",
                //     role: "string",
                //     name: "string",
                //     content: "string"
                // }
            ],
            interactions: [
                // {
                //     timestamp: "datetime",
                //     id: "string",
                //     role: "string",
                //     name: "string",
                //     content: "string"
                // }
            ],
            feedbacks: [
                // {
                //     feedback_ID: "string",
                //     timestamp: "datetime",
                //     rating: "integer",
                //     comments: "string",
                //     suggestions: "string"
                // }
            ],
            escalations: [
                // {
                //     escalation_ID: "string",
                //     timestamp: "datetime",
                //     escalated_to: "string",
                //     reason: "string",
                //     resolution_status: "string"
                // }
            ],
            notes: [
                // {
                //     note_ID: "string",
                //     timestamp: "datetime",
                //     author: "string",
                //     role: "string",
                //     content: "string"
                // }
            ],
            tags: [
                // {
                //     tag_ID: "string",
                //     tag: "string"
                // }
            ],
            open_orders: [
                // {
                //     order_ID: "string",
                //     order_content: [
                //         {
                //             sku: "string",
                //             title: "string",
                //             category: "string",
                //             price: "number",
                //             item_status: "string",
                //             supplier: "string",
                //             quantity: "integer"
                //         }
                //     ],
                //     payment_method: "string",
                //     shipping_cost: "number",
                //     total_price: "number",
                //     taxes: "number",
                //     order_status: "string",
                //     return_status: "string",
                //     purchase_date: "datetime",
                //     event_date: "datetime",
                //     discounts_applied: [
                //         {
                //             discount_code: "string",
                //             amount: "number"
                //         }
                //     ],
                //     promo_codes_applied: [
                //         {
                //             promo_code: "string",
                //             amount: "number"
                //         }
                //     ],
                //     gift_options: [
                //         {
                //             option: "string",
                //             details: "string"
                //         }
                //     ]
                // }
            ],
        },
        request: {
            request_ID: '',
            request_type: '', // in v1, this was called "action"
            action:  '',      // in v1, this was called  "actionType"
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
            offering_details: [
                // {
                //     code: "string",
                //     title: "string",
                //     url: "string",
                //     description: "string",
                //     selectedTourGrade: {
                //         title: "string",
                //         description: "string",
                //         privateTour: "boolean",
                //         pickupIncluded: "boolean",
                //         travelDate: "date",
                //         startTime: "string",
                //         price: {
                //             currencyIsoCode: "string",
                //             total: "number",
                //             breakdown: [
                //                 {
                //                     type: "string",
                //                     count: "integer",
                //                     amount: "number"
                //                 }
                //             ]
                //         }
                //     },
                //     priceFrom: {
                //         travelDate: "date",
                //         price: {
                //             currencyIsoCode: "string",
                //             total: "number",
                //             breakdown: [
                //                 {
                //                     type: "string",
                //                     count: "integer",
                //                     amount: "number"
                //                 }
                //             ]
                //         }
                //     }
                // }
            ],
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
            languages: [
                // "string"
            ],
            skills: [
                // "string"
            ],
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
            preferred_contact_times: [
                // "string"
            ],
            preferred_support_languages: [
                // "string"
            ],
            primary_language: '',
            consent_and_preferences: {
                // marketing_consent: true,
                // privacy_settings: '',
            },
            loyalty_details: {
                // points_balance: 0,
                // tier_expiry_date: null
            },
            total_spend: 0,
            last_contacted_timestamp: null,
            technical_information: {
                // devices_used: [
                //     //"string"
                // ],
                // browser_or_app_version: '',
            },
            behavioral_data: {
                // average_response_time: 0,
                // interaction_frequency: 0,
                // preferred_interaction_channels: [
                //     //"string"
                // ],
                // product_preferences: [
                //     //"string"
                // ]
            },
            pending_queries: [
                // {
                //     interaction_ID: "string",
                //     created_timestamp: "datetime",
                //     last_interaction_timestamp: "datetime",
                //     agent_name: "string",
                //     CSAT_rating: "integer",
                //     ticket_status: "string",
                //     unanswered_queries_superpower_answer_1: "string",
                //     escalation_history: [
                //         {
                //             escalation_timestamp: "datetime",
                //             escalated_to: "string",
                //             reason: "string"
                //         }
                //     ],
                //     medium: "string",
                //     channel: "string",
                //     number_of_messages_exchanged: "integer",
                //     agent_notes: "string",
                //     suggestions: ["string"],
                //     conversation: [
                //         {
                //             timestamp: "datetime",
                //             role: "string",
                //             name: "string",
                //             content: "string"
                //         }
                //     ],
                //     "summary": "string"
                // }
            ],
            past_sessions: [
                // {
                //     session_ID: "string",
                //     started_timestamp: "datetime",
                //     ended_timestamp: "datetime",
                //     agent_name: "string",
                //     CSAT_rating: "integer",
                //     ticket_status: "string",
                //     medium: "string",
                //     channel: "string",
                //     number_of_messages_exchanged: "integer",
                //     suggestions: ["string"],
                //     user_perspective: [
                //         {
                //             timestamp: "datetime",
                //             id: "string",
                //             role: "string",
                //             name: "string",
                //             content: "string"
                //         }
                //     ],
                //     all_interactions: [
                //         {
                //             timestamp: "datetime",
                //             id: "string",
                //             role: "string",
                //             name: "string",
                //             content: "string"
                //         }
                //     ],
                //     session_feedbacks: [
                //         {
                //             feedback_ID: "string",
                //             timestamp: "datetime",
                //             rating: "integer",
                //             comments: "string",
                //             suggestions: "string"
                //         }
                //     ],
                //     session_notes: [
                //         {
                //             note_ID: "string",
                //             timestamp: "datetime",
                //             author: "string",
                //             role: "string",
                //             content: "string"
                //         }
                //     ],
                //     summary: "string"
                // }
            ],
            follow_up_required: false,
            follow_up_details: [
                // {
                //     follow_up_agent: "string",
                //     follow_up_date: "datetime",
                //     follow_up_reason: "string",
                //     related_to_session_ID: "string"
                // },
            ],
        }
    };

    constructor(options) {
        super();
        this.options = { ...options };
    }

    async authenticate() {
        let params = {
            grant_type: 'client_credentials',
        };
        
        if (!this.options.authenticationUrl) {
            this.handleError('Empty or invalid authentication URL');
            return null;
        }

        if (!this.options.clientId) {
            this.handleError('Empty or invalid authentication URL');
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
            this.handleError(`Could not fetch token. Error: ${responseJson.error}`);
        }

        return responseJson.access_token;
    }

    openConnection(bearerToken) {
        if (!this.options.websocketUrl) {
            this.handleError('Empty or invalid Websocket URL');
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
            this.handleError(error);
            return;
        }

        this.wss.onopen = event => {
            this.emit('open', event);
        };

        this.wss.onmessage = event => {
            const { state } = event.data;

            if (state === 'error') {
                this.handleError(event.data);
            }
            else {
                this.emit('message', event.data);
            }
        };

        this.wss.onclose = event => {
            this.emit('close', event);
        };

        this.wss.onerror = event => {
            this.handleError(event);
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

    handleError(error) {
        // If the error is just a string and no error callbacks were attached,
        // just print the message, as it may be helpful for someone
        if (this.listenerCount('error') == 0) {
            if (typeof error === 'string') {
                console.error(error);
            }
        }
        else {
            this.emit('error', error);
        }
    }

    send(requestType, action, params, version = 2) {
        if (this.wss && this.wss.readyState === WebSocket.OPEN) {
            let payload;

            if (version > 1) {
                payload = this.buildPayload(requestType, action, params)
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
                this.handleError(`Request not sent: payload size is too large (max size = ${CONSTANTS.MAX_PAYLOAD_SIZE_KB} KB)`)
            }
        } else {
            this.handleError('WebSocket is not open. Unable to send message.');
        }
    }

    // The following function send messages of a specific type to the Websocket
    adjust              = params => this.send('message', 'adjust'             , params);
    elevate             = params => this.send('message', 'elevate'            , params);
    customerInteraction = params => this.send('message', 'customerinteraction', params);
    summarize           = params => this.send('message', 'summarize'          , params);
    translate           = params => this.send('message', 'translate'          , params);
    recommend           = params => this.send('message', 'recommend'          , params);
    insights            = params => this.send('message', 'insights'           , params);
}

module.exports = OptaveClientSDK;

// Explicitly add a default export for ES6 environments
exports.default = OptaveClientSDK;