// Environment-specific API adaptation module
// Provides controlled polyfill imports with explicit dependency visibility for tree-shakers

/**
 * Environment Adapter for Cross-Platform APIs
 *
 * This module provides a centralized way to adapt platform-specific APIs
 * for different build environments (browser UMD, server UMD, ESM).
 *
 * Benefits:
 * - Explicit dependency inclusion (no hidden webpack ProvidePlugin injection)
 * - Tree-shaking friendly with conditional imports
 * - Environment-specific optimization
 * - Clear separation of concerns
 */

let cryptoAdapter = null;
let webSocketAdapter = null;

/**
 * Get crypto implementation for current environment
 * @returns {Object} Crypto implementation with UUID generation methods
 */
export async function getCrypto() {
    if (cryptoAdapter) return cryptoAdapter;

    // Determine environment and load appropriate crypto implementation
    if (typeof window !== 'undefined' || typeof self !== 'undefined' || typeof globalThis?.document !== 'undefined') {
        // Browser environment - import browser crypto polyfill
        const { default: cryptoPolyfill } = await import('./browser/crypto-polyfill.js');
        cryptoAdapter = cryptoPolyfill;
    } else {
        // Node.js environment - use native crypto module
        try {
            const { randomUUID, getRandomValues } = await import('crypto');
            cryptoAdapter = {
                randomUUID: randomUUID || (() => {
                    throw new Error('randomUUID not available in this Node.js version');
                }),
                generateUUID: randomUUID || (() => {
                    throw new Error('randomUUID not available in this Node.js version');
                }),
                generateShortId: () => Math.random().toString(36).substr(2, 9),
                getRandomValues: getRandomValues || ((array) => {
                    const crypto = require('crypto');
                    const bytes = crypto.randomBytes(array.length);
                    for (let i = 0; i < array.length; i++) {
                        array[i] = bytes[i];
                    }
                    return array;
                })
            };
        } catch (error) {
            // Fallback for environments without native crypto
            cryptoAdapter = {
                randomUUID: () => {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = Math.random() * 16 | 0;
                        const v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                },
                generateUUID: function() { return this.randomUUID(); },
                generateShortId: () => Math.random().toString(36).substr(2, 9),
                getRandomValues: (array) => {
                    for (let i = 0; i < array.length; i++) {
                        array[i] = Math.floor(Math.random() * 256);
                    }
                    return array;
                }
            };
        }
    }

    return cryptoAdapter;
}

/**
 * Get crypto implementation synchronously (for environments where async loading isn't needed)
 * @returns {Object} Crypto implementation
 */
export function getCryptoSync() {
    if (cryptoAdapter) return cryptoAdapter;

    // For synchronous access, we need to have the crypto already loaded
    // This is primarily used in UMD builds where crypto-polyfill is pre-imported
    if (typeof window !== 'undefined' || typeof self !== 'undefined' || typeof globalThis?.document !== 'undefined') {
        // Browser environment - check for globally available crypto
        if (typeof globalThis?.crypto?.generateUUID === 'function') {
            cryptoAdapter = globalThis.crypto;
        } else if (typeof window?.crypto?.generateUUID === 'function') {
            cryptoAdapter = window.crypto;
        } else {
            throw new Error('Crypto polyfill not loaded. Import crypto-polyfill.js first or use getCrypto() async method.');
        }
    } else {
        // Node.js environment - use require for synchronous loading
        try {
            const crypto = require('crypto');
            cryptoAdapter = {
                randomUUID: crypto.randomUUID || (() => {
                    throw new Error('randomUUID not available in this Node.js version');
                }),
                generateUUID: crypto.randomUUID || (() => {
                    throw new Error('randomUUID not available in this Node.js version');
                }),
                generateShortId: () => Math.random().toString(36).substr(2, 9),
                getRandomValues: crypto.getRandomValues || ((array) => {
                    const bytes = crypto.randomBytes(array.length);
                    for (let i = 0; i < array.length; i++) {
                        array[i] = bytes[i];
                    }
                    return array;
                })
            };
        } catch (error) {
            throw new Error('Native crypto module not available in this environment');
        }
    }

    return cryptoAdapter;
}

/**
 * Get WebSocket implementation for current environment
 * @returns {Promise<WebSocket>} WebSocket constructor
 */
export async function getWebSocket() {
    if (webSocketAdapter) return webSocketAdapter;

    if (typeof WebSocket !== 'undefined') {
        // WebSocket is globally available (browser, modern Node.js)
        webSocketAdapter = WebSocket;
    } else {
        // Node.js environment - load ws library
        try {
            const { default: WS } = await import('ws');
            webSocketAdapter = WS;
        } catch (error) {
            throw new Error('WebSocket not available. Install "ws" package for Node.js environments.');
        }
    }

    return webSocketAdapter;
}

/**
 * Reset adapters (useful for testing)
 */
export function resetAdapters() {
    cryptoAdapter = null;
    webSocketAdapter = null;
}

/**
 * Check if we're in a browser environment
 * @returns {boolean} True if browser environment
 */
export function isBrowser() {
    return typeof window !== 'undefined' || typeof self !== 'undefined' || typeof globalThis?.document !== 'undefined';
}

/**
 * Check if we're in a Node.js environment
 * @returns {boolean} True if Node.js environment
 */
export function isNode() {
    return typeof process !== 'undefined' && process?.versions?.node;
}

/**
 * Get environment type string
 * @returns {string} 'browser', 'node', or 'unknown'
 */
export function getEnvironment() {
    if (isBrowser()) return 'browser';
    if (isNode()) return 'node';
    return 'unknown';
}

// Note: This module provides an abstraction layer for environment-specific APIs
// The actual crypto polyfill initialization happens through direct imports in entry points
// This ensures compatibility across all build targets while providing explicit import patterns