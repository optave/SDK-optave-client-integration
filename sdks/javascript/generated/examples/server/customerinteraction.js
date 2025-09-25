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
          "action": "message",
          "headers": {
                    "correlationId": "a1b2c3d4-e5f6-7890-1234-56789ab2345",
                    "tenantId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
                    "traceId": "b2c3d4e5-f6g7-8901-2345-6789abcdef12",
                    "idempotencyKey": "c3d4e5f6-g7h8-9012-3456-789abcdef123",
                    "identifier": "message",
                    "action": "customerinteraction"
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