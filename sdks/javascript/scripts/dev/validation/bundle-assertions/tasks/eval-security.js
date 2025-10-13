/**
 * Eval Security Assertion
 *
 * Detects dangerous eval() and Function() patterns that violate CSP policies.
 * Uses robust comment stripping and context-aware whitelisting to prevent false positives.
 */

const path = require('path');
const { BundleAssertionError } = require('../registry');
const { stripComments } = require('../utils/comment-stripper');

/**
 * Assert that no dangerous eval/Function tokens are present
 */
async function assertNoEvalTokens(content, filePath) {
  // Strip comments first to avoid false matches in comments
  const strippedContent = stripComments(content);

  // Enhanced dangerous patterns with word boundaries and context awareness
  const dangerousPatterns = [
    {
      pattern: /\beval\s*\(/g,
      description: 'Direct eval() call',
      severity: 'high'
    },
    {
      pattern: /\bnew\s+Function\s*\(/g,
      description: 'Function constructor call',
      severity: 'high'
    },
    {
      pattern: /\[[\s"']*eval[\s"']*\]/g,
      description: 'Bracket notation eval access',
      severity: 'medium'
    },
    {
      pattern: /\.eval\s*\(/g,
      description: 'Property-based eval call',
      severity: 'medium'
    },
    {
      pattern: /window\[[\s"']*eval[\s"']*\]/g,
      description: 'Window eval access',
      severity: 'high'
    },
    {
      pattern: /globalThis\[[\s"']*eval[\s"']*\]/g,
      description: 'GlobalThis eval access',
      severity: 'high'
    }
  ];

  // Enhanced safe patterns - comprehensive whitelist for legitimate uses
  const safeContextPatterns = [
    // SDK-specific patterns
    /availableValidators/i,
    /isPayloadSizeValid/i,
    /validatePayload/i,
    /OptaveJavaScriptSDK/i,

    // Babel and build tool patterns
    /Function\.toString\.call/i,
    /\[native code\]/i,
    /_isNativeFunction/i,
    /babel[-_]helper/i,
    /webpack[-_]helper/i,

    // Safe string literal contexts
    /"[^"]*eval[^"]*"/,  // In double quotes
    /'[^']*eval[^']*'/,  // In single quotes
    /`[^`]*eval[^`]*`/,  // In template literals

    // Documentation and metadata patterns
    /description[:\s]*['""][^'"]*eval/i,
    /comment[:\s]*['""][^'"]*eval/i,
    /note[:\s]*['""][^'"]*eval/i,
    /warning[:\s]*['""][^'"]*eval/i,

    // Error message patterns that reference eval safely
    /error.*message.*eval/i,
    /cannot.*use.*eval/i,
    /eval.*not.*allowed/i,
    /eval.*forbidden/i,

    // Build configuration references
    /externals.*eval/i,
    /exclude.*eval/i,
    /ignore.*eval/i
  ];

  const violations = [];

  for (const { pattern, description, severity } of dangerousPatterns) {
    const matches = [...strippedContent.matchAll(pattern)];

    for (const match of matches) {
      const matchStart = match.index;
      const lineStart = content.lastIndexOf('\n', matchStart);
      const lineEnd = content.indexOf('\n', matchStart);
      const line = content.slice(lineStart + 1, lineEnd === -1 ? undefined : lineEnd);
      const lineNumber = content.slice(0, matchStart).split('\n').length;

      // Check if this is in a safe context
      const isSafe = safeContextPatterns.some(safePattern => {
        return safePattern.test(line) || safePattern.test(line.toLowerCase());
      });

      // Additional context check: look at surrounding lines for better context
      const contextStart = Math.max(0, lineStart - 200);
      const contextEnd = Math.min(content.length, lineEnd + 200);
      const context = content.slice(contextStart, contextEnd);
      const isInSafeContext = safeContextPatterns.some(pattern => pattern.test(context));

      if (!isSafe && !isInSafeContext) {
        violations.push({
          pattern: pattern.source,
          match: match[0],
          line: lineNumber,
          content: line.trim(),
          description,
          severity,
          context: context.slice(0, 100) + '...' // First 100 chars of context
        });
      }
    }
  }

  if (violations.length > 0) {
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;

    const violationDetails = violations.map(v =>
      `[${v.severity.toUpperCase()}] ${v.description} | Match: "${v.match}" | Line ${v.line}: ${v.content}`
    ).join('\n  ');

    throw new BundleAssertionError(
      `Dangerous eval/Function patterns found (${highSeverityCount} high, ${mediumSeverityCount} medium severity):\n  ${violationDetails}`,
      filePath,
      null,
      'high'
    );
  }

  return {
    message: `No dangerous eval/Function tokens found in ${path.basename(filePath)}`
  };
}

module.exports = {
  name: 'eval-security',
  description: 'CSP-compliant eval/Function security validation',
  severity: 'high',
  appliesTo: ['*'],
  run: assertNoEvalTokens
};