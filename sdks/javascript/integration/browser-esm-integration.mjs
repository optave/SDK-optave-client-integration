/**
 * Browser ESM Integration Example
 *
 * This example demonstrates how to use the Optave SDK Browser ESM build (browser.mjs)
 * in modern browsers with ES module support.
 */

// Import from browser ESM build
import OptaveJavaScriptSDK from '../dist/browser.mjs';

// Import environment adapter for consistent ID generation
import { getCryptoSync } from '../runtime/platform/environment-adapter.js';

/**
 * Browser ESM Configuration
 * Uses modern ES modules and import.meta.env for environment variables
 */
const optaveClient = new OptaveJavaScriptSDK({
  websocketUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPTAVE__WEBSOCKET_URL),
  authRequired: false
});

// Event handlers
optaveClient.on('open', () => {
  console.log('✅ Browser ESM: WebSocket connection established');
  sendTestMessage();
});

optaveClient.on('message', (payload) => {
  console.log('📨 Browser ESM: Received message:', JSON.parse(payload));
});

optaveClient.on('error', (error) => {
  console.error('❌ Browser ESM: SDK error:', error);
});

optaveClient.on('close', (event) => {
  console.log('🔌 Browser ESM: Connection closed:', event);
});

// Test function
function sendTestMessage() {
  optaveClient.interaction({
    request: {
      connections: {
        threadId: "browser-esm-thread-" + getCryptoSync().generateShortId()
      },
      scope: {
        conversations: [{
          conversationId: `conv-${Date.now()}`,
          participants: [{
            participantId: "user-1",
            role: "user",
            displayName: "Browser ESM User"
          }],
          messages: [{
            timestamp: new Date().toISOString(),
            participantId: "user-1",
            content: "Test message from Browser ESM build"
          }],
          metadata: {}
        }]
      }
    }
  });
}

// Connect function
function connect() {
  optaveClient.openConnection();
}

// Cleanup function
function cleanup() {
  optaveClient.closeConnection();
}

// DOM integration
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Browser ESM integration ready');

    // Auto-connect for testing (uncomment if desired)
    // connect();
  });

  window.addEventListener('beforeunload', cleanup);
}

export { optaveClient, connect, cleanup };

/**
 * Browser ESM Integration Notes:
 *
 * ✅ USE CASES:
 * - Modern browsers with native ES module support
 * - Vite, Rollup, or other ESM-first bundlers
 * - Applications using import/export syntax
 * - Development environments with hot module replacement
 *
 * ✅ FEATURES:
 * - Native ES modules (import/export)
 * - Tree-shaking support for optimal bundle size
 * - import.meta.env for environment variables
 * - Browser-optimized crypto polyfills
 * - CSP-compliant validation (no AJV in browser)
 *
 * ❌ NOT SUITABLE FOR:
 * - Legacy browsers without ES module support
 * - CommonJS-only environments
 * - Applications requiring UMD global variables
 * - Older bundlers without ESM support
 */