/**
 * Browser UMD Integration Example
 *
 * This example shows proper usage of the browser UMD build in various environments.
 * The UMD build exports OptaveJavaScriptSDK to globalThis for universal compatibility.
 *
 * FEATURES:
 * - Compatible with script tags, AMD, CommonJS, and global variable access
 * - CSP-compliant validation for strict security environments
 * - Works in Salesforce Lightning, WordPress, and other constrained environments
 */

// For UMD builds, the SDK should be available as a global variable when included via script tag
// HTML: <script src="dist/browser.umd.js"></script>

(function() {
  'use strict';

  // Check if OptaveJavaScriptSDK is available globally (script tag usage)
  var OptaveJavaScriptSDK = (typeof globalThis !== 'undefined' && globalThis.OptaveJavaScriptSDK) ||
                            (typeof window !== 'undefined' && window.OptaveJavaScriptSDK) ||
                            (typeof global !== 'undefined' && global.OptaveJavaScriptSDK);

  // If not available globally, try to load it (for Node.js testing)
  if (!OptaveJavaScriptSDK && typeof require !== 'undefined') {
    try {
      OptaveJavaScriptSDK = require('../dist/browser.umd.js');
    } catch (e) {
      console.error('Failed to load browser UMD:', e.message);
    }
  }

  if (!OptaveJavaScriptSDK) {
    console.error('OptaveJavaScriptSDK not found. Make sure to include browser.umd.js via script tag.');
    return;
  }

  /**
   * Browser UMD Configuration
   * Compatible with older browsers and module systems
   */
  var optaveClient = new OptaveJavaScriptSDK({
    websocketUrl: (window.OPTAVE_CONFIG && window.OPTAVE_CONFIG.websocketUrl) ||
                  'wss://ws-incubator.oco.optave.tech/',

    authTransport: 'subprotocol',

    tokenProvider: function() {
      return fetch('/api/optave/ws-ticket', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to get token: ' + response.status + ' ' + response.statusText);
        }
        return response.json();
      })
      .then(function(data) {
        return data.token;
      })
      .catch(function(error) {
        console.error('Token provider failed:', error);
        throw error;
      });
    },

    strictValidation: false // Browser UMD typically used in production
  });

  // Event handlers using traditional function syntax
  optaveClient.on('open', function() {
    console.log('✅ Browser UMD: WebSocket connection established');
    sendTestMessage();
  });

  optaveClient.on('message', function(payload) {
    try {
      var message = JSON.parse(payload);
      console.log('📨 Browser UMD: Received message:', {
        action: message.headers && message.headers.action,
        correlationId: message.headers && message.headers.correlationId
      });
    } catch (error) {
      console.error('Browser UMD: Failed to parse message:', error);
    }
  });

  optaveClient.on('error', function(error) {
    console.error('❌ Browser UMD: SDK error:', {
      category: error.category,
      code: error.code,
      message: error.message
    });
  });

  optaveClient.on('close', function(event) {
    console.log('🔌 Browser UMD: Connection closed:', {
      code: event.code,
      reason: event.reason
    });
  });

  // Helper function for generating IDs (simplified for UMD)
  function generateId() {
    return 'umd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Test function
  function sendTestMessage() {
    var threadId = 'browser-umd-thread-' + generateId();

    optaveClient.interaction({
      request: {
        connections: {
          threadId: threadId
        },
        scope: {
          conversations: [{
            conversationId: 'conv-' + Date.now(),
            participants: [{
              participantId: 'user_1',
              role: 'user',
              displayName: 'Browser UMD User'
            }],
            messages: [{
              participantId: 'user_1',
              content: 'Test message from Browser UMD build',
              timestamp: new Date().toISOString()
            }],
            metadata: {}
          }]
        }
      }
    });
  }

  // Connect function
  function connect() {
    try {
      optaveClient.openConnection();
    } catch (error) {
      console.error('❌ Browser UMD: Failed to connect:', error);
    }
  }

  // Cleanup function
  function cleanup() {
    if (optaveClient) {
      optaveClient.closeConnection();
      console.log('Browser UMD: Connection cleanup completed');
    }
  }

  // DOM integration with compatibility for older browsers
  function onDocumentReady(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(callback, 0);
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', callback);
    } else if (document.attachEvent) {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
          callback();
        }
      });
    }
  }

  onDocumentReady(function() {
    console.log('🚀 Browser UMD integration ready');

    // Set up UI event handlers
    var connectButton = document.getElementById('connect-umd');
    if (connectButton) {
      if (connectButton.addEventListener) {
        connectButton.addEventListener('click', connect);
      } else if (connectButton.attachEvent) {
        connectButton.attachEvent('onclick', connect);
      }
    }

    var disconnectButton = document.getElementById('disconnect-umd');
    if (disconnectButton) {
      if (disconnectButton.addEventListener) {
        disconnectButton.addEventListener('click', cleanup);
      } else if (disconnectButton.attachEvent) {
        disconnectButton.attachEvent('onclick', cleanup);
      }
    }
  });

  // Cleanup on page unload (with IE compatibility)
  if (window.addEventListener) {
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup); // For mobile browsers
  } else if (window.attachEvent) {
    window.attachEvent('onbeforeunload', cleanup);
  }

  // Export to global scope for external access
  window.OptaveBrowserUMDIntegration = {
    client: optaveClient,
    connect: connect,
    cleanup: cleanup
  };

})();

/**
 * Browser UMD Integration Notes:
 *
 * HTML USAGE EXAMPLE:
 * ```html
 * <script src="path/to/browser.umd.js"></script>
 * <script src="path/to/browser-umd-integration.js"></script>
 * <script>
 *   // SDK is available globally
 *   OptaveBrowserUMDIntegration.connect();
 * </script>
 * ```
 *
 * ✅ USE CASES:
 * - Legacy browsers (IE11+, older Chrome/Firefox)
 * - Applications using script tags without module bundlers
 * - WordPress, Drupal, or other CMS environments
 * - Legacy JavaScript codebases using var/function syntax
 * - Environments where ES modules are not supported
 *
 * ✅ FEATURES:
 * - Global variable access (OptaveJavaScriptSDK)
 * - IE11+ compatibility with polyfills
 * - Traditional event handling patterns
 * - No build tools required
 * - CSP-compliant validation (browser-optimized)
 *
 * ✅ COMPATIBILITY:
 * - Internet Explorer 11+
 * - Chrome 23+
 * - Firefox 21+
 * - Safari 6+
 * - Edge (all versions)
 *
 * ❌ NOT SUITABLE FOR:
 * - Modern ES6+ applications preferring import/export
 * - Node.js server environments
 * - Applications requiring tree-shaking
 * - TypeScript projects without declaration files
 */