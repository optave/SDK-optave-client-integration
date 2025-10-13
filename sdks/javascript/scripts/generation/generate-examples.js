#!/usr/bin/env node

/**
 * Generate SDK Examples from AsyncAPI Specification
 *
 * This script creates examples by parsing the AsyncAPI spec directly
 * and generating both browser and server examples for each operation.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const ASYNCAPI_SPEC_PATH = '../../config/specs/asyncapi.yaml';
const OUTPUT_DIR = './generated/examples';

// Load and parse AsyncAPI specification
function loadAsyncAPISpec() {
    const specPath = path.resolve(process.cwd(), ASYNCAPI_SPEC_PATH);
    const specContent = fs.readFileSync(specPath, 'utf8');
    return yaml.parse(specContent);
}

// Extract operations that should have examples (exclude response operations)
function extractOperations(spec) {
    const operations = {};

    for (const [operationName, operation] of Object.entries(spec.operations || {})) {
        // Skip response operations
        if (operationName.includes('Response') || operationName.includes('Error')) {
            continue;
        }

        // Extract the clean operation name (remove 'publish' prefix)
        const cleanName = operationName.replace(/^publish/, '').toLowerCase();

        // Check for deprecation in the operation
        const isDeprecated = operation.deprecated === true;
        const deprecationInfo = operation['x-deprecation'];

        operations[cleanName] = {
            name: cleanName,
            originalName: operationName,
            summary: operation.summary || `${cleanName} operation`,
            deprecated: isDeprecated,
            deprecationInfo: deprecationInfo
        };
    }

    return operations;
}

// Get example payload from AsyncAPI message examples
function getExamplePayload(spec, operationName) {
    try {
        // Look for message examples in the spec
        const messages = spec.components?.messages || {};

        // Sort messages to prioritize exact matches over partial matches
        const sortedMessages = Object.entries(messages).sort(([nameA], [nameB]) => {
            const exactMatchA = nameA.toLowerCase() === `${operationName.toLowerCase()}message`;
            const exactMatchB = nameB.toLowerCase() === `${operationName.toLowerCase()}message`;

            if (exactMatchA && !exactMatchB) return -1;
            if (!exactMatchA && exactMatchB) return 1;
            return 0;
        });

        for (const [messageName, message] of sortedMessages) {
            if (messageName.toLowerCase().includes(operationName.toLowerCase())) {
                const examples = message.examples || [];
                if (examples.length > 0 && examples[0].payload) {
                    // AsyncAPI examples contain the full envelope, but SDK methods expect just the payload part
                    const envelope = examples[0].payload;
                    if (envelope.payload) {
                        // Return just the payload part of the envelope
                        return envelope.payload;
                    }
                    // If no nested payload, return the whole thing (legacy format)
                    return envelope;
                }
            }
        }

        // Return a basic template if no specific example found
        return {
            headers: {
                timestamp: "2024-01-15T10:30:00.000Z",
                networkLatencyMs: 120
            },
            session: {
                sessionId: `${operationName}_session_` + "{{DYNAMIC_ID}}",
                channel: {
                    browser: "{{BROWSER_INFO}}",
                    deviceType: "{{DEVICE_TYPE}}",
                    language: "{{LANGUAGE}}",
                    medium: "chat"
                }
            },
            request: {
                requestId: `${operationName}_request_` + "{{DYNAMIC_ID}}",
                connections: {
                    threadId: `${operationName}_thread_` + "{{DYNAMIC_ID}}"
                },
                context: {
                    organizationId: "{{ORG_ID}}" // Required - Replace with your org ID
                },
                scope: {
                    conversations: [{
                        conversationId: `conv_${operationName}_` + "{{DYNAMIC_ID}}",
                        participants: [{
                            participantId: "user_1",
                            displayName: "Example User",
                            role: "user"
                        }],
                        messages: [{
                            participantId: "user_1",
                            content: `Example message for ${operationName} operation`,
                            timestamp: "{{TIMESTAMP}}"
                        }]
                    }]
                }
            }
        };
    } catch (error) {
        console.warn(`Could not extract example for ${operationName}:`, error.message);
        return null;
    }
}

// Generate server example
function generateServerExample(operation, examplePayload, spec) {
    let payloadStr;
    if (examplePayload) {
        // Add headers to payload if not already present
        if (!examplePayload.headers) {
            examplePayload = {
                headers: {
                    timestamp: "2024-01-15T10:30:00.000Z",
                    networkLatencyMs: 120
                },
                ...examplePayload
            };
        }

        payloadStr = JSON.stringify(examplePayload, null, 12).replace(/"/g, '"')
            .replace(/\{\{DYNAMIC_ID\}\}/g, '" + Date.now() + Math.random().toString(36).substring(7) + "')
            .replace(/\{\{BROWSER_INFO\}\}/g, 'Node.js Server')
            .replace(/\{\{DEVICE_TYPE\}\}/g, 'server')
            .replace(/\{\{LANGUAGE\}\}/g, 'en-US')
            .replace(/\{\{ORG_ID\}\}/g, 'f7e8d9c0-b1a2-3456-7890-123456789abc')
            .replace(/"\{\{TIMESTAMP\}\}"/g, 'new Date().toISOString()')
            .replace(/"\{\{NETWORK_LATENCY_MS\}\}"/g, '120');
    } else {
        payloadStr = '{ /* Add your payload here */ }';
    }

    const deprecationWarning = operation.deprecated
        ? `/**
 * ⚠️  DEPRECATED OPERATION
 * This operation is deprecated since v${operation.deprecationInfo?.since || 'unknown'}
 * ${operation.deprecationInfo?.reason || 'No reason provided'}
 * ${operation.deprecationInfo?.replacement ? `Use '${operation.deprecationInfo.replacement}' instead` : ''}
 * Removal planned for v${operation.deprecationInfo?.removal || 'TBD'}
 */\n\n`
        : '';

    return `/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated ${operation.name} server example
 * Generated from: ${spec.info.title} v${spec.info.version}
 *
 * To regenerate: npm run spec:generate:examples
 */

${deprecationWarning}// ✅ SERVER: Import from Node.js build
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
        console.log(\`Action: \${action} / State: \${state} / Action Type: \${actionType}\`);
    });

    // Handle errors
    optaveClient.on('error', error => {
        console.error('Error:', error);
    });

    // Send ${operation.name} message when connected
    optaveClient.once('open', () => {
        console.log('🚀 Sending ${operation.name} request...');

        optaveClient.${operation.name}(${payloadStr});
    });

    // Authenticate and connect
    try {
        const token = await optaveClient.authenticate();
        optaveClient.openConnection(token);
    } catch (error) {
        console.error('Failed to authenticate and connect:', error);
    }
}

run();`;
}

// Generate browser example
function generateBrowserExample(operation, examplePayload, spec) {
    let payloadStr;
    if (examplePayload) {
        // Add headers to payload if not already present
        if (!examplePayload.headers) {
            examplePayload = {
                headers: {
                    timestamp: "2024-01-15T10:30:00.000Z",
                    networkLatencyMs: 120
                },
                ...examplePayload
            };
        }

        payloadStr = JSON.stringify(examplePayload, null, 12).replace(/"/g, '"')
            .replace(/\{\{DYNAMIC_ID\}\}/g, '" + Date.now() + Math.random().toString(36).substring(7) + "')
            .replace(/\{\{BROWSER_INFO\}\}/g, '" + navigator.userAgent + "')
            .replace(/\{\{DEVICE_TYPE\}\}/g, '" + (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop") + "')
            .replace(/\{\{LANGUAGE\}\}/g, '" + navigator.language + "')
            .replace(/\{\{ORG_ID\}\}/g, 'f7e8d9c0-b1a2-3456-7890-123456789abc')
            .replace(/"\{\{TIMESTAMP\}\}"/g, 'new Date().toISOString()')
            .replace(/"\{\{NETWORK_LATENCY_MS\}\}"/g, 'Math.round(performance.now())');
    } else {
        payloadStr = '{ /* Add your payload here */ }';
    }

    const deprecationWarning = operation.deprecated
        ? `/**
 * ⚠️  DEPRECATED OPERATION
 * This operation is deprecated since v${operation.deprecationInfo?.since || 'unknown'}
 * ${operation.deprecationInfo?.reason || 'No reason provided'}
 * ${operation.deprecationInfo?.replacement ? `Use '${operation.deprecationInfo.replacement}' instead` : ''}
 * Removal planned for v${operation.deprecationInfo?.removal || 'TBD'}
 */\n\n`
        : '';

    return `/**
 * ⚠️  GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Auto-generated ${operation.name} browser example
 * Generated from: ${spec.info.title} v${spec.info.version}
 *
 * ${operation.summary}
 * Uses tokenProvider pattern for secure browser authentication.
 *
 * To regenerate: npm run spec:generate:examples
 */

${deprecationWarning}// ✅ BROWSER: Import from browser build
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
            throw new Error(\`Token request failed: \${response.status}\`);
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
    send${operation.name.charAt(0).toUpperCase() + operation.name.slice(1)}Request();
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('📨 Received message:', message);

    if (message.headers?.action === '${operation.name}') {
        console.log('✅ ${operation.name} response received:', message.payload);
    }
});

optaveClient.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

optaveClient.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

async function send${operation.name.charAt(0).toUpperCase() + operation.name.slice(1)}Request() {
    try {
        console.log('🚀 Sending ${operation.name} request...');

        const response = await optaveClient.${operation.name}(${payloadStr});

        console.log('✅ ${operation.name} request sent successfully:', response);
    } catch (error) {
        console.error('❌ Failed to send ${operation.name} request:', error);
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
export { optaveClient };`;
}

// Generate comprehensive README
function generateREADME(spec, operations) {
    const operationsList = Object.values(operations)
        .map(op => `- \`${op.name}.js\` - ${op.summary}${op.deprecated ? ' **(DEPRECATED)**' : ''}`)
        .join('\n');

    return `# Optave SDK Examples

⚠️  **GENERATED FILE - DO NOT EDIT MANUALLY**

This file was automatically generated from AsyncAPI specification.

- **Generated from**: ${spec.info.title} v${spec.info.version}
- **Generated on**: ${new Date().toISOString()}
- **To regenerate**: \`npm run spec:generate:examples\`

This directory contains **automatically generated** examples for using the Optave JavaScript SDK. These examples are generated from the AsyncAPI specification to ensure perfect consistency with the current API schema.

## 🗂️ Directory Structure

\`\`\`
generated/examples/
├── browser/         # 🌐 Browser-specific examples
${Object.keys(operations).map(name => `│   ├── ${name}.js`).join('\n')}
└── server/          # 🖥️ Node.js/server examples
${Object.keys(operations).map(name => `    ├── ${name}.js`).join('\n')}
\`\`\`

## 🚀 Getting Started

### New to Optave SDK?
**Start here**: Check \`integration/browser-integration.js\` for a comprehensive, production-ready example.

### Need a specific method example?
- **Browser/Frontend**: See \`browser/[method].js\`
- **Node.js/Server**: See \`server/[method].js\`

## 📋 Available Examples

### 🌐 Browser Examples (\`browser/\`)
**Environment**: Web browsers, Electron renderer, mobile webviews

**Import Pattern**:
\`\`\`javascript
// ✅ CORRECT: Import from NPM package
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

// ✅ LOCAL DEVELOPMENT: From built files
import OptaveJavaScriptSDK from '../dist/browser.mjs';
\`\`\`

**Key Features**:
- Use \`import.meta.env\` for environment variables
- Token provider pattern (no client secrets)
- Browser API usage (navigator, fetch, etc.)
- Page lifecycle event handling

**Available Methods**:
${operationsList}

### 🖥️ Server Examples (\`server/\`)
**Environment**: Node.js servers, serverless functions, backend services

**Import Pattern**:
\`\`\`javascript
// ✅ CORRECT: Import from NPM package
import OptaveJavaScriptSDK from '@optave/client-sdk/server';

// ✅ LOCAL DEVELOPMENT: From built files
import OptaveJavaScriptSDK from '../dist/server.mjs';
\`\`\`

**Key Features**:
- Use \`process.env\` for environment variables
- Client credentials authentication
- Node.js module usage
- Server-specific patterns

**Available Methods**:
${operationsList}

## 🔧 Usage

### Quick Method Testing
\`\`\`bash
# Test a specific method (Node.js)
cd server/
node adjust.js

# For browser examples, serve with a local server:
cd browser/
python -m http.server 8000
\`\`\`

## 🛡️ Security Best Practices

### Browser Environments
- ✅ **DO**: Use token provider pattern
- ✅ **DO**: Use \`@optave/client-sdk/browser\` import
- ✅ **DO**: Fetch tokens from your secure backend
- ❌ **DON'T**: Include client secrets in browser code

### Server Environments
- ✅ **DO**: Use client credentials flow
- ✅ **DO**: Use \`@optave/client-sdk/server\` import
- ✅ **DO**: Store secrets in environment variables
- ❌ **DON'T**: Expose client secrets to frontend

## 🔄 Regenerating Examples

These examples are automatically generated from the AsyncAPI specification:

\`\`\`bash
# From the project root
npm run spec:generate:examples

# From the JavaScript SDK directory
cd sdks/javascript
npm run spec:generate:examples
\`\`\`

## 📚 Documentation

For complete SDK documentation, see:
- **[SDK Documentation](../README.md)** - Main SDK documentation
- **[API Reference](../docs/api/)** - Detailed API documentation
- **[Architecture Guide](../docs/architecture.md)** - SDK architecture overview

---

**Generated from**: ${spec.info.title} v${spec.info.version}
**Generated on**: ${new Date().toISOString()}`;
}

// Main generation function
async function generateExamples() {
    console.log('🔧 Generating SDK examples from AsyncAPI specification...');

    try {
        // Load spec and extract operations
        const spec = loadAsyncAPISpec();
        const operations = extractOperations(spec);

        console.log(`📋 Found ${Object.keys(operations).length} operations to generate examples for:`);
        Object.values(operations).forEach(op => {
            console.log(`   - ${op.name}${op.deprecated ? ' (DEPRECATED)' : ''}`);
        });

        // Create output directories
        const serverDir = path.join(OUTPUT_DIR, 'server');
        const browserDir = path.join(OUTPUT_DIR, 'browser');

        fs.mkdirSync(serverDir, { recursive: true });
        fs.mkdirSync(browserDir, { recursive: true });

        // Generate examples for each operation
        for (const [operationName, operation] of Object.entries(operations)) {
            console.log(`📄 Generating examples for ${operationName}...`);

            const examplePayload = getExamplePayload(spec, operationName);

            // Generate server example
            const serverExample = generateServerExample(operation, examplePayload, spec);
            fs.writeFileSync(path.join(serverDir, `${operationName}.js`), serverExample);

            // Generate browser example
            const browserExample = generateBrowserExample(operation, examplePayload, spec);
            fs.writeFileSync(path.join(browserDir, `${operationName}.js`), browserExample);
        }

        // Generate README
        console.log('📖 Generating README...');
        const readme = generateREADME(spec, operations);
        fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme);

        console.log('✅ SDK examples generated successfully!');
        console.log(`📁 Output directory: ${OUTPUT_DIR}`);
        console.log(`📊 Generated ${Object.keys(operations).length * 2} example files + README`);

    } catch (error) {
        console.error('❌ Error generating examples:', error);
        process.exit(1);
    }
}

// Run the generator
generateExamples();