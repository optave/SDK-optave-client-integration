# Optave SDK Examples

⚠️  **GENERATED FILE - DO NOT EDIT MANUALLY**

This file was automatically generated from AsyncAPI specification.

- **Generated from**: Optave Client WebSocket API v3.2.1
- **Generated on**: 2025-09-26T21:27:15.926Z
- **To regenerate**: `npm run spec:generate:examples`

This directory contains **automatically generated** examples for using the Optave JavaScript SDK. These examples are generated from the AsyncAPI specification to ensure perfect consistency with the current API schema.

## 🗂️ Directory Structure

```
generated/examples/
├── browser/         # 🌐 Browser-specific examples
│   ├── adjust.js
│   ├── customerinteraction.js
│   ├── interaction.js
│   ├── elevate.js
│   ├── insights.js
│   ├── recommend.js
│   ├── summarize.js
│   ├── translate.js
│   ├── reception.js
└── server/          # 🖥️ Node.js/server examples
    ├── adjust.js
    ├── customerinteraction.js
    ├── interaction.js
    ├── elevate.js
    ├── insights.js
    ├── recommend.js
    ├── summarize.js
    ├── translate.js
    ├── reception.js
```

## 🚀 Getting Started

### New to Optave SDK?
**Start here**: Check `integration/browser-integration.js` for a comprehensive, production-ready example.

### Need a specific method example?
- **Browser/Frontend**: See `browser/[method].js`
- **Node.js/Server**: See `server/[method].js`

## 📋 Available Examples

### 🌐 Browser Examples (`browser/`)
**Environment**: Web browsers, Electron renderer, mobile webviews

**Import Pattern**:
```javascript
// ✅ CORRECT: Import from NPM package
import OptaveJavaScriptSDK from '@optave/client-sdk/browser';

// ✅ LOCAL DEVELOPMENT: From built files
import OptaveJavaScriptSDK from '../dist/browser.mjs';
```

**Key Features**:
- Use `import.meta.env` for environment variables
- Token provider pattern (no client secrets)
- Browser API usage (navigator, fetch, etc.)
- Page lifecycle event handling

**Available Methods**:
- `adjust.js` - Client sends an adjust action request
- `customerinteraction.js` - (Deprecated) Client sends a customer interaction action request (use interaction)
- `interaction.js` - Client sends an interaction action request
- `elevate.js` - Client sends an elevate action request
- `insights.js` - Client sends an insights action request
- `recommend.js` - Client sends a recommend action request
- `summarize.js` - Client sends a summarize action request
- `translate.js` - Client sends a translate action request
- `reception.js` - Client sends a reception action request

### 🖥️ Server Examples (`server/`)
**Environment**: Node.js servers, serverless functions, backend services

**Import Pattern**:
```javascript
// ✅ CORRECT: Import from NPM package
import OptaveJavaScriptSDK from '@optave/client-sdk/server';

// ✅ LOCAL DEVELOPMENT: From built files
import OptaveJavaScriptSDK from '../dist/server.mjs';
```

**Key Features**:
- Use `process.env` for environment variables
- Client credentials authentication
- Node.js module usage
- Server-specific patterns

**Available Methods**:
- `adjust.js` - Client sends an adjust action request
- `customerinteraction.js` - (Deprecated) Client sends a customer interaction action request (use interaction)
- `interaction.js` - Client sends an interaction action request
- `elevate.js` - Client sends an elevate action request
- `insights.js` - Client sends an insights action request
- `recommend.js` - Client sends a recommend action request
- `summarize.js` - Client sends a summarize action request
- `translate.js` - Client sends a translate action request
- `reception.js` - Client sends a reception action request

## 🔧 Usage

### Quick Method Testing
```bash
# Test a specific method (Node.js)
cd server/
node adjust.js

# For browser examples, serve with a local server:
cd browser/
python -m http.server 8000
```

## 🛡️ Security Best Practices

### Browser Environments
- ✅ **DO**: Use token provider pattern
- ✅ **DO**: Use `@optave/client-sdk/browser` import
- ✅ **DO**: Fetch tokens from your secure backend
- ❌ **DON'T**: Include client secrets in browser code

### Server Environments
- ✅ **DO**: Use client credentials flow
- ✅ **DO**: Use `@optave/client-sdk/server` import
- ✅ **DO**: Store secrets in environment variables
- ❌ **DON'T**: Expose client secrets to frontend

## 🔄 Regenerating Examples

These examples are automatically generated from the AsyncAPI specification:

```bash
# From the project root
npm run spec:generate:examples

# From the JavaScript SDK directory
cd sdks/javascript
npm run spec:generate:examples
```

## 📚 Documentation

For complete SDK documentation, see:
- **[SDK Documentation](../README.md)** - Main SDK documentation
- **[API Reference](../docs/api/)** - Detailed API documentation
- **[Architecture Guide](../docs/architecture.md)** - SDK architecture overview

---

**Generated from**: Optave Client WebSocket API v3.2.1
**Generated on**: 2025-09-26T21:27:15.927Z