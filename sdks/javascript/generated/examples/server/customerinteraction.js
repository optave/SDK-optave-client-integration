/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated customerinteraction server example
 * Generated from: Optave Client WebSocket API v3.2.1
 *
 * To regenerate: npm run spec:generate:examples
 */

// ✅ SERVER: Import from Node.js build
import OptaveJavaScriptSDK from '../../dist/server.mjs';

const optaveClient = new OptaveJavaScriptSDK({
    // Required: WebSocket server URL
    websocketUrl: process.env.OPTAVE__WEBSOCKET_URL,

    // Server-side authentication (secure environments only)
    authenticationUrl: process.env.OPTAVE__AUTHENTICATION_URL,
    clientId: process.env.OPTAVE__CLIENT_ID,
    // ✅ SERVER ONLY: clientSecret is safe here
    clientSecret: process.env.OPTAVE__CLIENT_SECRET,
});

async function run() {
    // Listen for messages
    optaveClient.on('message', payload => {
        const message = JSON.parse(payload);
        const { actionType, state, action } = message;
        console.log(`Action: ${action} / State: ${state} / Action Type: ${actionType}`);
    });

    // Handle errors
    optaveClient.on('error', error => {
        console.error('Error:', error);
    });

    // Send customerinteraction message when connected
    optaveClient.once('open', () => {
        console.log('🚀 Sending customerinteraction request...');

        optaveClient.customerinteraction({
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
    });

    // Authenticate and connect
    try {
        const token = await optaveClient.authenticate();
        optaveClient.openConnection(token);
    } catch (error) {
        console.error('Failed to authenticate and connect:', error);
    }
}

run();