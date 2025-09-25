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