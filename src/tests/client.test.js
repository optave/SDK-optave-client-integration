const OptaveClientSDK = require('../main');
const EventEmitter = require('events');

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mocked-uuid') }));
jest.mock('../emitEvent');
jest.mock('../errorHandler', () => ({
	handleError: jest.fn((emitter, error, action, actionType) => {
		emitter.emit('error', {
			action,
			actionType,
			message: error,
		});
	}),
	handleWebSocketError: jest.fn((emitter, event, action, actionType) => {
		emitter.emit('error', {
			action,
			actionType,
			message: 'WebSocket error occurred.',
			details: event,
		});
	}),
	handleTimeoutError: jest.fn((emitter, message, action, actionType) => {
		emitter.emit('error', {
			action,
			actionType,
			message,
		});
	}),
	validateInputs: jest.fn((emitter, inputs, action, actionType, schema) => {
		const errors = [];
        for (const key in schema) {
            const fieldRules = schema[key];
            const value = inputs.payload[key];
            if (fieldRules.required && (value === undefined || value === null)) {
                errors.push({
                    field: key,
                    message: `${key} is required`,
                });
            } else if (fieldRules.type && value !== undefined && typeof value !== fieldRules.type) {
                // Only validate type if `type` is explicitly defined in the schema
                errors.push({
                    field: key,
                    message: `${key} must be a ${fieldRules.type}`,
                });
            }
        }
		if (!inputs.action) {
			errors.push({
				code: 'missing_field',
				field: 'action',
				message: 'Action is required',
			});
		}
		if (!inputs.payload || typeof inputs.payload !== 'object') {
			errors.push({
				code: 'invalid_type',
				field: 'payload',
				message: 'Payload must be an object',
			});
		}
		if (errors.length > 0) {
			emitter.emit('error', {
				action,
				actionType,
				message: 'Input validation errors',
				details: errors,
			});
			return { valid: false, errors }; 
		}
		return { valid: true, errors: undefined }; 
	}),
}));

const token = 'mocked_token';

global.WebSocket = jest.fn();
global.WebSocket.prototype.send = jest.fn();
global.WebSocket.prototype.close = jest.fn();
global.WebSocket.prototype.onmessage = jest.fn();

describe('OptaveClientSDK', () => {
	let client;

	beforeEach(() => {
		client = new OptaveClientSDK({
			websocketUrl: 'someurl',
		});
	});

	it('is an instance of EventEmitter', () => {
		expect(client).toBeInstanceOf(EventEmitter);
	});

	it('tries to open a connection without a Websocket URL', () => {
		const c = new OptaveClientSDK({});

		const mockErrorCallback = jest.fn();
		c.on('error', mockErrorCallback);

		c.openConnection();

		expect(mockErrorCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'openConnection',
				actionType: 'validation',
				message: 'WebSocket URL is missing',
			})
		);
	});

	it('opens a connection', async () => {
		await client.openConnection(token);

		expect(global.WebSocket).toHaveBeenCalledWith(
			expect.stringContaining('mocked_token')
		);
	});

	it('emits an event when the connection is opened', async () => {
		const mockOpenCallback = jest.fn();
		client.on('open', mockOpenCallback);

		client.openConnection();

		const mockEvent = {};
		client.wss.onopen(mockEvent);

		expect(mockOpenCallback).toHaveBeenCalledWith(mockEvent);
	});

	it('handles incoming messages from WebSocket', async () => {
		await client.openConnection(token);

		const mockMessageCallback = jest.fn();
		client.on('message', mockMessageCallback);

		const mockMessageEvent = {
			data: JSON.stringify({ state: 'message', content: 'test message' }),
		};

		client.wss.onmessage(mockMessageEvent);

		expect(mockMessageCallback).toHaveBeenCalledWith({
			state: 'message',
			content: 'test message',
		});
	});

	it('sends a customerinteraction message after the connection is opened', async () => {
		await client.openConnection(token);

		const mockEvent = {};
		client.wss.onopen(mockEvent);

		const payload = {
			request: {
				content: 'test',
			},
		};

		client.customerInteraction(payload);

		expect(global.WebSocket.prototype.send).toHaveBeenCalledWith(
			expect.anything()
		);
	});
});

describe('WebSocket Error Handling', () => {
	let client;

	beforeEach(() => {
		client = new OptaveClientSDK({
			websocketUrl: 'someurl',
		});
	});

	it('is an instance of EventEmitter', () => {
		expect(client).toBeInstanceOf(EventEmitter);
	});

	it('handles WebSocket error events', () => {
		const mockErrorCallback = jest.fn();
		client.on('error', mockErrorCallback);

		client.openConnection(token);

		const mockErrorEvent = { code: 1006, reason: 'Unexpected error' };
		client.wss.onerror(mockErrorEvent);

		expect(mockErrorCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'websocket',
				actionType: 'error',
				message: 'WebSocket error occurred.',
				details: mockErrorEvent,
			})
		);
	});

	it('handles WebSocket close events', () => {
		const mockCloseCallback = jest.fn();
		client.on('error', mockCloseCallback);

		client.openConnection(token);

		const mockCloseEvent = {
			code: 1000,
			reason: 'Normal closure',
			description: 'Normal Closure: The connection was closed normally.',
			httpEquivalent: 200,
		};
		client.wss.onclose(mockCloseEvent);

		expect(mockCloseCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'close',
				actionType: 'websocket',
				message: {
					message: 'WebSocket closed',
					details: mockCloseEvent,
				},
			})
		);
	});

	it('handles WebSocket invalid message format', () => {
		const mockErrorCallback = jest.fn();
		client.on('error', mockErrorCallback);

		client.openConnection(token);

		const invalidMessage = '{ invalid json';
		client.wss.onmessage({ data: invalidMessage });

		expect(mockErrorCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'messageHandler',
				actionType: 'error',
				message: {
					message: 'Invalid message format',
					error: expect.stringContaining("Expected property name or '}'"),
				},
			})
		);
	});

	it('handles WebSocket timeout errors', () => {
		jest.useFakeTimers(); // Enable fake timers

		const mockErrorCallback = jest.fn();
		client.on('error', mockErrorCallback);

		client.openConnection(token);

		// Simulate WebSocket timeout
		jest.advanceTimersByTime(10000);

		expect(mockErrorCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'openConnection',
				actionType: 'websocket',
				message: 'WebSocket connection timed out',
			})
		);

		jest.useRealTimers(); // Reset to real timers after the test
	});
});

describe('validateInputs', () => {
	let client;

	beforeEach(() => {
		client = new OptaveClientSDK({
			websocketUrl: 'someurl',
		});
	});

	it('validates inputs successfully', () => {
		const mockEmitter = new EventEmitter();
		const mockErrorCallback = jest.fn();
		mockEmitter.on('error', mockErrorCallback);
		const inputs = {
			action: 'testAction',
			payload: {
				data: 'testData',
			},
		};

		const isValid = require('../errorHandler').validateInputs(
			mockEmitter,
			inputs,
			'testAction',
			'validation'
		);

		expect(isValid.valid).toBe(true);
        expect(mockErrorCallback).not.toHaveBeenCalled();
	});

	it('fails validation when action is missing', () => {
		const mockEmitter = new EventEmitter();
		const mockErrorCallback = jest.fn();
		mockEmitter.on('error', mockErrorCallback);

		const inputs = {
			payload: {
				data: 'testData',
			},
		};

		const isValid = require('../errorHandler').validateInputs(
			mockEmitter,
			inputs,
			'testAction',
			'validation'
		);

		expect(isValid.valid).toBe(false);
		expect(mockErrorCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'testAction',
				actionType: 'validation',
				message: 'Input validation errors',
				details: expect.arrayContaining([
					expect.objectContaining({
						code: 'missing_field',
						field: 'action',
						message: 'Action is required',
					}),
				]),
			})
		);
	});

	it('fails validation when payload is not an object', () => {
		const mockEmitter = new EventEmitter();
		const mockErrorCallback = jest.fn();
		mockEmitter.on('error', mockErrorCallback);

		const inputs = {
			action: 'testAction',
			payload: 'invalidPayload',
		};

		const isValid = require('../errorHandler').validateInputs(
			mockEmitter,
			inputs,
			'testAction',
			'validation'
		);

		expect(isValid.valid).toBe(false);
		expect(mockErrorCallback).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'testAction',
				actionType: 'validation',
				message: 'Input validation errors',
				details: expect.arrayContaining([
					expect.objectContaining({
						code: 'invalid_type',
						field: 'payload',
						message: 'Payload must be an object',
					}),
				]),
			})
		);
	});

	it('sends valid payloads successfully', () => {
		client.openConnection(token);
		client.wss.readyState = WebSocket.OPEN;

		const validPayload = {
			user: { user_name: 'testUser' },
			agent: { agent_name: 'testAgent' },
			request: { content: 'Test content', medium: 'voice' },
		};

		client.customerInteraction(validPayload);

		expect(global.WebSocket.prototype.send).toHaveBeenCalledWith(
			expect.any(String)
		);
	});

    it('should return valid for correct inputs and schema', () => {
        const mockEmitter = new EventEmitter();
        const mockErrorCallback = jest.fn();
		mockEmitter.on('error', mockErrorCallback);
        const inputs = {
            action: 'create',
            payload: {
                name: 'John',
                age: 30,
            },
        };

        const schema = {
            name: { type: 'string', required: true },
            age: { type: 'number', required: true },
        };

        const isValid = require('../errorHandler').validateInputs(
            mockEmitter,
            inputs,
            'testAction',
            'testType',
            schema
        );

        expect(isValid.valid).toBe(true);
        expect(isValid.errors).toBeUndefined();
        expect(mockErrorCallback).not.toHaveBeenCalled();
    });

    it('should return errors for missing required fields', () => {
        const mockEmitter = new EventEmitter();
        const mockErrorCallback = jest.fn();
        mockEmitter.on('error', mockErrorCallback);
    
        const inputs = {
            action: 'create',
            payload: {
                age: 30, // Missing 'name'
            },
        };
    
        const schema = {
            name: { type: 'string', required: true },
            age: { type: 'number', required: true },
        };
    
        const isValid = require('../errorHandler').validateInputs(
            mockEmitter,
            inputs,
            'testAction',
            'testType',
            schema
        );
    
        expect(isValid.valid).toBe(false);
        expect(isValid.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ field: 'name', message: 'name is required' }),
            ])
        );
    
        expect(mockErrorCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'testAction',
                actionType: 'testType',
                message: 'Input validation errors',
                details: expect.arrayContaining([
                    expect.objectContaining({ field: 'name', message: 'name is required' }),
                ]),
            })
        );
    });
    
    it('should return errors for incorrect data types', () => {
        const mockEmitter = new EventEmitter();
        const mockErrorCallback = jest.fn();
        mockEmitter.on('error', mockErrorCallback);
    
        const inputs = {
            action: 'create',
            payload: {
                name: 'John',
                age: 'thirty', // Incorrect type for age
            },
        };
    
        const schema = {
            name: { type: 'string', required: true },
            age: { type: 'number', required: true },
        };
    
        const isValid = require('../errorHandler').validateInputs(
            mockEmitter,
            inputs,
            'testAction',
            'testType',
            schema
        );
    
        expect(isValid.valid).toBe(false);
        expect(isValid.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ field: 'age', message: 'age must be a number' }),
            ])
        );
        expect(mockErrorCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Input validation errors',
                details: expect.arrayContaining([
                    expect.objectContaining({ field: 'age', message: 'age must be a number' }),
                ]),
            })
        );
    });
   	
});
