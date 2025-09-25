# Optave Client SDK Documentation

Welcome to the Optave Client SDK documentation. This guide provides an overview of the SDK, instructions on how to set it up, and examples to help you integrate it seamlessly into your JavaScript projects.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Build System & Imports](#build-system--imports)
4. [Configuration](#configuration)
5. [Authentication](#authentication)
6. [Security Best Practices](#security-best-practices)
7. [Establishing a WebSocket Connection](#establishing-a-websocket-connection)
8. [Event Handling](#event-handling)
9. [Sending Messages](#sending-messages)
10. [Payload Structure](#payload-structure)
11. [Example Usage](#example-usage)
12. [API Reference](#api-reference)
13. [Error Handling](#error-handling)

## Introduction

The **Optave Client SDK** is a JavaScript library designed to facilitate seamless communication between your application and the Optave backend services via WebSockets and RESTful APIs. It provides a structured way to authenticate, manage sessions, handle user interactions, and send various types of messages with ease.

Key Features:

- **Event-Driven Architecture**: Leveraging Node.js's `EventEmitter` to handle asynchronous events.
- **Authentication Support**: Securely authenticate using client credentials.
- **WebSocket Management**: Easily establish and manage WebSocket connections.
- **Structured Payloads**: Automatically merges user-provided data with default payload structures.
- **Extensible Methods**: Predefined methods for common actions like adjusting settings, elevating issues, summarizing interactions, and more.

## Installation

To install the Optave Client SDK, use npm or yarn:

```bash
npm install @optave/client-sdk
```

or

```bash
yarn add @optave/client-sdk
```

### Optional Performance Dependencies

For enhanced WebSocket performance in Node.js server environments, you can install the following optional native dependencies:

```bash
npm install --save-optional bufferutil utf-8-validate
```

These optional dependencies provide significant performance improvements:

- **bufferutil**: Enables faster WebSocket frame masking and unmasking operations using native C++ implementations
- **utf-8-validate**: Provides efficient UTF-8 validation for WebSocket messages as required by the RFC specification

**Benefits:**
- Up to 2x faster WebSocket frame processing
- Reduced CPU usage for high-throughput applications
- Automatic fallback to JavaScript implementations if not available

**Note:** These dependencies are only beneficial in Node.js server environments and are not needed for browser applications. The SDK works perfectly without them - they simply provide performance optimizations when available.

## Build System & Imports

The Optave Client SDK provides multiple build targets optimized for different environments. The package automatically selects the appropriate build based on your environment and import method.

### Available Builds

The SDK provides four optimized builds, each tailored for specific deployment environments and security requirements:

| Build | Module Format | Allows clientSecret | AJV Validation | CSP Safe | Intended Environments | Size (Uncompressed) | Size (Gzipped) |
|-------|---------------|-------------------|----------------|----------|---------------------|-------------------|----------------|
| **Browser ESM** | ES Module | ❌ No | ❌ External Only | ✅ Yes | Modern browsers, Vite, Webpack 5+, bundled apps | ~66KB | ~17KB |
| **Browser UMD** | UMD | ❌ No | ❌ External Only | ✅ Yes | Salesforce Lightning, CDN, legacy browsers, CSP environments | ~222KB | ~46KB |
| **Server ESM** | ES Module | ✅ Yes | ✅ Full AJV | ❌ No | Node.js servers, microservices, backend APIs | ~181KB | ~50KB |
| **Server UMD** | UMD | ✅ Yes | ❌ CSP-Safe Only | ✅ Yes | Salesforce backend, mixed browser environments, internal tooling | ~163KB | ~36KB |

### Build Selection Guide

**🔒 Security & CSP Compliance**
- **Browser builds** are CSP-safe and exclude client secrets for security
- **Server builds** allow client secrets and include full validation for backend use
- All builds support token-based authentication via `tokenProvider`

**📦 Bundle Size Impact**
- **ESM builds** are optimized for modern bundlers with tree-shaking
- **Browser ESM** is smallest when bundled (external dependencies)
- **UMD builds** are self-contained but larger (bundled dependencies)

**🚀 Performance Characteristics**
- **Browser ESM**: Fastest loading, tree-shakeable, modern JavaScript
- **Browser UMD**: Compatible with all environments, no bundler required
- **Server ESM**: Optimized for Node.js with native WebSocket support
- **Server UMD**: Maximum compatibility across Node.js versions

**⚙️ Validation Strategy**
- **Browser builds**: Use lightweight, CSP-safe validation (no AJV)
- **Server ESM**: Includes full AJV schema validation for data integrity
- **Server UMD**: Uses CSP-safe validation (no AJV) for Salesforce compatibility
- All builds validate required fields and basic payload structure

### Automatic Build Selection

**Default Import (Recommended):**
```javascript
import OptaveJavaScriptSDK from '@optave/client-sdk';
// Automatically selects:
// - browser.mjs in browser environments
// - server.mjs in Node.js environments
```

### Explicit Build Selection

**Browser Environments:**
```javascript
// ES Module (recommended for modern bundlers)
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';
// or
import OptaveJavaScriptSDK from '@optave/client-sdk/browser-esm';

// UMD (for legacy browsers or CDN usage)
import OptaveJavaScriptSDK from '@optave/client-sdk/browser-umd';

```

**Node.js Environments:**
```javascript
// ES Module (recommended for modern Node.js)
import OptaveJavaScriptSDK from '@optave/client-sdk/server';
// or
import OptaveJavaScriptSDK from '@optave/client-sdk/server-esm';

// UMD (works with CommonJS require() for mixed environments)
const OptaveJavaScriptSDK = require('@optave/client-sdk/server-umd');
```

### CDN Usage (Browser Only)

**ES Module CDN:**
```html
<script type="module">
  import OptaveJavaScriptSDK from 'https://unpkg.com/@optave/client-sdk/dist/browser.mjs';

  const sdk = new OptaveJavaScriptSDK({
    websocketUrl: 'wss://api.optave.com/ws',
    // ... configuration
  });
</script>
```

**UMD CDN (Global Variable):**
```html
<script src="https://unpkg.com/@optave/client-sdk/dist/browser.umd.js"></script>
<script>
  // OptaveJavaScriptSDK is now available globally
  const sdk = new OptaveJavaScriptSDK({
    websocketUrl: 'wss://api.optave.com/ws',
    // ... configuration
  });
</script>
```


### Framework-Specific Import Examples

**Vite (Vue/React/Vanilla):**
```javascript
// Automatic selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Explicit browser build
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';
```

**Webpack (Create React App, Next.js):**
```javascript
// Automatic selection works with Webpack 5+
import OptaveJavaScriptSDK from '@optave/client-sdk';

// For older Webpack versions, use explicit imports
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';
```

**Node.js (Express, Fastify, etc.):**
```javascript
// ES Modules (package.json has "type": "module")
import OptaveJavaScriptSDK from '@optave/client-sdk';

// UMD (works with CommonJS require())
const OptaveJavaScriptSDK = require('@optave/client-sdk/server-umd');
```

**TypeScript:**
```typescript
// Full TypeScript support included
import OptaveJavaScriptSDK from '@optave/client-sdk';

const sdk = new OptaveJavaScriptSDK({
  websocketUrl: process.env.OPTAVE__WEBSOCKET_URL!,
  // TypeScript will provide full intellisense and type checking
});
```

### Build Optimization Notes

- **Browser builds** exclude Node.js-specific dependencies (like `ws` package)
- **Server builds** include WebSocket implementation and Node.js optimizations
- **ESM builds** are smaller and faster to load
- **UMD builds** have broader compatibility but are larger
- All builds include full TypeScript definitions
- **CSP Compliance**: Browser builds are optimized for strict Content Security Policy environments, excluding AJV and using platform-specific implementations that don't require `unsafe-eval` permissions. This enables compatibility with environments like Salesforce Lightning, enterprise applications, and other CSP-restricted platforms.

### Build Governance & Quality Assurance

The SDK implements a comprehensive build governance system ensuring quality and compatibility across all environments:

#### Bundle Size Monitoring

```bash
# Check current bundle sizes against budget limits
npm run size

# Generate detailed size report with build comparison
npm run size:report

# Analyze bundle composition (interactive visualization)
npm run analyze

# Create baseline for size tracking and regression detection
npm run size:baseline
```

**Current Size Budgets:**
- Browser UMD: 250KB limit (current: ~222KB) ✅
- Server UMD: 180KB limit (current: ~163KB) ✅
- Server UMD Minified: 70KB limit (current: ~62KB) ✅
- Browser ESM: 80KB limit (current: ~66KB) ✅
- Server ESM: 200KB limit (current: ~181KB) ✅

#### Multi-Build Testing Strategy

The SDK uses comprehensive multi-build testing to ensure reliability across all environments:

```bash
# Test all build variants with comprehensive validation
npm run test:all-builds

# Test specific build targets
npm run test:server          # Server ESM build (Node.js with full AJV)
npm run test:browser         # Browser ESM build (modern bundlers)
npm run test:umd-server      # Server UMD build (mixed environments)
npm run test:umd-browser     # Browser UMD build (legacy/CDN)
npm run test:umd-salesforce  # Salesforce Lightning compatibility

# Build quality validation
npm run test:build-matrix    # Matrix testing across all builds
npm run test:csp-compliance  # CSP compliance validation
npm run test:memory          # Memory usage and leak detection
```

#### Build System Features

**Unified Build Environment:**
- Standardized `FULL=1` environment variable for non-minified debugging builds
- External source maps for CSP compliance (`generate-source-maps.js`)
- Comprehensive build validation and artifact testing

**Quality Assurance:**
- Build matrix testing ensures consistency across all variants
- CSP compliance validation for enterprise environments
- Memory leak detection and performance monitoring
- Bundle size regression prevention with automated budgets

**Size Optimization Tips:**
- Use **Browser ESM** for modern bundlers to minimize final bundle size
- **Browser UMD** is self-contained but larger due to included polyfills
- **Server builds** include AJV validation which adds ~40KB but provides robust data validation
- All builds are optimized for their target environments and use cases

Choose the build that best matches your environment and bundler capabilities.

## Configuration

Before using the SDK, you need to configure it with the necessary parameters. The primary configuration options include:

- **websocketUrl**: The URL for the WebSocket connection.
- **authenticationUrl**: (Optional) The URL for authentication, if you intend to use the `authenticate` method.
- **clientId**: (Optional) Your client ID for authentication, if you intend to use the `authenticate` method.
- **clientSecret**: (Optional) Your client secret for authentication, if you intend to use the `authenticate` method.

  ⚠️ **SECURITY WARNING**: Never set clientSecret in browser/mobile/Electron renderers. Client secrets must only be used in secure server-side environments to prevent exposure to end users.

### Example Configuration

```javascript
// Automatic build selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Or explicit server build for Node.js
// import OptaveJavaScriptSDK from '@optave/client-sdk/server';

// Or UMD for mixed environments (works with CommonJS require())
// const OptaveJavaScriptSDK = require('@optave/client-sdk/server-umd');

const optaveClient = new OptaveJavaScriptSDK({
    websocketUrl: process.env.OPTAVE__WEBSOCKET_URL,
    authenticationUrl: process.env.OPTAVE__AUTHENTICATION_URL,
    clientId: process.env.OPTAVE__CLIENT_ID,
    clientSecret: process.env.OPTAVE__CLIENT_SECRET,
});
```

### Browser Environment Configuration

When using the SDK in browser applications, you'll need to configure it differently depending on your build tool. Here are examples for popular frontend frameworks:

#### Vite (Vue, React, Vanilla)

```javascript
// Automatic selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Or explicit browser build
// import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

const sdk = new OptaveJavaScriptSDK({
    websocketUrl: import.meta.env.VITE_OPTAVE__WEBSOCKET_URL,
    authTransport: 'subprotocol', // Default - recommended for security
    tokenProvider: async () => {
        const response = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include' // Include cookies for authentication
        });
        if (!response.ok) throw new Error('Failed to obtain WebSocket token');
        const data = await response.json();
        return data.token;
    }
});
```

**Environment variables (.env):**
```bash
VITE_OPTAVE__WEBSOCKET_URL=wss://api.optave.com/ws
```

#### Create React App

```javascript
// Automatic selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Or explicit browser build for older Webpack versions
// import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

const sdk = new OptaveJavaScriptSDK({
    websocketUrl: process.env.REACT_APP_OPTAVE__WEBSOCKET_URL,
    tokenProvider: async () => {
        const response = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to obtain WebSocket token');
        const data = await response.json();
        return data.token;
    }
});
```

**Environment variables (.env):**
```bash
REACT_APP_OPTAVE__WEBSOCKET_URL=wss://api.optave.com/ws
```

#### Next.js

```javascript
// Automatic selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Or explicit browser build
// import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

const sdk = new OptaveJavaScriptSDK({
    websocketUrl: process.env.NEXT_PUBLIC_OPTAVE__WEBSOCKET_URL,
    tokenProvider: async () => {
        const response = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to obtain WebSocket token');
        const data = await response.json();
        return data.token;
    }
});
```

**Environment variables (.env.local):**
```bash
NEXT_PUBLIC_OPTAVE__WEBSOCKET_URL=wss://api.optave.com/ws
```

#### Generic Browser (without build tools)

```javascript
// For modern browsers supporting ES modules
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

// Or for legacy browser support
// Use the UMD CDN example shown in "Build System & Imports" section

const sdk = new OptaveJavaScriptSDK({
    websocketUrl: 'wss://api.optave.com/ws', // Direct configuration
    tokenProvider: async () => {
        const response = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to obtain WebSocket token');
        const data = await response.json();
        return data.token;
    }
});
```

⚠️ **Important**: Browser applications should never use `clientSecret`. Always use `tokenProvider` to obtain short-lived tokens from your secure backend.

## Build Tool Integration

The SDK works seamlessly with popular frontend build tools. Each has its own convention for exposing environment variables to client-side code:

| Build Tool | Environment Variable Prefix | Example |
|------------|----------------------------|---------|
| **Vite** | `VITE_` | `import.meta.env.VITE_OPTAVE__WEBSOCKET_URL` |
| **Create React App** | `REACT_APP_` | `process.env.REACT_APP_OPTAVE__WEBSOCKET_URL` |
| **Next.js** | `NEXT_PUBLIC_` | `process.env.NEXT_PUBLIC_OPTAVE__WEBSOCKET_URL` |
| **Nuxt** | `NUXT_PUBLIC_` | `process.env.NUXT_PUBLIC_OPTAVE__WEBSOCKET_URL` |

**Security Note**: Only variables with these prefixes are exposed to the browser. This prevents accidentally leaking server-side secrets to client-side code.

## Content Security Policy (CSP) Compliance

The Optave Client SDK is designed to work in strict Content Security Policy environments without requiring `unsafe-eval` permissions. This makes it compatible with enterprise applications, Salesforce Lightning, and other security-conscious platforms.

### CSP-Safe Implementation

**Salesforce-compatible builds (Browser ESM and both UMD builds) automatically:**
- Exclude AJV and other libraries that require `eval()` or `new Function()`
- Use platform-specific validation implementations that are CSP-compliant
- Generate external source maps instead of inline eval-based modules
- Avoid all runtime code generation

### Compatible CSP Headers

The SDK works with strict CSP policies like:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'
```

### Salesforce Lightning Compatibility

Specifically tested and optimized for Salesforce Lightning environments:

```javascript
// Works in Lightning Web Components (LWC)
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

const sdk = new OptaveJavaScriptSDK({
    websocketUrl: 'wss://api.optave.com/ws',
    tokenProvider: async () => {
        // Fetch from your Lightning backend
        const response = await fetch('/services/data/v58.0/optave/token', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sessionId}` }
        });
        return (await response.json()).token;
    }
});
```

**Important Considerations:**

- **Race conditions**: If app code runs before the script loads, `globalThis.Optave` is undefined.

### Enterprise Environment Setup

For enterprise applications with strict security policies:

1. **Use explicit browser builds** to ensure CSP compatibility
2. **Configure external token providers** instead of client credentials
3. **Test CSP headers** during development to catch violations early

## Authentication

If your setup requires authentication, the SDK provides an `authenticate` method to obtain an access token using client credentials.

### Usage

```javascript
async function authenticateClient() {
    try {
        const token = await optaveClient.authenticate();
        console.log('Authentication successful. Token:', token);
    } catch (error) {
        console.error('Authentication failed:', error);
    }
}
```

**Note**: Ensure that `authenticationUrl`, `clientId`, and `clientSecret` are correctly set in the configuration when using `authenticate()`. If you already have an externally obtained token you can skip `authenticate()` and call `openConnection(token)` directly.

### Recent Authentication Enhancements

The SDK has been enhanced with several improvements for better reliability and security:

**Automatic /token Suffix Handling**: The SDK now automatically appends `/token` to authentication URLs for user-friendly configuration. You can provide either `https://api.optave.com/auth` or `https://api.optave.com/auth/token` - both work seamlessly.

**Enhanced WebSocket Authentication**:
- Improved query parameter authentication with better error handling
- Automatic detection of browser vs. server environments for secure credential handling
- Enhanced timeout handling for WebSocket connections to prevent cascade failures

**Robust Error Handling**: Enhanced error messages with detailed context and troubleshooting guidance, making debugging authentication issues significantly easier.

## Security Best Practices

The Optave SDK implements several security measures by default to protect your applications and users:

### Client Secret Protection

⚠️ **CRITICAL**: Never include client secrets in client-side code. The SDK will automatically throw an error if a `clientSecret` is detected in browser, mobile, or Electron renderer environments.

```javascript
// ❌ NEVER DO THIS - Will throw an error in client environments
const sdk = new OptaveJavaScriptSDK({
    clientSecret: 'secret_key_here', // This will cause an error!
    // ... other options
});

// ✅ SECURE APPROACH - Use tokenProvider instead
const sdk = new OptaveJavaScriptSDK({
    websocketUrl: import.meta.env.VITE_OPTAVE__WEBSOCKET_URL, // Vite example
    tokenProvider: async () => {
        // Fetch token from your secure backend endpoint
        const response = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include' // Include cookies for authentication
        });
        if (!response.ok) throw new Error('Failed to obtain WebSocket token');
        const data = await response.json();
        return data.token;
    }
});

// ✅ COMPLETE BROWSER SETUP EXAMPLE (Vite)
const sdk = new OptaveJavaScriptSDK({
    websocketUrl: import.meta.env.VITE_OPTAVE__WEBSOCKET_URL,
    authTransport: 'subprotocol', // Default - uses Sec-WebSocket-Protocol header
    tokenProvider: async () => {
        const response = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Token request failed');
        const { token } = await response.json();
        return token; // Short-lived, one-time token
    }
});

// Event handlers
sdk.on('open', () => {
    console.log('WebSocket connection established');
    // Now you can send messages
});

sdk.on('error', (error) => {
    console.error('SDK error:', error);
});

// Open connection (automatically uses tokenProvider)
sdk.openConnection();
```

### Authentication Transport Security

The SDK defaults to secure authentication transport using WebSocket subprotocols:

```javascript
// ✅ DEFAULT (Recommended) - Token sent via Sec-WebSocket-Protocol header
const sdk = new OptaveJavaScriptSDK({
    authTransport: 'subprotocol', // This is the default
    // ... other options
});

// ⚠️ DISCOURAGED - Token sent in URL query parameters (will show warning)
const sdk = new OptaveJavaScriptSDK({
    authTransport: 'query', // Avoid this - tokens may leak in logs
    // ... other options
});
```

### Server-Side Token Management

**For backend implementations**, implement these security practices:

1. **Origin Validation**: Always validate the `Origin` header on your token endpoint:

```javascript
// Example Express.js token endpoint
app.post('/api/optave/token', (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com'];

    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Invalid origin' });
    }

    // Generate short-lived, one-time token
    const token = generateShortLivedToken();
    res.json({ token });
});
```

2. **Short-lived Tokens**: Issue tokens with minimal lifetime (recommended: 5-15 minutes)

3. **One-time Use**: Consider implementing one-time tokens that are invalidated after first use

4. **Secure Headers**: Set appropriate security headers:

```javascript
// Security headers example
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
```

### Environment Detection

The SDK automatically detects and protects against unsafe environments:

- **Browser environments** (window object present)
- **Mobile environments** (React Native, Expo)
- **Electron renderer processes**

All these environments will reject client secrets and require tokenProvider implementation.

### Connection Security

```javascript
// ✅ SECURE - Let SDK handle token automatically
sdk.openConnection(); // Uses tokenProvider if no token provided

// ✅ SECURE - Pass token directly if you have one
sdk.openConnection('your-short-lived-token');

// The SDK will automatically:
// - Use secure WebSocket subprotocol authentication
// - Validate token presence when required
// - Handle authentication failures gracefully
```

## Establishing a WebSocket Connection

After obtaining (or otherwise retrieving) a token, open the WebSocket connection:

```javascript
async function connectWebSocket() {
    const token = await optaveClient.authenticate();
    optaveClient.openConnection(token);
}
```

### Recent WebSocket Improvements

The WebSocket implementation has been significantly enhanced for better reliability and performance:

**Enhanced Connection Management**:
- Improved WebSocket event listener handling with proper race condition prevention
- Better async behavior with proper promise rejection handling
- Enhanced timeout handling to prevent cascade test failures

**UMD Build Enhancements**:
- Server UMD builds now support `clientSecret` authentication with 100% test success rates
- Browser authentication detection has been simplified and made more reliable
- Improved WebSocket integration for mixed browser/Node.js environments

**Memory Management**:
- Comprehensive memory leak detection and prevention
- Proper resource cleanup on connection close
- Enhanced garbage collection patterns for long-running applications

**Salesforce Lightning Integration**:
- Dedicated UMD builds optimized for Salesforce Lightning environments
- GlobalThis access diagnostic tests for compatibility validation
- CSP-compliant WebSocket implementations for enterprise security requirements

## Event Handling

The SDK emits several events to handle various states and messages. You can listen to these events to manage your application's behavior accordingly.

### Available Events

- **open**: Emitted when the WebSocket connection is successfully opened.
- **message**: Emitted when a message is received from the server.
- **error**: Emitted when an error occurs.
- **close**: Emitted when the WebSocket connection is closed.

### Listening to Events

```javascript
optaveClient.on('open', () => {
    console.log('WebSocket connection opened.');
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('Received message:', message);
});

optaveClient.on('error', (error) => {
    console.error('An error occurred:', error);
});

optaveClient.on('close', () => {
    console.log('WebSocket connection closed.');
});
```

## Sending Messages

The SDK provides several methods to send different types of messages through the WebSocket connection. Each method corresponds to a specific action type.

### Available Methods

- **adjust(params)**: Sends an adjust message.
- **elevate(params)**: Sends an elevate message.
- **interaction(params)**: Sends an interaction message (successor to `customerInteraction`).
- **reception(params)**: Sends a reception message.
- **customerInteraction(params)**: (Deprecated) Legacy alias kept for backward compatibility. Use `interaction` instead.
- **summarize(params)**: Sends a summarize message.
- **translate(params)**: Sends a translate message.
- **recommend(params)**: Sends a recommend message.
- **insights(params)**: Sends an insights message.

### Example: Sending a Interaction Message

```javascript
const interactionParams = {
    session: {
        sessionId: "a1b2c3e6-e5f6-7890-1234-56789abcdef0",
        channel: {
            browser: "Safari 17.0",
            deviceInfo: "iOS/18.2, iPhone15,3",
            deviceType: "mobile",
            language: "en-US",
            location: "40.7128,-74.0060", // GPS coordinates
            medium: "chat", // options: "chat", "voice", "email"
            section: "support_page",
        },
        interface: {
            appVersion: "2.1.0",
            category: "crm",
            language: "en-US",
            name: "my_support_app",
            type: "custom_components",
        }
    },
    headers: {
        // Optional client event time; if omitted no timestamp header is sent
        timestamp: "2024-01-15T10:30:00.000Z"
    },
    request: {
        requestId: "a1b2c3d4-e5f6-7890-1234-56789ab2345",
        attributes: {
            variant: "A"
        },
        connections: {
            threadId: "9e8d7c6b-5a49-3827-1605-948372615abc" // REQUIRED
        },
        context: { // generated by optave
            organizationId: "f7e8d9c0-b1a2-3456-7890-123456789abc", // REQUIRED
        },
        scope: {
            conversations: [ // REQUIRED
                {
                    conversationId: "conv-789",
                    participants: [
                        {
                            participantId: "2c4f8a9b-1d3e-5f70-8293-456789012def", //sent by the client - optional
                            role: "user",
                            displayName: "John Doe"
                        },
                        {
                            participantId: "5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                            role: "operator",
                            displayName: "Sarah Smith"
                        }
                    ],
                    messages: [
                        {
                            timestamp: "2024-01-15T10:30:00.000Z",
                            participantId: "2c4f8a9b-1d3e-5f70-8293-456789012def",
                            content: "Hi, can you help me?"
                        },
                        {
                            timestamp: "2024-01-15T10:30:15.000Z",
                            participantId: "5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                            content: "Hello! I'd be happy to assist you today. What can I help you with?"
                        }
                    ]
                }
            ]
        },
        settings: {
            disableBrowsing: false,
            disableSearch: false,
            disableSources: false,
            disableStream: false,
            disableTools: false,
            maxResponseLength: 2000,
            overrideOutputLanguage: "en-US"
        }
    }
};

optaveClient.interaction(interactionParams);
```

## Payload Structure

The SDK manages a default payload structure that encapsulates session information, user details, agent information, requests, and more. When sending a message, you provide a `params` object that is merged with the default payload to form the final payload sent over the WebSocket.

### Default Payload Overview

- **session**: Contains session tracking information including `sessionId`, channel details (browser, deviceInfo, deviceType, etc.), and interface information.
- **request**: Details about the request including `requestId`, context, connections, attributes, scope (with structured conversations and interactions), and settings.


### Merging Strategy

The SDK performs a **selective deep merge** where the user-provided `params` are merged "on top" of the default payload. Arrays in the payload are replaced entirely by the arrays provided in `params`.

### Envelope Headers

Each outbound message is wrapped in an envelope with a `headers` object. The SDK auto-populates the following headers (fields marked optional are only present when supplied):

- `schemaRef` – Format: `optave.message.v<major>` (derived from spec version major). Always present.
- `sdkVersion` – The SDK package version from `package.json`.
- `action` – The validated action string you invoked (e.g. `customerinteraction`).
- `correlationId` – Taken in priority order from: user override (`params.headers.correlationId`), `request.requestId`, or auto-generated (uuid v7).
- `traceId` – Auto-generated (uuid v7) unless overridden via `params.headers.traceId`.
- `idempotencyKey` – Auto-generated (uuid v7) unless overridden via `params.headers.idempotencyKey`.
- `issuedAt` – ISO timestamp when the envelope was built (always present).
- `timestamp` – Optional client event time you provide (not generated automatically). Supply under `params.headers.timestamp` if you want to record the original occurrence time of the underlying event.
- `identifier` – The request type (currently `message`).
- `networkLatencyMs` – Included only if explicitly supplied as a number via `params.headers.networkLatencyMs`.
- `tenantId` – Included only when `tenantId` option is set in the SDK constructor.

Header Override Rules:
1. Provide a top-level `headers` object in the `params` you pass to `send()` or the convenience method (e.g. `interaction({ headers: { timestamp: '...' }, ... })`).
2. Only the keys you supply are considered overrides; others are generated.
3. Supplying `timestamp` prevents accidental fabrication—if you omit it, it is simply absent (not auto-filled).

Correlation & Tracing:
- Use a custom `correlationId` if you need to link multiple outbound requests to an external system ID.
- `traceId` plus `correlationId` enable joining logs across services; normally you do not need to set them manually.
- `idempotencyKey` can be overridden to ensure safe retries on the server side if that semantic is supported.


## Example Usage

Below are examples demonstrating how to initialize the SDK, establish a connection, handle events, and send messages.

### Browser Usage Example

```javascript
// Automatic build selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Or explicit browser build
// import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

const sdk = new OptaveJavaScriptSDK({
    websocketUrl: import.meta.env.VITE_OPTAVE__WEBSOCKET_URL,
    tokenProvider: async () => {
        const r = await fetch('/api/optave/ws-ticket', {
            method: 'POST',
            credentials: 'include'
        });
        if (!r.ok) throw new Error('ticket failed');
        const { token } = await r.json();
        return token;
    }
});

// Wait for 'open' before sending
sdk.on('open', () => {
    sdk.interaction({ /* your params */ });
});
sdk.on('error', (e) => console.error('SDK error', e));

sdk.openConnection(); // uses tokenProvider automatically
```

### Node.js Server Example

```javascript
// Automatic build selection (recommended)
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Or explicit server build
// import OptaveJavaScriptSDK from '@optave/client-sdk/server';

// Or UMD for mixed environments (works with CommonJS require())
// const OptaveJavaScriptSDK = require('@optave/client-sdk/server-umd');

const optaveClient = new OptaveJavaScriptSDK({
    websocketUrl: process.env.OPTAVE__WEBSOCKET_URL,

    // These parameters are only required when using the authenticate() function.
    // In some cases, the authentication token can be obtained manually or through
    // another process, which makes the authenticate() call unnecessary. In this
    // case, only the openConnection function has to be called, passing the existing token value
    authenticationUrl: process.env.OPTAVE__AUTHENTICATION_URL,
    clientId: process.env.OPTAVE__CLIENT_ID,
    clientSecret: process.env.OPTAVE__CLIENT_SECRET,
});

async function run() {
    // Listen for messages from the WebSocket
    optaveClient.on('message', payload => {
        const message = JSON.parse(payload);
        const { actionType, state, action } = message;
    
        console.log(`Action: ${action} / State: ${state} / Action Type: ${actionType}`);
    });
    
    // Handle errors
    optaveClient.on('error', error => {
        if (typeof error === 'string') {
            console.error(error);
        } else {
            console.error('Error:', error);
        }
    });
    
    // After the connection is opened, send an interaction message
    optaveClient.once('open', () => {
        optaveClient.interaction({
            session: {
                sessionId: "a1b2c3e6-e5f6-7890-1234-56789abcdef0",
                channel: {
                    browser: "Safari 17.0",
                    deviceInfo: "iOS/18.2, iPhone15,3",
                    deviceType: "mobile",
                    language: "en-US",
                    location: "40.7128,-74.0060", // GPS coordinates
                    medium: "chat", // options: "chat", "voice", "email"
                    section: "support_page",
                },
                interface: {
                    appVersion: "2.1.0",
                    category: "crm",
                    language: "en-US",
                    name: "my_support_app",
                    type: "custom_components",
                }
            },
            request: {
                requestId: "a1b2c3d4-e5f6-7890-1234-56789ab2345",
                attributes: {
                    variant: "A"
                },
                connections: {
                    threadId: "9e8d7c6b-5a49-3827-1605-948372615abc" // REQUIRED
                },
                context: { // generated by optave
                    organizationId: "f7e8d9c0-b1a2-3456-7890-123456789abc", // REQUIRED
                },
                scope: {
                    conversations: [ // REQUIRED
                        {
                            conversationId: "conv-789",
                            participants: [
                                {
                                    participantId: "2c4f8a9b-1d3e-5f70-8293-456789012def", //sent by the client - optional
                                    role: "user",
                                    displayName: "John Doe"
                                },
                                {
                                    participantId: "5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                                    role: "operator",
                                    displayName: "Sarah Smith"
                                }
                            ],
                            messages: [
                                {
                                    timestamp: "2024-01-15T10:30:00.000Z",
                                    participantId: "2c4f8a9b-1d3e-5f70-8293-456789012def",
                                    content: "Hi, can you help me?"
                                },
                                {
                                    timestamp: "2024-01-15T10:30:15.000Z",
                                    participantId: "5b8c9d0e-2f4a-6b1c-9d8e-123456789xyz",
                                    content: "Hello! I'd be happy to assist you today. What can I help you with?"
                                }
                            ]
                        }
                    ],
                    interactions: [
                        {
                            content: "Support ticket T12345 has been created for user John Doe",
                            id: "1",
                            name: "ticket_created",
                            role: "System",
                            timestamp: "2024-01-15T10:29:45.000Z",
                        }
                    ]
                },
                settings: {
                    disableBrowsing: false,
                    disableSearch: false,
                    disableSources: false,
                    disableStream: false,
                    disableTools: false,
                    maxResponseLength: 2000,
                    overrideOutputLanguage: "en-US"
                }
            }
        });
    });

    // Authenticate and open the WebSocket connection
    try {
        const token = await optaveClient.authenticate();
        optaveClient.openConnection(token);
    } catch (error) {
        console.error('Failed to authenticate and connect:', error);
    }
}

run();
```

## API Reference

### `OptaveJavaScriptSDK(options)`

Creates a new instance of the OptaveJavaScriptSDK.

- **Parameters**:
  - `options` *(Object)*: Configuration options.
    - `websocketUrl` *(string)*: The WebSocket URL.
    - `authenticationUrl` *(string, optional)*: The authentication URL.
    - `clientId` *(string, optional)*: The client ID for authentication.
    - `clientSecret` *(string, optional)*: The client secret for authentication.

      ⚠️ **SECURITY WARNING**: Never set clientSecret in browser/mobile/Electron renderers. Client secrets must only be used in secure server-side environments.

### `authenticate()`

Authenticates the client using the provided credentials and retrieves an access token.

- **Returns**: *(Promise<string>)* The access token.

### `openConnection(bearerToken)`

Establishes a WebSocket connection using the provided bearer token.

- **Parameters**:
  - `bearerToken` *(string)*: The authentication token.

### `closeConnection()`

Closes the active WebSocket connection.

### `send(requestType, action, params)`

Sends a message through the WebSocket connection.

- **Parameters**:
  - `requestType` *(string)*: The type of the request.
  - `action` *(string)*: The specific action to perform.
  - `params` *(Object)*: The parameters for the request.

### Predefined Methods

These methods are shortcuts for sending specific types of messages.

- **adjust(params)**: Sends an `adjust` message.
- **elevate(params)**: Sends an `elevate` message.
- **interaction(params)**: Sends an `interaction` message.
- **reception(params)**: Sends a `reception` message.
- **customerInteraction(params)**: (Deprecated) Legacy alias for `interaction`.
- **summarize(params)**: Sends a `summarize` message.
- **translate(params)**: Sends a `translate` message.
- **recommend(params)**: Sends a `recommend` message.
- **insights(params)**: Sends an `insights` message.

### EventEmitter Methods

Since `OptaveJavaScriptSDK` extends `EventEmitter`, you can use all standard `EventEmitter` methods such as `on`, `once`, `emit`, etc.

### Static Methods and Constants

The SDK provides several static methods and constants for accessing metadata and configuration:

```javascript
import OptaveJavaScriptSDK from '@optave/client-sdk';

// Version information
const sdkVersion = OptaveJavaScriptSDK.getSdkVersion(); // e.g., "3.2.1"
const specVersion = OptaveJavaScriptSDK.getSpecVersion(); // e.g., "3.2.1"
const schemaRef = OptaveJavaScriptSDK.getSchemaRef(); // e.g., "optave.message.v3"

// Constants
const constants = OptaveJavaScriptSDK.CONSTANTS; // SDK configuration constants
const legacyEvents = OptaveJavaScriptSDK.LegacyEvents; // Legacy event names
const inboundEvents = OptaveJavaScriptSDK.InboundEvents; // New event names

// Usage example
sdk.on(OptaveJavaScriptSDK.LegacyEvents.MESSAGE, (data) => {
  console.log('Legacy message event:', data);
});

sdk.on(OptaveJavaScriptSDK.InboundEvents.SUPERPOWER_RESPONSE, (data) => {
  console.log('New superpower response:', data);
});
```

## Error Handling

The SDK includes robust error handling to ensure that issues are communicated effectively.

### Emitting Errors

Errors are emitted via the `error` event. You can listen to this event to handle errors gracefully.

```javascript
optaveClient.on('error', (error) => {
    console.error('An error occurred:', error);
});
```

### Common Error Scenarios

- **Missing Configuration**: Errors will be emitted if required configuration options like `websocketUrl` or `authenticationUrl` are missing.
- **Authentication Failure**: If authentication fails, an error with the corresponding message will be emitted.
- **WebSocket Issues**: Errors related to WebSocket connections, such as connection failures or unexpected closures, will be emitted.

### Error Object Structure

When an error is emitted, it follows the following structure:

```javascript
{
    category: 'WEBSOCKET', // Error category (available types: AUTHENTICATION, ORCHESTRATOR, VALIDATION, WEBSOCKET)
    code: 'INVALID_WEBSOCKET_URL', // Error code that identifies which error just happened
    message: 'Empty or invalid Websocket URL', // Error message explaining the problem
    details: null // Error details which may or not bring additional information
    suggestions: [] // List of suggestions on how to fix the error
}
