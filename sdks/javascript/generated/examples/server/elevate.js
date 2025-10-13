/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated elevate server example
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

    // Send elevate message when connected
    optaveClient.once('open', () => {
        console.log('🚀 Sending elevate request...');

        optaveClient.elevate({
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