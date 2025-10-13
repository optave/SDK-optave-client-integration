import path from 'path';

/**
 * Centralized alias configuration for webpack builds
 * Prevents configuration divergence across different build targets
 */

/**
 * Browser-specific aliases for ESM builds
 * Replaces Node.js modules with browser implementations
 */
export const browserAliases = {
    // Replace Node.js EventEmitter with browser implementation
    'events': path.resolve('./runtime/platform/browser/event-emitter.js'),
    // Replace AJV validators with CSP-safe browser implementation
    '../generated/validators.js': path.resolve('./runtime/platform/browser/validators.js'),
    '../../generated/validators.js': path.resolve('./runtime/platform/browser/validators.js'),
    // Replace core errors with CSP-safe browser implementation
    [path.resolve('./runtime/core/errors.js')]: path.resolve('./runtime/platform/browser/errors.js'),
    // Replace Node.js WebSocket loader with browser implementation
    '../platform/node/websocket-loader.js': path.resolve('./runtime/platform/browser/websocket-loader.js'),
};

/**
 * UMD-specific aliases for both browser and server UMD builds
 * Ensures consistent lightweight validation across UMD builds
 */
export const umdAliases = {
    // Redirect generated validators to browser validators for consistent lightweight validation
    '../../generated/validators.js': path.resolve('./runtime/platform/browser/validators.js'),
    // Redirect platform validators to browser implementation
    '../platform/browser/validators.js': path.resolve('./runtime/platform/browser/validators.js'),
    // Replace Node.js WebSocket loader with browser implementation since UMD runs in browser
    '../platform/node/websocket-loader.js': path.resolve('./runtime/platform/browser/websocket-loader.js'),
};

/**
 * Browser UMD specific aliases
 * Combines UMD base aliases with browser-specific replacements
 *
 * CRITICAL: Browser UMD uses Node.js EventEmitter (NOT browser EventEmitter)
 * This configuration is locked for Salesforce Lightning Web Security compatibility.
 *
 * Architecture Decision Record:
 * - Browser UMD does NOT alias 'events' → uses Node.js EventEmitter from npm package
 * - Browser ESM aliases 'events' → custom EventEmitter using DOM APIs (EventTarget/CustomEvent)
 * - The DOM-based EventEmitter (/runtime/platform/browser/event-emitter.js) uses:
 *   - EventTarget (extends from it)
 *   - CustomEvent (for event detail)
 *   - addEventListener/removeEventListener/dispatchEvent
 * - These DOM APIs fail in Salesforce Lightning Web Security sandbox
 * - Node.js EventEmitter works reliably in all constrained JavaScript environments
 *
 * DO NOT ADD: 'events' alias here - it will break Salesforce compatibility!
 *
 * Test Coverage:
 * - See: tests/scope/integration/crm/salesforce-lightning-*.test.js
 * - See: tests/scope/build/build-comparison.test.js (verifies 'events' is bundled)
 */
export const browserUmdAliases = {
    ...umdAliases,
    // Use CSP-safe browser errors implementation
    [path.resolve('./runtime/core/errors.js')]: path.resolve('./runtime/platform/browser/errors.js'),
};

/**
 * Fallback configuration for browser builds
 * Excludes Node.js modules from browser bundles
 */
export const fallbackBrowser = {
    // Exclude Node.js modules from browser build
    "ws": false,
    "fs": false,
    "path": false,
    "crypto": false,
    "stream": false,
    "util": false,
    "buffer": false,
    // Exclude AJV to prevent CSP violations
    "ajv": false,
    "ajv-formats": false,
};

/**
 * Fallback configuration for UMD builds
 * Base fallbacks for both browser and server UMD builds
 */
export const fallbackUMD = {
    // Exclude Node.js modules from UMD builds since they run in browser/Salesforce
    "ws": false,
    "fs": false,
    "path": false,
    "stream": false,
    "util": false,
    "buffer": false,
};

/**
 * Browser UMD specific fallback configuration
 * Combines UMD base fallbacks with browser-specific exclusions
 *
 * CRITICAL: 'events' module MUST be bundled (not excluded) for Salesforce compatibility
 * Browser UMD bundles the Node.js EventEmitter from the 'events' package because:
 * 1. Salesforce Lightning Web Security blocks DOM APIs (EventTarget/CustomEvent/dispatchEvent)
 * 2. Node.js EventEmitter uses pure JavaScript (no DOM dependencies)
 * 3. WebSocket event bridging works reliably with Node.js EventEmitter pattern
 *
 * DO NOT SET 'events': false - this will break WebSocket events in Salesforce!
 */
export const fallbackBrowserUMD = {
    ...fallbackUMD,
    // Browser builds get crypto polyfill
    "crypto": path.resolve('./runtime/platform/browser/crypto-polyfill.js'),
    // Browser UMD builds exclude AJV to prevent CSP violations
    "ajv": false,
    "ajv-formats": false,
    // CRITICAL: 'events' is intentionally NOT listed here - it MUST be bundled
    // See browserUmdAliases documentation above for full rationale
};

/**
 * Server UMD specific fallback configuration
 * Server UMD excludes crypto (uses side-effect import) but allows AJV
 */
export const fallbackServerUMD = {
    ...fallbackUMD,
    // Server UMD excludes crypto - uses side-effect import instead
};