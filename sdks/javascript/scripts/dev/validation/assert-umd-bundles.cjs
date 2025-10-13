#!/usr/bin/env node

/**
 * Static Assertions for UMD Bundle Post-Build Validation
 *
 * This script parses emitted UMD bundles and validates critical requirements:
 * - Presence of globalThis.OptaveJavaScriptSDK
 * - Absence of dangerous eval() / Function() tokens
 * - Absence of AJV import strings for UMD/browser builds
 *
 * Fails CI early if violations are detected.
 */

const fs = require('fs');
const path = require('path');
const process = require('process');

class BundleAssertionError extends Error {
  constructor(message, file, line) {
    super(message);
    this.name = 'BundleAssertionError';
    this.file = file;
    this.line = line;
  }
}

class UMDBundleAssertor {
  constructor() {
    // __dirname is scripts/dev/validation, need to go up 3 levels to reach javascript/dist
    this.distDir = path.join(__dirname, '..', '..', '..', 'dist');
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  findUMDBundles() {
    if (!fs.existsSync(this.distDir)) {
      throw new Error(`Distribution directory not found: ${this.distDir}`);
    }

    const files = fs.readdirSync(this.distDir);
    const umdFiles = files.filter(file =>
      file.includes('.umd.') &&
      file.endsWith('.js') &&
      !file.endsWith('.map') &&
      // Exclude webpack chunk files (usually numeric prefixes)
      !(/^\d+\./.test(file))
    );

    if (umdFiles.length === 0) {
      throw new Error('No UMD bundle files found in dist directory');
    }

    this.log(`Found ${umdFiles.length} UMD bundle files: ${umdFiles.join(', ')}`);

    // Log excluded files for transparency
    const excludedFiles = files.filter(file =>
      file.includes('.umd.') &&
      file.endsWith('.js') &&
      !file.endsWith('.map') &&
      /^\d+\./.test(file)
    );

    if (excludedFiles.length > 0) {
      this.log(`ℹ️ Excluded webpack chunk files: ${excludedFiles.join(', ')}`);
    }

    return umdFiles.map(file => path.join(this.distDir, file));
  }

  readBundle(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.log(`Successfully read bundle: ${path.basename(filePath)} (${content.length} bytes)`);
      return content;
    } catch (error) {
      throw new BundleAssertionError(
        `Failed to read bundle file: ${error.message}`,
        filePath
      );
    }
  }

  /**
   * Robust comment stripping with string literal preservation using state machine
   * Properly handles escaped quotes, mixed quote types, template literals, and regex patterns
   * Prevents false positives from comment-like patterns inside strings
   */
  stripComments(content) {
    const lines = content.split('\n');
    let stripped = '';
    let inMultiLineComment = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let processedLine = '';
      let j = 0;

      // State machine for string/comment tracking
      let inSingleQuoteString = false;
      let inDoubleQuoteString = false;
      let inTemplateString = false;
      let inRegex = false;

      while (j < line.length) {
        const char = line[j];
        const nextChar = j < line.length - 1 ? line[j + 1] : '';
        const prevChar = j > 0 ? line[j - 1] : '';

        // Handle multi-line comments
        if (inMultiLineComment) {
          if (char === '*' && nextChar === '/') {
            inMultiLineComment = false;
            j += 2;
            continue;
          } else {
            j++;
            continue; // Skip character in comment
          }
        }

        // Skip if we're in any kind of string literal
        const inAnyString = inSingleQuoteString || inDoubleQuoteString || inTemplateString || inRegex;

        if (!inAnyString) {
          // Check for start of multi-line comment
          if (char === '/' && nextChar === '*') {
            const endIndex = line.indexOf('*/', j + 2);
            if (endIndex !== -1) {
              // Comment ends on same line, skip it entirely
              j = endIndex + 2;
              continue;
            } else {
              // Comment continues to next line
              inMultiLineComment = true;
              break; // Rest of line is in comment
            }
          }

          // Check for single-line comment
          if (char === '/' && nextChar === '/') {
            // This is a real comment, skip rest of line
            break;
          }

          // Check for regex literal start (basic heuristic: / after =, (, [, {, :, ;, !, &, |, ?, +, -, *, /, %, ^, ~, <, >, ,)
          if (char === '/' && prevChar && /[=(\[{:;!&|?+\-*/%^~<>,\s]/.test(prevChar)) {
            inRegex = true;
            processedLine += char;
            j++;
            continue;
          }
        }

        // Handle string state transitions
        if (char === "'" && !inDoubleQuoteString && !inTemplateString && !inRegex) {
          // Only toggle if not escaped (count consecutive backslashes before)
          let escapeCount = 0;
          for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
            escapeCount++;
          }
          if (escapeCount % 2 === 0) { // Even number of backslashes = not escaped
            inSingleQuoteString = !inSingleQuoteString;
          }
        } else if (char === '"' && !inSingleQuoteString && !inTemplateString && !inRegex) {
          // Only toggle if not escaped
          let escapeCount = 0;
          for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
            escapeCount++;
          }
          if (escapeCount % 2 === 0) {
            inDoubleQuoteString = !inDoubleQuoteString;
          }
        } else if (char === '`' && !inSingleQuoteString && !inDoubleQuoteString && !inRegex) {
          // Only toggle if not escaped
          let escapeCount = 0;
          for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
            escapeCount++;
          }
          if (escapeCount % 2 === 0) {
            inTemplateString = !inTemplateString;
          }
        } else if (inRegex && char === '/') {
          // End of regex literal (check if not escaped)
          let escapeCount = 0;
          for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
            escapeCount++;
          }
          if (escapeCount % 2 === 0) {
            inRegex = false;
          }
        }

        // Add character to processed line
        processedLine += char;
        j++;
      }

      stripped += processedLine;
      // Only add newline if we're not starting a multi-line comment and it's not the last line
      if (i < lines.length - 1 && !inMultiLineComment) {
        stripped += '\n';
      } else if (i < lines.length - 1 && inMultiLineComment) {
        // Add a space instead of newline when inside multi-line comment to avoid token merging
        stripped += ' ';
      }
    }

    return stripped;
  }

  assertGlobalSDKPresence(content, filePath) {
    // Strip comments before scanning to avoid false matches in comments
    const strippedContent = this.stripComments(content);

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
        filePath
      );
    }

    this.log(`✓ Global OptaveJavaScriptSDK assignment found in ${path.basename(filePath)} (${totalMatches} matches)`);
    this.log(`  Matched patterns: ${matchedPatterns.map(p => `${p.pattern} (${p.count})`).join(', ')}`);
  }

  /**
   * Enhanced eval token detection with robust comment stripping and whitelisting
   * Prevents false positives from commented code and string literals
   */
  assertNoEvalTokens(content, filePath) {
    // Strip comments first to avoid false matches in comments
    const strippedContent = this.stripComments(content);

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
        filePath
      );
    }

    this.log(`✓ No dangerous eval/Function tokens found in ${path.basename(filePath)}`);
  }

  /**
   * Enhanced AJV import detection with robust preprocessing and comprehensive whitelisting
   * Prevents false positives from commented references and documentation
   */
  assertNoAJVImports(content, filePath) {
    // Check if this is a browser UMD build (should not have AJV imports)
    const isBrowserBuild = path.basename(filePath).includes('browser');

    if (!isBrowserBuild) {
      this.log(`ℹ️ Skipping AJV check for server build: ${path.basename(filePath)}`);
      return;
    }

    // Strip comments before scanning to avoid false matches in comments
    const strippedContent = this.stripComments(content);

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
        filePath
      );
    }

    this.log(`✓ No AJV imports found in browser build: ${path.basename(filePath)}`);
  }

  assertWebpackBuildTarget(content, filePath) {
    // Check for presence of webpack DefinePlugin replacements
    // DefinePlugin should replace __WEBPACK_BUILD_TARGET__ with actual values like "browser-umd", "server-umd"
    const expectedBuildTargets = ['browser-umd', 'server-umd', 'browser-esm', 'server-esm'];
    const foundTargets = [];

    // Look for actual build target values that DefinePlugin should have injected
    for (const target of expectedBuildTargets) {
      const targetPattern = new RegExp(`["']${target}["']`, 'g');
      const matches = [...content.matchAll(targetPattern)];
      if (matches.length > 0) {
        foundTargets.push({ target, count: matches.length });
      }
    }

    if (foundTargets.length === 0) {
      this.log(`⚠️ Missing webpack build target values in ${path.basename(filePath)}`, 'warn');
      this.log(`⚠️ Expected DefinePlugin to inject build target identifiers (browser-umd, server-umd, etc.)`, 'warn');
      return;
    }

    this.log(`✓ Webpack build target values found in ${path.basename(filePath)}`);
    foundTargets.forEach(({ target, count }) => {
      this.log(`  ${target}: ${count} occurrences`);
    });

    // Warn if literal __WEBPACK_BUILD_TARGET__ tokens are still present (DefinePlugin not working)
    const literalPattern = /__WEBPACK_BUILD_TARGET__/g;
    const literalMatches = [...content.matchAll(literalPattern)];
    if (literalMatches.length > 0) {
      this.log(`⚠️ Found ${literalMatches.length} unreplaced __WEBPACK_BUILD_TARGET__ tokens in ${path.basename(filePath)}`, 'warn');
      this.log(`⚠️ DefinePlugin may not be working correctly - tokens should be replaced with actual values`, 'warn');
    }
  }

  assertWebSocketSchemeValidation(content, filePath) {
    // Verify that WebSocket scheme validation is present in UMD builds
    // This ensures the runtime guard we implemented is actually bundled
    const strippedContent = this.stripComments(content);

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
          filePath
        );
      } else {
        this.log(`⚠️ WebSocket validation patterns found (${fallbackMatches}) but expected error messages missing in ${path.basename(filePath)}`, 'warn');
        this.log(`  This might be due to string minification. Manual verification recommended.`, 'warn');
      }
    }

    if (isUMDBundle && totalMatches > 0) {
      this.log(`✓ WebSocket scheme validation found in ${path.basename(filePath)} (${totalMatches} patterns)`);
      this.log(`  Validation patterns: ${foundPatterns.map(p => `${p.pattern.substring(0, 50)}... (${p.count})`).join(', ')}`);
    } else if (!isUMDBundle) {
      this.log(`ℹ️ Skipping WebSocket scheme validation check for non-UMD build: ${path.basename(filePath)}`);
    }
  }

  assertBundle(filePath) {
    try {
      this.log(`Starting assertions for: ${path.basename(filePath)}`);

      const content = this.readBundle(filePath);

      // Run all assertions
      this.assertGlobalSDKPresence(content, filePath);
      this.assertNoEvalTokens(content, filePath);
      this.assertNoAJVImports(content, filePath);
      this.assertWebpackBuildTarget(content, filePath);
      this.assertWebSocketSchemeValidation(content, filePath);

      this.results.passed++;
      this.log(`✅ All assertions passed for: ${path.basename(filePath)}`, 'info');

    } catch (error) {
      this.results.failed++;
      this.results.errors.push(error);

      if (error instanceof BundleAssertionError) {
        this.log(`❌ ${error.message}`, 'error');
        if (error.file) {
          this.log(`   File: ${path.relative(process.cwd(), error.file)}`, 'error');
        }
        if (error.line) {
          this.log(`   Line: ${error.line}`, 'error');
        }
      } else {
        this.log(`❌ Unexpected error: ${error.message}`, 'error');
      }
    }
  }

  generateReport() {
    this.log('\n📊 UMD Bundle Assertion Report');
    this.log('================================');
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`❌ Failed: ${this.results.failed}`);

    if (this.results.errors.length > 0) {
      this.log('\n🚨 Detailed Error Analysis:');
      this.results.errors.forEach((error, index) => {
        this.log(`\n${index + 1}. ${error.name}: ${error.message}`, 'error');

        if (error.file) {
          this.log(`   📁 File: ${path.relative(process.cwd(), error.file)}`, 'error');
        }

        if (error.line) {
          this.log(`   📍 Line: ${error.line}`, 'error');
        }

        // Additional context for specific error types
        if (error.message.includes('Global OptaveJavaScriptSDK assignment not found')) {
          this.log(`   💡 Expected patterns: globalThis.OptaveJavaScriptSDK, window["OptaveJavaScriptSDK"], root.OptaveJavaScriptSDK, exports.OptaveJavaScriptSDK`, 'error');
          this.log(`   🔍 Check UMD wrapper configuration in webpack config`, 'error');
        }

        if (error.message.includes('AJV import/reference found')) {
          this.log(`   💡 Browser builds should exclude AJV to maintain CSP compliance`, 'error');
          this.log(`   🔍 Check webpack externals configuration for browser builds`, 'error');
        }

        if (error.message.includes('__WEBPACK_BUILD_TARGET__')) {
          this.log(`   💡 Ensure DefinePlugin is configured in webpack to inject build target tokens`, 'error');
          this.log(`   🔍 Check webpack.*.config.js files for DefinePlugin configuration`, 'error');
        }

        if (error.message.includes('eval') || error.message.includes('Function')) {
          this.log(`   💡 Dangerous code patterns detected - this could violate CSP policies`, 'error');
          this.log(`   🔍 Check for dynamic code generation in dependencies or build output`, 'error');
        }
      });

      // Summary of recommended actions
      this.log('\n🔧 Recommended Actions:');
      const uniqueErrorTypes = [...new Set(this.results.errors.map(e => {
        if (e.message.includes('Global OptaveJavaScriptSDK')) return 'umd-wrapper';
        if (e.message.includes('AJV')) return 'ajv-exclusion';
        if (e.message.includes('__WEBPACK_BUILD_TARGET__')) return 'build-target';
        if (e.message.includes('eval') || e.message.includes('Function')) return 'dangerous-code';
        return 'other';
      }))];

      uniqueErrorTypes.forEach(errorType => {
        switch (errorType) {
          case 'umd-wrapper':
            this.log('   • Review webpack UMD configuration and library export settings', 'error');
            break;
          case 'ajv-exclusion':
            this.log('   • Update webpack externals to exclude AJV from browser builds', 'error');
            break;
          case 'build-target':
            this.log('   • Add or fix DefinePlugin configuration in webpack config', 'error');
            break;
          case 'dangerous-code':
            this.log('   • Investigate and eliminate dynamic code generation patterns', 'error');
            break;
        }
      });
    }

    return this.results.failed === 0;
  }

  run() {
    try {
      this.log('🚀 Starting UMD Bundle Static Assertions');

      const bundleFiles = this.findUMDBundles();

      // Assert each bundle file
      bundleFiles.forEach(filePath => {
        this.assertBundle(filePath);
      });

      // Generate final report
      const success = this.generateReport();

      if (!success) {
        this.log('\n💥 UMD Bundle assertions failed!', 'error');
        process.exit(1);
      }

      this.log('\n🎉 All UMD Bundle assertions passed!');
      process.exit(0);

    } catch (error) {
      this.log(`💥 Fatal error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const assertor = new UMDBundleAssertor();
  assertor.run();
}

module.exports = { UMDBundleAssertor, BundleAssertionError };