const OptaveJavascriptSDK = require('../main');
const EventEmitter = require('events');

const token = 'mocked_token';

global.WebSocket = jest.fn();
global.WebSocket.prototype.send = jest.fn();
global.WebSocket.prototype.close = jest.fn();

describe('OptaveJavascriptSDK', () => {
    let client;

    beforeEach(() => {
        client = new OptaveJavascriptSDK({
            websocketUrl: 'someurl'
        });
    });

    it('is an instance of EventEmitter', () => {
        expect(client).toBeInstanceOf(EventEmitter);
    });

    it('tries to open an connection without a Websocket URL', () => {
        const c = new OptaveJavascriptSDK({});

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

	it('detects an invalid schema', async () => {
        await client.openConnection(token);
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            invalid_thing: 1,
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(false);
    });

	it('validates a payload with a non-existing option', async () => {
        await client.openConnection(token);
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            invalid_thing: 1,
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(false);
    });

	it('validates a valid payload', async () => {
        await client.openConnection(token);
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            user: {
                user_name: 'test',
            },
            agent: {
                agent_name: 'test',
            },
            session: {
                user_perspective: [
                    {
                        role: 'EndUser',
                        content: 'testing',
                        name: 'test-message',
                    }
                ]
            },
            request: {
                output_language: 'en-US',
                interface_language: 'en-US',
                settings: {
                    disable_stream: false,
                },
                content: 'test',
                medium: 'voice',
            },
        };

        const validationResult = client.validate(payload);
        expect(validationResult).toBe(true);
    });

	it('sends a payload with a non-existing option', async () => {
        await client.openConnection(token);

		client.on('error', error => {
			expect(error[0].params.additionalProperty).toBe('invalid_thing');
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
			expect(error[0].keyword).toBe('type');
			expect(error[0].params.type).toBe('string');
		});
        
        const mockEvent = {};
        client.wss.onopen(mockEvent);

        const payload = {
            user: {
                // user_name should be a string
                user_name: 123,
            },
        };

        client.customerInteraction(payload);
    });
});
