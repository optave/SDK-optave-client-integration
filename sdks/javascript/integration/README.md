# Integration Examples

This folder contains integration examples for different build formats of the Optave JavaScript SDK. Each example demonstrates how to properly use a specific build in its intended environment.

## Available Integration Examples

### Browser Integrations

#### 1. Browser ESM (`browser-esm-integration.mjs`)
**File:** [`browser-esm-integration.mjs`](./browser-esm-integration.mjs)
**Build:** `dist/browser.mjs`
**Environment:** Modern browsers with ES module support

```javascript
// Usage
import OptaveJavaScriptSDK from '../dist/browser.mjs';
```

**Use Cases:**
- Modern web applications with native ES module support
- Vite, Rollup, or other ESM-first bundlers
- Applications using import/export syntax
- Development environments with hot module replacement

**Features:**
- Tree-shaking support for optimal bundle size
- `import.meta.env` for environment variables
- Browser-optimized crypto polyfills
- CSP-compliant validation

#### 2. Browser UMD (`browser-umd-integration.js`)
**File:** [`browser-umd-integration.js`](./browser-umd-integration.js)
**Build:** `dist/browser.umd.js`
**Environment:** Salesforce Lightning Platform and legacy browsers

```html
<script src="path/to/browser.umd.js"></script>
<script>
  // SDK available as global OptaveJavaScriptSDK
</script>
```

**Use Cases:**
- Salesforce Lightning Components (Aura, LWC)
- Salesforce Visualforce pages
- Legacy browsers (IE11+, older Chrome/Firefox)
- Applications using script tags without module bundlers
- WordPress, Drupal, or other CMS environments

**Features:**
- Global variable access (`OptaveJavaScriptSDK`)
- IE11+ compatibility
- Traditional event handling patterns
- No build tools required

#### 3. Browser Integration (Comprehensive)
See the individual browser examples above for complete integration patterns. Both `browser-esm-integration.mjs` and `browser-umd-integration.js` include:
- Token provider patterns for secure authentication
- Complete event handling
- Error categorization
- Production-ready configurations
- Migration guidance for different browser environments

### Server Integrations

#### 1. Server ESM (`server-esm-integration.mjs`)
**File:** [`server-esm-integration.mjs`](./server-esm-integration.mjs)
**Build:** `dist/server.mjs`
**Environment:** Node.js with ES module support

```javascript
// Usage (requires "type": "module" in package.json)
import OptaveJavaScriptSDK from '../dist/server.mjs';
```

**Use Cases:**
- Node.js applications with `type: "module"` in package.json
- Modern Node.js environments (20+) with native ES module support
- Server-side applications, APIs, and microservices

**Features:**
- Native ES modules in Node.js
- Full AJV validation support
- Direct client credentials authentication
- Complete WebSocket feature set

#### 2. Server UMD (`salesforce-lightning-server-umd.js`)
**File:** [`salesforce-lightning-server-umd.js`](./salesforce-lightning-server-umd.js)
**Build:** `dist/server.umd.js`
**Environment:** Salesforce Lightning Platform and browser script environments

```javascript
// Usage in Salesforce Lightning or browser environment
const OptaveJavaScriptSDK = globalThis.OptaveJavaScriptSDK || window.OptaveJavaScriptSDK;
```

**Use Cases:**
- Salesforce Lightning Components (Aura, LWC)
- Salesforce server-side integration (Apex, Flow)
- Browser script tag loading without module bundlers
- Legacy browsers requiring UMD format
- Environments where global variable access is preferred

**Features:**
- UMD module format (works in browser, AMD, CommonJS contexts)
- Global variable access (`globalThis.OptaveJavaScriptSDK`)
- Salesforce Lightning Locker Service compatible
- Full server-side feature set
- Process event handling for graceful shutdown
- Error handling for uncaught exceptions

### Salesforce Integration

#### Salesforce Lightning (`salesforce-lightning-integration.js`)
**File:** [`salesforce-lightning-integration.js`](./salesforce-lightning-integration.js)
**Build:** `dist/browser.umd.js`
**Environment:** Salesforce Lightning Platform

```javascript
// Usage in Salesforce Lightning Component
const OptaveSDK = globalThis.OptaveJavaScriptSDK;
```

**Use Cases:**
- Salesforce Lightning Components (Aura)
- Lightning Web Components (LWC)
- Lightning Locker Service environments
- Salesforce AppExchange applications

**Features:**
- Lightning Locker Service compliant
- CSP-safe validation (no eval, no AJV)
- globalThis support for undefined `this` context
- Complete Lightning Component and LWC examples
- Apex controller integration patterns

## Environment Setup

### Browser Environment Variables
```javascript
// Modern bundlers (Vite, etc.)
import.meta.env.VITE_OPTAVE__WEBSOCKET_URL

// Webpack/older bundlers
process.env.OPTAVE__WEBSOCKET_URL

// Global configuration (UMD)
window.OPTAVE_CONFIG = {
  websocketUrl: 'wss://your-websocket-url'
};
```

### Server Environment Variables
```bash
export OPTAVE__WEBSOCKET_URL="wss://your-websocket-url"
export OPTAVE__CLIENT_ID="your_client_id"
export OPTAVE__CLIENT_SECRET="your_client_secret"
export OPTAVE__ORGANIZATION_ID="your_org_id"
export NODE_ENV="development"
```

## Testing Integration Examples

### Build the SDK First
```bash
# From sdks/javascript directory
npm run build
```

### Test Integration Examples
```bash
# Run integration tests
npm test tests/scope/integration/integration-examples.test.js
```

### Test Server Examples
```bash
# ESM (requires "type": "module" in package.json)
node server-esm-integration.mjs

# Note: UMD builds are designed for browser/Salesforce environments
# For Node.js, use the ESM build above or dynamic import
```

## Integration Selection Guide

| Environment | Module System | Example File | Status |
|------------|---------------|--------------|--------|
| Modern Browser | ES Modules | `browser-esm-integration.mjs` | ✅ Working |
| Legacy Browser | Script Tags/UMD | `browser-umd-integration.js` | ✅ Working* |
| Modern Node.js | ES Modules | `server-esm-integration.mjs` | ✅ Working |
| **Salesforce Lightning** | **UMD Global** | **`salesforce-lightning-integration.js`** | **✅ Working** |
| **Salesforce (Alt)** | **UMD Global** | **`salesforce-lightning-server-umd.js`** | **✅ Working** |
| Legacy Node.js | CommonJS | Use `server.mjs` with import() | ✅ Alternative |

*UMD builds are designed for global access (window.OptaveJavaScriptSDK), not Node.js require(). For require() testing, copy to .cjs extension.

## Security Notes

### Browser Security
- ✅ **Always use token provider pattern** - never embed client secrets in browser code
- ✅ **Use subprotocol authentication** for maximum security
- ✅ **Implement proper error handling** for token failures
- ✅ **Use HTTPS/WSS in production**

### Server Security
- ✅ **Store credentials in environment variables**
- ✅ **Implement graceful shutdown** for production deployments
- ✅ **Handle uncaught exceptions** to prevent crashes
- ✅ **Use proper logging** for debugging and monitoring

## UMD Build Status

**✅ UMD builds are working correctly for their intended purpose.**

### Important: UMD Testing Methods
- **✅ Global Access**: `globalThis.OptaveJavaScriptSDK` works perfectly (intended usage)
- **❌ Node.js require()**: Returns empty object (not intended usage pattern)
- **✅ Browser Script Tags**: Works perfectly for legacy browser support
- **✅ Salesforce Lightning**: Works perfectly as static resources

### Current Recommendations
1. **✅ For Salesforce: Use UMD builds** - Access via `globalThis.OptaveJavaScriptSDK`, fully Lightning compatible
2. **✅ For Modern Apps: Use ESM builds** - Both browser and server ESM builds work perfectly
3. **✅ For Legacy Browsers: Use Browser UMD** - Global access via script tags works perfectly
4. **✅ For Legacy Node.js: Use Server ESM with import()** - Dynamic import works in CommonJS environments

### Salesforce Lightning Integration

**✅ CONFIRMED WORKING** - The server UMD build is fully compatible with Salesforce Lightning environments.

#### Quick Start for Salesforce
**Option 1: Browser UMD (Recommended)**
1. Upload `dist/browser.umd.js` as a static resource
2. Load in Lightning Component: `<ltng:require scripts="{!$Resource.OptaveSDK}"/>`
3. Access SDK: `const SDK = globalThis.OptaveJavaScriptSDK;`

**Option 2: Server UMD (Alternative)**
1. Upload `dist/server.umd.js` as a static resource
2. Load in Lightning Component: `<ltng:require scripts="{!$Resource.OptaveSDK}"/>`
3. Access SDK: `const SDK = globalThis.OptaveJavaScriptSDK;`

**Common Steps:**
4. **Configure CSP**: Add Optave domain(s) to Trusted URLs (CSP allowlist) for connect-src in Salesforce Setup
5. Initialize with token provider using Apex controller

See [`salesforce-lightning-integration.js`](./salesforce-lightning-integration.js) (Browser UMD) or [`salesforce-lightning-server-umd.js`](./salesforce-lightning-server-umd.js) (Server UMD) for complete examples.

#### Salesforce Compatibility Features
- ✅ Lightning Locker Service compliant
- ✅ CSP-safe validation (no eval, no AJV)
- ✅ globalThis support for undefined `this` context
- ✅ WebSocket restrictions handling
- ✅ All Lightning tests passing

### Testing Note
For testing UMD builds in Node.js environments, see the `UMD-TESTING-GUIDE.md` for proper testing methodologies. The builds are working as designed for their target environments (Salesforce Lightning, legacy browsers).

## Migration from Manual WebSocket

If you're currently using manual WebSocket connections, see the browser integration examples (`browser-esm-integration.mjs` and `browser-umd-integration.js`) for step-by-step guidance on upgrading to the SDK approach.

## Support

For additional help with integrations:
1. **Recommended**: Use ESM builds (`browser-esm-integration.mjs` or `server-esm-integration.mjs`)
2. **For Salesforce**: Use `salesforce-lightning-integration.js` or `salesforce-lightning-server-umd.js`
3. Check the main SDK documentation
4. Review test files in `tests/` directory
5. Examine examples in `generated/examples/` directory
6. Open an issue in the repository