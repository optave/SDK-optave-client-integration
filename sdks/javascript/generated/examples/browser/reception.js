/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated reception browser example
 * Generated from: Optave Client WebSocket API v3.2.1
 *
 * Client sends a reception action request
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
    sendReceptionRequest();
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('📨 Received message:', message);

    if (message.headers?.action === 'reception') {
        console.log('✅ reception response received:', message.payload);
    }
});

optaveClient.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

optaveClient.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

async function sendReceptionRequest() {
    try {
        console.log('🚀 Sending reception request...');

        const response = await optaveClient.reception({
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

        console.log('✅ reception request sent successfully:', response);
    } catch (error) {
        console.error('❌ Failed to send reception request:', error);
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