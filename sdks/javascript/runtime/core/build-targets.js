/**
 * Standardized build target enum and utilities
 *
 * This module provides a centralized definition of all build targets
 * used across webpack configurations and runtime code.
 */

/**
 * Build target enum with all possible build configurations
 * @readonly
 * @enum {string}
 */
export const BUILD_TARGETS = {
    /** Browser ESM build (browser.mjs) - for modern ES modules in browsers */
    BROWSER_ESM: 'browser-esm',

    /** Server ESM build (server.mjs) - for Node.js ES modules */
    SERVER_ESM: 'server-esm',

    /** Browser UMD build (browser.umd.js) - for browsers with UMD wrapper */
    BROWSER_UMD: 'browser-umd',

    /** Server UMD build (server.umd.js) - for Salesforce/constrained environments */
    SERVER_UMD: 'server-umd'
};

/**
 * Legacy build target mapping for backward compatibility
 * Maps old 'browser'/'server' values to new specific targets
 * @readonly
 */
export const LEGACY_BUILD_TARGET_MAP = {
    'browser': BUILD_TARGETS.BROWSER_ESM,
    'server': BUILD_TARGETS.SERVER_ESM
};

/**
 * Build target categories for easier classification
 * @readonly
 */
export const BUILD_TARGET_CATEGORIES = {
    /** All browser-targeted builds (including server UMD which runs in browser environments like Salesforce) */
    BROWSER: [BUILD_TARGETS.BROWSER_ESM, BUILD_TARGETS.BROWSER_UMD, BUILD_TARGETS.SERVER_UMD],

    /** All server-targeted builds (only server ESM runs in pure Node.js environments) */
    SERVER: [BUILD_TARGETS.SERVER_ESM],

    /** All UMD builds */
    UMD: [BUILD_TARGETS.BROWSER_UMD, BUILD_TARGETS.SERVER_UMD],

    /** All ESM builds */
    ESM: [BUILD_TARGETS.BROWSER_ESM, BUILD_TARGETS.SERVER_ESM]
};

/**
 * Utility functions for build target operations
 */
export const BuildTargetUtils = {
    /**
     * Check if a build target is valid
     * @param {string} target - The build target to validate
     * @returns {boolean} True if valid
     */
    isValid(target) {
        return Object.values(BUILD_TARGETS).includes(target) ||
               Object.keys(LEGACY_BUILD_TARGET_MAP).includes(target);
    },

    /**
     * Normalize a build target (handles legacy values)
     * @param {string} target - The build target to normalize
     * @returns {string} Normalized build target
     */
    normalize(target) {
        if (LEGACY_BUILD_TARGET_MAP[target]) {
            return LEGACY_BUILD_TARGET_MAP[target];
        }
        return Object.values(BUILD_TARGETS).includes(target) ? target : 'unknown';
    },

    /**
     * Check if build target is browser-focused
     * @param {string} target - The build target to check
     * @returns {boolean} True if browser build
     */
    isBrowser(target) {
        const normalized = this.normalize(target);
        return BUILD_TARGET_CATEGORIES.BROWSER.includes(normalized);
    },

    /**
     * Check if build target is server-focused
     * @param {string} target - The build target to check
     * @returns {boolean} True if server build
     */
    isServer(target) {
        const normalized = this.normalize(target);
        return BUILD_TARGET_CATEGORIES.SERVER.includes(normalized);
    },

    /**
     * Check if build target is UMD format
     * @param {string} target - The build target to check
     * @returns {boolean} True if UMD build
     */
    isUMD(target) {
        const normalized = this.normalize(target);
        return BUILD_TARGET_CATEGORIES.UMD.includes(normalized);
    },

    /**
     * Check if build target is ESM format
     * @param {string} target - The build target to check
     * @returns {boolean} True if ESM build
     */
    isESM(target) {
        const normalized = this.normalize(target);
        return BUILD_TARGET_CATEGORIES.ESM.includes(normalized);
    },

    /**
     * Get build target info for debugging
     * @param {string} target - The build target to analyze
     * @returns {object} Build target information
     */
    getInfo(target) {
        const normalized = this.normalize(target);
        return {
            original: target,
            normalized,
            valid: this.isValid(target),
            isBrowser: this.isBrowser(target),
            isServer: this.isServer(target),
            isUMD: this.isUMD(target),
            isESM: this.isESM(target)
        };
    }
};