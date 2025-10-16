/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated customerinteraction browser example
 * Generated from: Optave Client WebSocket API v3.2.1
 *
 * (Deprecated) Client sends a customer interaction action request (use interaction)
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
        const response = await fetch('/auth/oauth2/token', {
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
    sendCustomerinteractionRequest();
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('📨 Received message:', message);

    if (message.headers?.action === 'customerinteraction') {
        console.log('✅ customerinteraction response received:', message.payload);
    }
});

optaveClient.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

optaveClient.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

async function sendCustomerinteractionRequest() {
    try {
        console.log('🚀 Sending customerinteraction request...');

        const response = await optaveClient.customerinteraction({
          "headers": {
                    "timestamp": "2024-01-15T10:30:00.000Z",
                    "networkLatencyMs": 120
          },
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
                    "requestId": "a1b2c3d4-e5f6-7890-1234-56789ab2345",
                    "attributes": {
                              "variant": "A"
                    },
                    "connections": {
                              "threadId": "9e8d7c6b-5a49-3827-1605-948372615abc"
                    },
                    "context": {
                              "organizationId": "f7e8d9c0-b1a2-3456-7890-123456789abc"
                    },
                    "resources": {
                              "links": [
                                        {
                                                  "expires_at": "2025-08-06T00:00:00Z",
                                                  "html": false,
                                                  "id": "20382320302",
                                                  "label": "Complete Payment",
                                                  "type": "payment_link",
                                                  "url": "https://checkout.stripe.com/pay/cs_test..."
                                        }
                              ]
                    },
                    "scope": {
                              "conversations": [
                                        {
                                                  "conversationId": "conv-456",
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

        console.log('✅ customerinteraction request sent successfully:', response);
    } catch (error) {
        console.error('❌ Failed to send customerinteraction request:', error);
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