/**
 * AJV Exclusion Assertion
 *
 * Ensures browser builds exclude AJV imports to maintain CSP compliance.
 * Server builds are exempt from this check as they can safely include AJV.
 */

const path = require('path');
const { BundleAssertionError } = require('../registry');
const { stripComments } = require('../utils/comment-stripper');

/**
 * Assert that browser builds do not include AJV imports
 */
async function assertNoAJVImports(content, filePath) {
  // Check if this is a browser UMD build (should not have AJV imports)
  const isBrowserBuild = path.basename(filePath).includes('browser');

  if (!isBrowserBuild) {
    return {
      skipped: true,
      message: `Skipping AJV check for server build: ${path.basename(filePath)}`
    };
  }

  // Strip comments before scanning to avoid false matches in comments
  const strippedContent = stripComments(content);

  // Enhanced AJV detection patterns with word boundaries and context awareness
  const ajvPatterns = [
    {
      pattern: /\brequire\s*\(\s*["']ajv["']\s*\)/g,
      description: 'CommonJS require of AJV module',
      severity: 'high'
    },
    {
      pattern: /\bimport\b.*\bfrom\s*["']ajv["']/g,
      description: 'ES6 import from AJV module',
      severity: 'high'
    },
    {
      pattern: /\bimport\s*\(\s*["']ajv["']\s*\)/g,
      description: 'Dynamic import of AJV module',
      severity: 'high'
    },
    {
      pattern: /\bnew\s+Ajv\b\s*\(/g,
      description: 'AJV constructor instantiation',
      severity: 'high'
    },
    {
      pattern: /\bajv\.(?:compile|validate|addSchema|addFormat|removeSchema|getSchema|validateSchema)\b/g,
      description: 'AJV instance method call',
      severity: 'high'
    },
    {
      pattern: /\bAjv\.(?:compile|validate|addSchema|addFormat|removeSchema|getSchema|validateSchema)\b/g,
      description: 'AJV static method call',
      severity: 'high'
    },
    {
      pattern: /\bajv\.default\b/g,
      description: 'AJV default export access',
      severity: 'medium'
    },
    {
      pattern: /\bAjv\.default\b/g,
      description: 'AJV default export access (capitalized)',
      severity: 'medium'
    },
    {
      pattern: /\b["']ajv["']\b(?!\s*[:\-,])/g,
      description: 'Standalone AJV string literal',
      severity: 'medium'
    }
  ];

  // Comprehensive safe patterns - expanded whitelist for legitimate documentation
  const safeAjvPatterns = [
    // Documentation and comment patterns
    /AJV[-_\s]compatible/i,
    /without[\s_-]*AJV/i,
    /no[\s_-]*AJV/i,
    /disable[\s_-]*AJV/i,
    /exclude[\s_-]*AJV/i,
    /fallback[\s_-]*AJV/i,
    /stub[\s_-]*AJV/i,
    /mock[\s_-]*AJV/i,

    // Descriptive text patterns
    /provides.*validation.*without.*ajv/i,
    /alternative.*to.*ajv/i,
    /instead.*of.*ajv/i,
    /rather.*than.*ajv/i,
    /replaces.*ajv/i,

    // Configuration and build patterns
    /externals.*ajv/i,
    /webpack.*external.*ajv/i,
    /bundle.*without.*ajv/i,
    /exclude.*from.*bundle.*ajv/i,

    // Error and warning patterns that mention AJV safely
    /error.*ajv.*not.*found/i,
    /warning.*ajv.*missing/i,
    /cannot.*load.*ajv/i,
    /ajv.*not.*available/i,
    /ajv.*unavailable/i,

    // Comparison and feature patterns
    /like.*ajv/i,
    /similar.*to.*ajv/i,
    /compared.*to.*ajv/i,
    /versus.*ajv/i,
    /vs\.?.*ajv/i,

    // Safe string contexts (JSON keys, metadata)
    /"[^"]*description[^"]*ajv[^"]*"/i,
    /"[^"]*note[^"]*ajv[^"]*"/i,
    /"[^"]*comment[^"]*ajv[^"]*"/i,
    /"[^"]*warning[^"]*ajv[^"]*"/i,

    // Build and development tool contexts
    /eslint.*ajv/i,
    /prettier.*ajv/i,
    /babel.*ajv/i,
    /typescript.*ajv/i,
    /jest.*ajv/i,
    /vitest.*ajv/i
  ];

  const violations = [];

  for (const { pattern, description, severity } of ajvPatterns) {
    const matches = [...strippedContent.matchAll(pattern)];

    for (const match of matches) {
      const matchStart = match.index;
      const lineStart = content.lastIndexOf('\n', matchStart);
      const lineEnd = content.indexOf('\n', matchStart);
      const line = content.slice(lineStart + 1, lineEnd === -1 ? undefined : lineEnd);
      const lineNumber = content.slice(0, matchStart).split('\n').length;

      // Check immediate line context
      const isSafe = safeAjvPatterns.some(safePattern => {
        return safePattern.test(line) || safePattern.test(line.toLowerCase());
      });

      // Check broader context (surrounding 400 characters)
      const contextStart = Math.max(0, lineStart - 200);
      const contextEnd = Math.min(content.length, lineEnd + 200);
      const context = content.slice(contextStart, contextEnd);
      const isInSafeContext = safeAjvPatterns.some(pattern => {
        return pattern.test(context) || pattern.test(context.toLowerCase());
      });

      if (!isSafe && !isInSafeContext) {
        violations.push({
          pattern: pattern.source,
          match: match[0],
          line: lineNumber,
          content: line.trim(),
          description,
          severity,
          context: context.slice(0, 150) + '...' // First 150 chars of context for debugging
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
      `AJV import/reference found in browser build (${highSeverityCount} high, ${mediumSeverityCount} medium severity violations):\n  ${violationDetails}`,
      filePath,
      null,
      'high'
    );
  }

  return {
    message: `No AJV imports found in browser build: ${path.basename(filePath)}`
  };
}

module.exports = {
  name: 'ajv-exclusion',
  description: 'Browser build AJV import exclusion validation',
  severity: 'high',
  appliesTo: ['*browser*'],
  run: assertNoAJVImports
};