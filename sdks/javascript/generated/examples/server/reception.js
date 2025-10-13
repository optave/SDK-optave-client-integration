/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated reception server example
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

    // Send reception message when connected
    optaveClient.once('open', () => {
        console.log('🚀 Sending reception request...');

        optaveClient.reception({
          "headers": {
                    "timestamp": "2024-01-15T10:30:00.000Z",
                    "networkLatencyMs": 120
          },
          "session": {
                    "sessionId": "b2c3d4f7-f6g7-8901-2345-67890abcdef1",
                    "channel": {
                              "browser": "Chrome 120.0",
                              "deviceInfo": "Windows 10, Desktop",
                              "deviceType": "desktop",
                              "location": "US",
                              "language": "en-US"
                    }
          },
          "context": {
                    "organizationId": "org-reception-789",
                    "userId": "user-reception-456",
                    "sessionId": "session-reception-123",
                    "timestamp": "2024-01-15T10:30:00.000Z"
          },
          "conversations": [
                    {
                              "participants": [
                                        {
                                                  "participantId": "system",
                                                  "role": "bot",
                                                  "displayName": "AI Assistant"
                                        },
                                        {
                                                  "participantId": "user-reception-456",
                                                  "role": "user",
                                                  "displayName": "Customer"
                                        }
                              ],
                              "messages": [
                                        {
                                                  "id": "msg-reception-001",
                                                  "participantId": "system",
                                                  "timestamp": "2024-01-15T10:30:00.000Z",
                                                  "content": "Message received and processed for reception"
                                        }
                              ]
                    }
          ]
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