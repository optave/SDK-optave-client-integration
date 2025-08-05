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
                session_id: "test_session",
                trace_id: "test_trace",
                channel: {
                    medium: "voice",
                    language: "en-US",
                },
                interface: {
                    type: "custom_components",
                    category: "app",
                    name: "test_app",
                    language: "en-US",
                }
            },
            request: {
                request_id: "test_request_001",
                context: {
                    tenant_id: "tenant_test",
                    organization_id: "org_test",
                },
                connections: {
                    parent_id: "",
                    thread_id: "thread_test_001",
                },
                attributes: {
                    type: "",
                    action: "",
                    instruction: "",
                    content: 'test',
                    variant: 'A',
                },
                scope: {
                    conversations: [
                        {
                            timestamp: "2024-01-15T10:30:00.000Z",
                            participant_id: "user_test_001",
                            role: 'EndUser',
                            display_name: 'test-message',
                            content: 'testing',
                        }
                    ]
                },
                settings: {
                    disable_stream: false,
                    output_language: 'en-US',
                }
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
});
