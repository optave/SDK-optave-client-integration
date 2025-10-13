/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated elevate browser example
 * Generated from: Optave Client WebSocket API v3.2.1
 *
 * Client sends an elevate action request
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
    sendElevateRequest();
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('📨 Received message:', message);

    if (message.headers?.action === 'elevate') {
        console.log('✅ elevate response received:', message.payload);
    }
});

optaveClient.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

optaveClient.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

async function sendElevateRequest() {
    try {
        console.log('🚀 Sending elevate request...');

        const response = await optaveClient.elevate({
          "headers": {
                    "timestamp": "2024-01-15T10:30:00.000Z",
                    "networkLatencyMs": 120
          },
          "session": {
                    "sessionId": "79012345-6789-0123-456789abcdef",
                    "channel": {
                              "browser": "Safari 17.0",
                              "deviceInfo": "iOS/18.2, iPhone15,3",
                              "deviceType": "mobile",
                              "language": "en-US",
                              "location": "40.7128,-74.0060",
                              "medium": "chat",
                              "section": "support_chat"
                    },
                    "interface": {
                              "appVersion": "2.1.0",
                              "category": "crm",
                              "language": "en-US",
                              "name": "support_dashboard",
                              "type": "custom_components"
                    }
          },
          "request": {
                    "requestId": "89012345-6789-0123-456789abcdef",
                    "attributes": {
                              "content": "Hello! How can I assist you today?",
                              "variant": "A"
                    },
                    "connections": {
                              "parentId": "9e8d7c6b-5a4f-3e2d-1c0b-0987654321ab",
                              "threadId": "9e8d3c6b-5a4f-3e2d-1c0b-0987654321ab"
                    },
                    "context": {
                              "organizationId": "f7e8d9c0-b1a2-3456-7890-123456789abc"
                    },
                    "scope": {
                              "conversations": [
                                        {
                                                  "conversationId": "conv-789",
                                                  "participants": [
                                                            {
                                                                      "participantId": "2c4f8a9b-1d3e-5f70-8293-456789012def",
                                                                      "displayName": "John Doe",
                                                                      "role": "user"
                                                            }
                                                  ],
                                                  "messages": [
                                                            {
                                                                      "content": "Hi, can you help me?",
                                                                      "participantId": "2c4f8a9b-1d3e-5f70-8293-456789012def",
                                                                      "timestamp": "2024-01-15T10:30:00.000Z"
                                                            }
                                                  ]
                                        }
                              ]
                    }
          }
});

        console.log('✅ elevate request sent successfully:', response);
    } catch (error) {
        console.error('❌ Failed to send elevate request:', error);
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