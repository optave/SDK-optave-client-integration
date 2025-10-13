/**
 * Global SDK Presence Assertion
 *
 * Validates that UMD bundles properly expose the OptaveJavaScriptSDK global.
 * This is critical for UMD compatibility across different module systems.
 */

const path = require('path');
const { BundleAssertionError } = require('../registry');
const { stripComments } = require('../utils/comment-stripper');

/**
 * Assert that the global OptaveJavaScriptSDK is properly exposed
 */
async function assertGlobalSDKPresence(content, filePath) {
  // Strip comments before scanning to avoid false matches in comments
  const strippedContent = stripComments(content);

  // Hardened patterns for UMD global assignment forms with improved minification resilience
  const strictGlobalPatterns = [
    // Direct assignment patterns: (globalThis|window|root)[.|["]]OptaveJavaScriptSDK
    /\b(?:globalThis|window|root)(?:\.|(?:\[["']))OptaveJavaScriptSDK(?:["']\])?/g,
    // Module exports: exports[.|["]]OptaveJavaScriptSDK
    /\bexports(?:\.|(?:\[["']))OptaveJavaScriptSDK(?:["']\])?/g,
    // Enhanced UMD wrapper assignment patterns - handles minified variants with generic root capture
    /(?:(?:globalThis|window|self|root|this|[a-zA-Z_$])(?:\.[a-zA-Z_$][\w$]*)*)[.\[]["']?OptaveJavaScriptSDK["']?[\]]?\s*=/g,
    // Original pattern for backward compatibility
    /\b[a-zA-Z_$][\w$]*(?:\.|(?:\[["']))OptaveJavaScriptSDK(?:["']\])?\s*=\s*[a-zA-Z_$]/g
  ];

  const matchedPatterns = [];
  let totalMatches = 0;

  for (const pattern of strictGlobalPatterns) {
    const matches = [...strippedContent.matchAll(pattern)];
    if (matches.length > 0) {
      matchedPatterns.push({
        pattern: pattern.source,
        matches: matches.map(m => m[0]),
        count: matches.length
      });
      totalMatches += matches.length;
    }
  }

  if (totalMatches === 0) {
    throw new BundleAssertionError(
      'Global OptaveJavaScriptSDK assignment not found in UMD wrapper. Expected patterns like: globalThis.OptaveJavaScriptSDK, window["OptaveJavaScriptSDK"], root.OptaveJavaScriptSDK, or exports.OptaveJavaScriptSDK',
      filePath,
      null,
      'high'
    );
  }

  // Return success context for reporting
  return {
    matchedPatterns,
    totalMatches,
    message: `Global OptaveJavaScriptSDK assignment found in ${path.basename(filePath)} (${totalMatches} matches)`
  };
}

module.exports = {
  name: 'global-sdk-presence',
  description: 'Global OptaveJavaScriptSDK exposure validation',
  severity: 'high',
  appliesTo: ['*.umd.js'],
  run: assertGlobalSDKPresence
};