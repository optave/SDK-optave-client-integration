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
});
