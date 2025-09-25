/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated insights browser example
 * Generated from: Optave Client WebSocket API v3.2.1
 *
 * Client sends an insights action request
 * Uses tokenProvider pattern for secure browser authentication.
 *
 * To regenerate: npm run spec:generate:examples
 */

// ✅ BROWSER: Import from browser build
import OptaveJavaScriptSDK from '../../dist/browser.mjs';

const optaveClient = new OptaveJavaScriptSDK({
    // ✅ BROWSER: Use import.meta.env (Vite/modern bundlers)
    websocketUrl: import.meta.env.VITE_OPTAVE__WEBSOCKET_URL,

    // ✅ BROWSER SECURITY: Never use clientSecret in browsers!
    tokenProvider: async () => {
        const response = await fetch('/api/optave/token', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.token;
    },

    // Optional browser configurations
    authTransport: 'subprotocol',
    strictValidation: true,
});

// Event listeners
optaveClient.on('open', () => {
    console.log('✅ Connected to Optave WebSocket');
    sendInsightsRequest();
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('📨 Received message:', message);

    if (message.headers?.action === 'insights') {
        console.log('✅ insights response received:', message.payload);
    }
});

optaveClient.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

optaveClient.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

async function sendInsightsRequest() {
    try {
        console.log('🚀 Sending insights request...');

        const response = await optaveClient.insights({
          "session": {
                    "sessionId": "a1b2c3e6-e5f6-7890-1234-56789abcdef0",
                    "channel": {
                              "browser": "Safari 17.0",
                              "deviceInfo": "iOS/18.2, iPhone15,3",
                              "deviceType": "mobile",
                              "language": "en-US",
                              "location": "40.7128,-74.0060",
                              "medium": "chat",
                              "section": "support_page"
                    },
                    "interface": {
                              "appVersion": "2.1.0",
                              "category": "crm",
                              "language": "en-US",
                              "name": "my_support_app",
                              "type": "custom_components"
                    }
          },
          "request": {
                    "requestId": "89012345-6789-0123-456789abcdef",
                    "attributes": {
                              "variant": "A"
                    },
                    "connections": {
                              "threadId": "9e8d3c6b-5a4f-3e2d-1c0b-0987654321ab"
                    },
                    "context": {
                              "organizationId": "f7e8d9c0-b1a2-3456-7890-123456789abc"
                    },
                    "scope": {
                              "conversations": [
                                        {
                                                  "conversationId": "conv-012",
                                                  "participants": [
                                                            {
                                                                      "participantId": "2c4f8a9b-1d3e-5f70-8293-456789012def",
                                                                      "displayName": "John Doe",
                                                                      "role": "user"
                                                            },
                                                            {
                                                                      "participantId": "5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                                                                      "displayName": "Sarah Smith",
                                                                      "role": "operator"
                                                            }
                                                  ],
                                                  "messages": [
                                                            {
                                                                      "content": "Hi, can you help me?",
                                                                      "participantId": "2c4f8a9b-1d3e-5f70-8293-456789012def",
                                                                      "timestamp": "2024-01-15T10:30:00.000Z"
                                                            },
                                                            {
                                                                      "content": "Hello! I'd be happy to assist you today. What can I help you with?",
                                                                      "participantId": "5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                                                                      "timestamp": "2024-01-15T10:30:15.000Z"
                                                            }
                                                  ]
                                        }
                              ]
                    }
          }
});

        console.log('✅ insights request sent successfully:', response);
    } catch (error) {
        console.error('❌ Failed to send insights request:', error);
    }
}

// Connect to WebSocket
optaveClient.openConnection();

// ✅ BROWSER: Clean up on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        optaveClient.closeConnection();
    });
}

// Export for use in other modules
export { optaveClient };