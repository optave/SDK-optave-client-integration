/**
 * Server ESM Integration Example
 *
 * This example demonstrates how to use the Optave SDK Server ESM build (server.mjs)
 * in Node.js environments with ES module support.
 */

// Import from server ESM build
import OptaveJavaScriptSDK from '../dist/server.mjs';

// Node.js specific imports
import process from 'process';

/**
 * Server ESM Configuration
 * Uses Node.js-specific features and process.env for environment variables
 */
const optaveClient = new OptaveJavaScriptSDK({
  websocketUrl: process.env.OPTAVE__WEBSOCKET_URL,

  // Server-side authentication with client credentials
  clientId: process.env.OPTAVE__CLIENT_ID,
  clientSecret: process.env.OPTAVE__CLIENT_SECRET,

  // Server can use either authentication method
  authTransport: 'subprotocol', // or 'query' based on your needs

  strictValidation: process.env.NODE_ENV === 'development'
});

// Event handlers
optaveClient.on('open', () => {
  console.log('✅ Server ESM: WebSocket connection established');
  sendTestMessage();
});

optaveClient.on('message', (payload) => {
  const message = JSON.parse(payload);
  console.log('📨 Server ESM: Received message:', {
    action: message.headers?.action,
    correlationId: message.headers?.correlationId
  });
});

optaveClient.on('error', (error) => {
  console.error('❌ Server ESM: SDK error:', {
    category: error.category,
    code: error.code,
    message: error.message
  });
});

optaveClient.on('close', (event) => {
  console.log('🔌 Server ESM: Connection closed:', {
    code: event.code,
    reason: event.reason
  });
});

// Test function
async function sendTestMessage() {
  try {
    const threadId = `server-esm-thread-${Date.now()}`;

    await optaveClient.interaction({
      request: {
        connections: {
          threadId: threadId
        },
        context: {
          organizationId: process.env.OPTAVE__ORGANIZATION_ID
        },
        scope: {
          conversations: [{
            conversationId: `conv-${Date.now()}`,
            participants: [{
              participantId: "user_1",
              role: "user",
              displayName: "Server ESM User"
            }],
            messages: [{
              participantId: "user_1",
              content: "Test message from Server ESM build",
              timestamp: new Date().toISOString()
            }],
            metadata: {}
          }]
        }
      }
    });

    console.log('✅ Server ESM: Test message sent successfully');
  } catch (error) {
    console.error('❌ Server ESM: Failed to send test message:', error);
  }
}

// Connect function
async function connect() {
  try {
    await optaveClient.openConnection();
  } catch (error) {
    console.error('❌ Server ESM: Failed to connect:', error);
  }
}

// Cleanup function
function cleanup() {
  optaveClient.closeConnection();
  console.log('Server ESM: Connection cleanup completed');
}

// Process event handlers for graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, gracefully shutting down...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, gracefully shutting down...');
  cleanup();
  process.exit(0);
});

// Auto-connect for testing (uncomment if desired)
// connect();

export { optaveClient, connect, cleanup };

/**
 * Server ESM Integration Notes:
 *
 * ✅ USE CASES:
 * - Node.js applications with type: "module" in package.json
 * - Modern Node.js environments (18+) with native ES module support
 * - Server-side applications, APIs, and microservices
 * - Applications using import/export syntax in Node.js
 *
 * ✅ FEATURES:
 * - Native ES modules in Node.js
 * - Full AJV validation support (server-side)
 * - Direct client credentials authentication
 * - Node.js-specific APIs (crypto, uuid, ws)
 * - Process event handling for graceful shutdown
 * - Complete WebSocket feature set
 *
 * ✅ ENVIRONMENT VARIABLES:
 * - OPTAVE__WEBSOCKET_URL: WebSocket endpoint URL
 * - OPTAVE__CLIENT_ID: Your client ID
 * - OPTAVE__CLIENT_SECRET: Your client secret
 * - OPTAVE__ORGANIZATION_ID: Your organization ID
 * - NODE_ENV: Environment (development/production)
 *
 * ❌ NOT SUITABLE FOR:
 * - Browser environments (security risk with client secrets)
 * - CommonJS-only Node.js applications
 * - Legacy Node.js versions without ESM support
 * - Applications requiring UMD compatibility
 */