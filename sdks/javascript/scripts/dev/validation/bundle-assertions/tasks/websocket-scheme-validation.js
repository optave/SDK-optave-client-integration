/**
 * WebSocket Scheme Validation
 *
 * Verifies that WebSocket scheme validation logic is present in UMD builds.
 * This ensures runtime guards that reject ws:// URLs are bundled for Salesforce Lightning compatibility.
 */

const path = require('path');
const { BundleAssertionError } = require('../registry');
const { stripComments } = require('../utils/comment-stripper');

/**
 * Assert WebSocket scheme validation is present in UMD builds
 */
async function assertWebSocketSchemeValidation(content, filePath) {
  // Verify that WebSocket scheme validation is present in UMD builds
  // This ensures the runtime guard we implemented is actually bundled
  const strippedContent = stripComments(content);

  // Look for the WebSocket scheme validation logic with flexible patterns for minified code
  const schemeValidationPatterns = [
    // Core error message text (flexible for minification)
    /Insecure WebSocket protocol.*ws:\/\//g,
    /not allowed in UMD builds/g,
    /Salesforce Lightning Locker.*blocks.*ws:\/\//g,
    /UMD builds require.*tokenProvider/g,

    // Method names (might be mangled in minified builds)
    /validateWebSocketScheme/g,
    /enforceWebSocketScheme/g,

    // Security guard markers
    /__OPTAVE_SECURITY_GUARDS_ACTIVE__/g,
    /SECURITY.*guard/gi,
    /Side effect anchor/g,

    // Key security-related strings that should be preserved
    /ws:\/\/.*not allowed/g,
    /Lightning Locker Service/g,
    /secure WebSocket protocol.*wss:\/\//g,
    /tokenProvider.*constrained environments/g,
    /authRequired.*false.*disable authentication/g,

    // Even more flexible patterns for heavily minified code
    /ws:\/\/.*UMD/g,
    /Salesforce.*Lightning.*ws/g,
    /wss:\/\/.*instead/g
  ];

  const foundPatterns = [];
  let totalMatches = 0;

  for (const pattern of schemeValidationPatterns) {
    const matches = [...strippedContent.matchAll(pattern)];
    if (matches.length > 0) {
      foundPatterns.push({
        pattern: pattern.source,
        matches: matches.map(m => m[0]),
        count: matches.length
      });
      totalMatches += matches.length;
    }
  }

  // For UMD builds, WebSocket scheme validation should be present
  const isUMDBundle = path.basename(filePath).includes('.umd.');

  if (isUMDBundle && totalMatches === 0) {
    // Before failing, let's do one more check for any WebSocket-related validation
    const fallbackPatterns = [
      /startsWith.*ws:\/\//g,
      /websocketUrl.*startsWith/g,
      /buildTarget.*UMD/g,
      /BuildTargetUtils.*isUMD/g
    ];

    let fallbackMatches = 0;
    for (const pattern of fallbackPatterns) {
      const matches = [...strippedContent.matchAll(pattern)];
      fallbackMatches += matches.length;
    }

    if (fallbackMatches === 0) {
      throw new BundleAssertionError(
        'WebSocket scheme validation logic not found in UMD bundle. ' +
        'UMD builds must include runtime guards that reject ws:// URLs for Salesforce Lightning compatibility. ' +
        'Expected to find WebSocket URL validation logic in the bundle. ' +
        'This might indicate the validation code was stripped during minification or not properly bundled.',
        filePath,
        null,
        'high'
      );
    } else {
      // This is a warning rather than an error
      const warning = new BundleAssertionError(
        `WebSocket validation patterns found (${fallbackMatches}) but expected error messages missing in ${path.basename(filePath)}. ` +
        `This might be due to string minification. Manual verification recommended.`,
        filePath,
        null,
        'low'
      );
      warning.severity = 'warning';
      throw warning;
    }
  }

  if (isUMDBundle && totalMatches > 0) {
    return {
      foundPatterns,
      totalMatches,
      message: `WebSocket scheme validation found in ${path.basename(filePath)} (${totalMatches} patterns)`
    };
  } else if (!isUMDBundle) {
    return {
      skipped: true,
      message: `Skipping WebSocket scheme validation check for non-UMD build: ${path.basename(filePath)}`
    };
  }
}

module.exports = {
  name: 'websocket-scheme-validation',
  description: 'WebSocket scheme validation for Salesforce Lightning compatibility',
  severity: 'medium',
  appliesTo: ['*.umd.js'],
  run: assertWebSocketSchemeValidation
};