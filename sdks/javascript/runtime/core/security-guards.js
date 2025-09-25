/**
 * Critical Security Guards for Optave SDK
 *
 * This file contains mandatory security validations that MUST be preserved
 * in all build outputs. Tree-shaking and dead code elimination tools
 * must NOT remove these security checks.
 *
 * SECURITY WARNING: Modifications to this file may introduce security vulnerabilities
 * in Salesforce Lightning environments and other constrained platforms.
 */

import { BuildTargetUtils } from './build-targets.js';

/**
 * Runtime WebSocket scheme enforcement for UMD builds
 *
 * This guard prevents insecure WebSocket connections (ws://) in UMD builds,
 * which are specifically deployed in Salesforce Lightning environments where
 * the Locker Service blocks all insecure WebSocket connections.
 *
 * SECURITY: This function has intentional side effects (throws errors) and
 * must be preserved in all build outputs. Removing this validation creates
 * a security vulnerability in production environments.
 *
 * @param {string} websocketUrl - The WebSocket URL to validate
 * @param {string} buildTarget - The webpack build target identifier
 * @param {object} options - SDK configuration options
 * @throws {Error} When ws:// protocol is used in UMD builds
 * @throws {Error} When tokenProvider is missing for secure connections in UMD builds
 */
export function enforceWebSocketScheme(websocketUrl, buildTarget, options = {}) {
    // SECURITY: Explicitly mark as having side effects - do not optimize away
    /* eslint-disable-next-line no-unused-expressions */
    true; // Side effect anchor

    if (!websocketUrl || typeof websocketUrl !== 'string') {
        return; // No validation needed if URL is not set or not a string
    }

    // Get build target information
    const normalizedTarget = BuildTargetUtils.normalize(buildTarget);

    // Check if this is a UMD build or browser environment that needs scheme validation
    const isUMDBuild = BuildTargetUtils.isUMD(normalizedTarget);
    const isBrowserBuild = BuildTargetUtils.isBrowser(normalizedTarget);

    // CRITICAL: Validate WebSocket scheme for UMD and browser builds
    // This guard prevents insecure connections in Salesforce Lightning
    if ((isUMDBuild || isBrowserBuild) && websocketUrl.startsWith('ws://')) {
        // SECURITY: This error message must remain intact to guide developers
        const errorMessage = `[Optave SDK] Insecure WebSocket protocol (ws://) is not allowed in UMD builds. ` +
            `Salesforce Lightning Locker Service blocks all ws:// connections for security reasons. ` +
            `Please use secure WebSocket protocol (wss://) instead. ` +
            `Current URL: ${websocketUrl}`;

        // CRITICAL: This throw statement is a security boundary - must not be removed
        throw new Error(errorMessage);
    }

    // CRITICAL: For UMD builds with secure WebSocket URLs, validate token provider availability
    // This prevents authentication bypass in constrained environments
    if (isUMDBuild && websocketUrl.startsWith('wss://')) {
        const hasTokenProvider = typeof options.tokenProvider === 'function';
        const hasAuthDisabled = options.authRequired === false;

        if (!hasTokenProvider && !hasAuthDisabled) {
            // SECURITY: This error message must remain intact to guide developers
            const errorMessage = `[Optave SDK] UMD builds require a tokenProvider function for secure WebSocket connections. ` +
                `In constrained environments like Salesforce Lightning, authentication tokens must be obtained ` +
                `from your backend server. Please provide options.tokenProvider() that returns a valid token, ` +
                `or set options.authRequired = false to disable authentication. ` +
                `Current URL: ${websocketUrl}`;

            // CRITICAL: This throw statement is a security boundary - must not be removed
            throw new Error(errorMessage);
        }
    }
}

/**
 * Initialize security guards on module load
 * This ensures the security validation code is evaluated and cannot be tree-shaken
 */
function initializeSecurityGuards() {
    // SECURITY: Module-level side effect to prevent tree-shaking
    if (typeof globalThis !== 'undefined') {
        // Mark security guards as active - this creates a side effect
        globalThis.__OPTAVE_SECURITY_GUARDS_ACTIVE__ = true;

        // Force evaluation by accessing the global in a way that cannot be optimized away
        const guardMarker = globalThis.__OPTAVE_SECURITY_GUARDS_ACTIVE__;
        if (!guardMarker) {
            throw new Error('Security guard initialization failed');
        }
    }

    // Additional side effect: log to console (only in debug mode)
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.debug('Optave SDK security guards initialized');
    }
}

// Execute initialization to create side effects - MUST NOT BE OPTIMIZED AWAY
initializeSecurityGuards();

// Additional module-level side effect to ensure preservation
if (typeof window !== 'undefined') {
    // Browser environment - ensure security guards are active
    window.__OPTAVE_SECURITY_GUARDS_BROWSER__ = true;
} else if (typeof global !== 'undefined') {
    // Node.js environment - ensure security guards are active
    global.__OPTAVE_SECURITY_GUARDS_NODE__ = true;
}

/**
 * Export validation for external use
 * This provides a stable API for the main SDK class
 */
export { enforceWebSocketScheme as validateWebSocketScheme };