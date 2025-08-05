import OptaveJavaScriptSDK from '../main.js';
import EventEmitter from 'events';

const token = 'mocked_token';

global.WebSocket = jest.fn();
global.WebSocket.prototype.send = jest.fn();
global.WebSocket.prototype.close = jest.fn();

describe('OptaveJavaScriptSDK', () => {
    let client;

    beforeEach(() => {
        client = new OptaveJavaScriptSDK({
            websocketUrl: 'someurl'
        });
    });

    it('is an instance of EventEmitter', () => {
        expect(client).toBeInstanceOf(EventEmitter);
    });

    it('tries to open an connection without a Websocket URL', () => {
        const c = new OptaveJavaScriptSDK({});

        const mockErrorCallback = jest.fn();
        c.on('error', mockErrorCallback);

        c.openConnection();

        expect(mockErrorCallback)
            .toHaveBeenCalled();
    })

    it('opens a connection', async () => {
        await client.openConnection(token);
        
        expect(global.WebSocket)
            .toHaveBeenCalledWith(expect.stringContaining('mocked_token'));
    });

    it('emits an event whent the connection is opened', async () => {
        const mockOpenCallback = jest.fn();
        client.on('open', mockOpenCallback);

        client.openConnection();

        const mockEvent = {};
        client.wss.onopen(mockEvent);
        
        expect(mockOpenCallback)
            .toHaveBeenCalledWith(mockEvent);
    });

    it('sends a customerinteraction message after the connection is opened', async () => {
        await client.openConnection(token);
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            request: {
                content: 'test'
            }
        };

        client.customerInteraction(payload);
        
        expect(global.WebSocket.prototype.send)
            .toHaveBeenCalledWith(expect.anything());
    });

	  it('validates a valid payload', async () => {
        await client.openConnection(token);
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            session: {
                session_id: "session_8f3a4b2c-9d1e-4567-8901-23456789abcd",
                trace_id: "trace_abc123",
                channel: {
                    medium: "chat",
                    section: "support_page",
                    language: "en-US",
                    location: "40.7128,-74.0060",
                    device_info: "iOS/18.2, iPhone15,3",
                    device_type: "mobile",
                    browser: "Safari 17.0",
                    metadata: []
                },
                interface: {
                    sdk_version: "3.1.1",
                    app_version: "2.1.0",
                    type: "custom_components",
                    category: "crm",
                    name: "test_app",
                    language: "en-US"
                },
                network: {
                    latency_ms: 120
                }
            },
            request: {
                request_id: "req_8f3a4b2c-9d1e-4567-8901-23456789abcd",
                context: {
                    tenant_id: "tenant_a1b2c3d4-e5f6-7890-1234-56789abcdef0",
                    organization_id: "org_f7e8d9c0-b1a2-3456-7890-123456789abc",
                    department_id: "dept_support",
                    operator_id: "op_123",
                    user_id: "user_456",
                    case_id: "case_789"
                },
                connections: {
                    parent_id: "parent_def456",
                    thread_id: "thread_9e8d7c6b-5a49-3827-1605-948372615abc",
                    journey_id: "journey_001"
                },
                attributes: {
                    type: "message",
                    action: "customerinteraction",
                    instruction: "Be helpful and professional",
                    content: "Help the user with their inquiry",
                    variant: "A"
                },
                reference: {
                    tags: ["test", "validation"],
                    labels: ["priority"],
                    ids: [
                        { name: "ticket_id", value: "T12345" }
                    ]
                },
                scope: {
                    conversations: [
                        {
                            timestamp: "2024-01-15T10:30:00.000Z",
                            participant_id: "user_2c4f8a9b-1d3e-5f70-8293-456789012def",
                            role: "EndUser",
                            display_name: "John Doe",
                            content: "I need help with my order"
                        },
                        {
                            timestamp: "2024-01-15T10:30:15.000Z",
                            participant_id: "agent_5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                            role: "Agent",
                            display_name: "Sarah Smith",
                            content: "Hello! I'd be happy to help you with your order."
                        }
                    ],
                    interactions: [
                        {
                            timestamp: "2024-01-15T10:30:00.000Z",
                            id: "int_123",
                            role: "System",
                            name: "order_lookup",
                            content: "Order lookup initiated"
                        }
                    ],
                    orders: [],
                    offers: [],
                    users: [],
                    operators: []
                },
                settings: {
                    disable_search: false,
                    disable_stream: false,
                    disable_sources: false,
                    disable_tools: false,
                    disable_browsing: false,
                    max_response_length: 2000,
                    output_language: "en-US"
                },
                cursor: {
                    since: "2024-01-15T10:00:00.000Z",
                    until: "2024-01-15T11:00:00.000Z"
                },
                a2a: [
                    {
                        id: "bot_55",
                        name: "Support Bot",
                        type: "chatbot"
                    }
                ]
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

	  it('sends a payload with a non-existing option', async () => {
        await client.openConnection(token);

		    client.on('error', error => {
            expect(error.category).toBe('VALIDATION');
            expect(error.code).toBe('PAYLOAD_SCHEMA_MISMATCH');

            const details = error.details;
			      expect(details[0].params.additionalProperty).toBe('invalid_thing');
		    });
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            invalid_thing: 1,
        };

        client.customerInteraction(payload);
    });

    it('sends a payload with an option of invalid type', async () => {
        await client.openConnection(token);

		    client.on('error', error => {
            expect(error.category).toBe('VALIDATION');
            expect(error.code).toBe('PAYLOAD_SCHEMA_MISMATCH');

            const details = error.details;
            expect(details[0].keyword).toBe('type');
            expect(details[0].params.type).toBe('string');
		    });
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            session: {
                // session_id should be a string
                session_id: 123,
            },
        };

        client.customerInteraction(payload);
    });

    it('checks if a payload sent with "variation" is converted to "variant"', async () => {
        await client.openConnection(token);

        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            request: {
                variation: 'b',
            }
        };

        const builtPayload = client.buildPayload('message', 'customerinteraction', payload);

        expect(builtPayload.request.attributes.variant).toBe('B')
    });

    it('validates conversations array with proper structure', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                scope: {
                    conversations: [
                        {
                            timestamp: "2024-01-15T10:30:00.000Z",
                            participant_id: "user_123",
                            role: "EndUser",
                            display_name: "Test User",
                            content: "Hello, I need help"
                        },
                        {
                            timestamp: "2024-01-15T10:30:15.000Z",
                            participant_id: "agent_456",
                            role: "Agent",
                            display_name: "Support Agent",
                            content: "How can I assist you today?"
                        }
                    ]
                }
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates interactions array with proper structure', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                scope: {
                    interactions: [
                        {
                            timestamp: "2024-01-15T10:30:00.000Z",
                            id: "interaction_001",
                            role: "System",
                            name: "order_lookup",
                            content: "Looking up order information"
                        }
                    ]
                }
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates reference object with tags, labels, and ids', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                reference: {
                    tags: ["urgent", "billing"],
                    labels: ["priority", "escalation"],
                    ids: [
                        { name: "ticket_id", value: "T12345" },
                        { name: "case_id", value: "C67890" }
                    ]
                }
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates cursor object with date-time format', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                cursor: {
                    since: "2024-01-15T10:30:00.000Z",
                    until: "2024-01-15T11:00:00.000Z"
                }
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates a2a (agent-to-agent) array structure', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                a2a: [
                    {
                        id: "bot_001",
                        name: "Customer Support Bot",
                        type: "chatbot"
                    }
                ]
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates all new settings fields', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                settings: {
                    disable_search: true,
                    disable_stream: false,
                    disable_sources: true,
                    disable_tools: false,
                    disable_browsing: true,
                    max_response_length: 1500,
                    output_language: "es-ES"
                }
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates channel object with all new fields', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace",
                channel: {
                    medium: "chat",
                    section: "checkout",
                    language: "en-US",
                    location: "40.7128,-74.0060",
                    device_info: "iOS/18.2, iPhone15,3",
                    device_type: "mobile",
                    browser: "Safari 17.0",
                    metadata: ["custom_data", "tracking_info"]
                }
            },
            request: {
                request_id: "test_request"
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates interface object with all fields', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace",
                interface: {
                    sdk_version: "3.1.1",
                    app_version: "2.1.0",
                    type: "custom_components",
                    category: "crm",
                    name: "salesforce",
                    language: "en-US"
                }
            },
            request: {
                request_id: "test_request"
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

    it('validates context object with all advanced fields', async () => {
        const payload = {
            session: {
                session_id: "test_session",
                trace_id: "test_trace"
            },
            request: {
                request_id: "test_request",
                context: {
                    tenant_id: "tenant_123",
                    organization_id: "org_456",
                    department_id: "dept_support",
                    operator_id: "op_789",
                    user_id: "user_012",
                    case_id: "case_345"
                }
            }
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });
});
