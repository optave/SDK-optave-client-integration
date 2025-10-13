# UMD Bundle Static Assertions

## Overview

The `assert-umd-bundles.cjs` script provides post-build validation for UMD bundles to ensure they meet critical security and functionality requirements.

## Purpose

This script validates UMD bundles against three key requirements:

1. **Global SDK Presence**: Ensures `OptaveJavaScriptSDK` is properly exposed globally
2. **Security**: Detects dangerous `eval()` or `Function()` constructor calls
3. **CSP Compliance**: Verifies browser builds exclude AJV imports to prevent CSP violations

## Usage

### Manual Execution
```bash
npm run assert:umd-bundles
```

### Integrated in Build Process
The script runs automatically as part of the main build process:
```bash
npm run build  # Includes UMD assertions at the end
```

## Output

### Success
When all assertions pass:
```
✅ All assertions passed for: browser.umd.js
✅ All assertions passed for: server.umd.js
🎉 All UMD Bundle assertions passed!
```

### Failure
When violations are detected:
```
❌ Global OptaveJavaScriptSDK assignment not found in UMD wrapper
💥 UMD Bundle assertions failed!
```

The script exits with code 1 on failure, causing CI builds to fail early.

## Validated Files

The script automatically discovers and validates all `.umd.js` files in the `dist/` directory:
- `browser.umd.js` - Browser UMD build
- `server.umd.js` - Server UMD build
- `server.umd.min.js` - Minified server UMD build
- `server.umd.minimized.js` - Alternative minified server build
- `server.umd.non-minimized.js` - Non-minified server build

## Assertion Details

### Global SDK Presence (Hardened)
Validates that the UMD wrapper properly exposes `OptaveJavaScriptSDK` using strict boundary-aware patterns:
- **Stricter Patterns**: `(globalThis|window|root)[.|["]]OptaveJavaScriptSDK`, `exports[.|["]]OptaveJavaScriptSDK`
- **Assignment Detection**: Detects actual variable assignments using pattern `[identifier][.|["]]OptaveJavaScriptSDK = [identifier]`
- **Comment Stripping**: Comments are stripped before scanning to avoid false positives
- **Match Reporting**: Reports exact patterns matched and counts for transparency

### Dangerous Code Detection
Scans for potentially unsafe patterns while allowing legitimate uses:
- **Blocked**: Direct `eval()` calls, `new Function()` constructors
- **Allowed**: Babel helpers, native function detection, validation method names

### AJV Import Detection (Browser Only) - Enhanced
Browser builds are checked for AJV-related imports using boundary-aware detection:
- **Boundary-Aware**: Uses `\b` word boundaries to avoid false positives like "majv" or "ajve"
- **Comprehensive Patterns**: Detects imports, constructors, method calls, and string literals
- **Enhanced Safe Patterns**: Allows AJV references in comments, fallbacks, exclusions
- **Detailed Violations**: Reports pattern, match, line number, and content for each violation

### Webpack Build Target Detection (New)
Checks for the presence of webpack build target tokens (optional warning):
- **Token Detection**: Looks for `__WEBPACK_BUILD_TARGET__` tokens
- **Build Target Extraction**: Extracts and reports actual build target values when found
- **Warning Mode**: Issues warnings instead of errors when missing (non-blocking)

### File Filtering (Improved)
Smart filtering to focus on actual UMD bundles:
- **Chunk Exclusion**: Automatically excludes webpack chunk files (numeric prefixes like `236.browser.umd.js`)
- **Transparency**: Logs excluded files for debugging purposes
- **Pattern Matching**: Uses regex patterns to identify true UMD bundle files vs chunks

## CI Integration

This script is automatically run during the build process and will fail CI if any assertions fail. This ensures:
- Security vulnerabilities are caught early
- CSP compliance is maintained for browser environments
- UMD global exposure works correctly across all builds

## Error Handling

The script provides detailed error messages with:
- File path where violation occurred
- Line number (when applicable)
- Specific violation type
- Summary report of all failures

## Configuration

The script requires no configuration and automatically adapts to:
- Different UMD bundle naming patterns
- Minified vs non-minified builds
- Browser vs server build types