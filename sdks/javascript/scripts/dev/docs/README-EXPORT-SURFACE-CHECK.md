# Export Surface Consistency Check

This directory contains scripts to verify that all build formats (server ESM, browser ESM, UMD) expose consistent API surfaces to end users.

## Overview

The Optave Client SDK is built in multiple formats to support different deployment scenarios:

- **Server ESM** (`dist/server.mjs`): ES modules for Node.js environments
- **Browser ESM** (`dist/browser.mjs`): ES modules for modern browsers
- **Server UMD** (`dist/server.umd.js`): UMD format for Node.js with legacy module systems
- **Browser UMD** (`dist/browser.umd.js`): UMD format for browsers with global variable access

## The Problem

Each build format has different:
- Bundling strategies (some external dependencies, some bundled)
- Environment-specific polyfills and implementations
- Webpack configurations with different externals
- Module loading mechanisms

This can lead to inconsistencies where different builds expose different APIs, missing methods, or different static properties.

## The Solution

The export surface consistency checker imports each build format and analyzes:

1. **Static Properties**: Class-level properties like `CONSTANTS`, `LegacyEvents`
2. **Static Methods**: Class-level methods like `getSdkVersion()`, `getSpecVersion()`
3. **Instance Methods**: Prototype methods available on SDK instances
4. **Enumerable vs Non-enumerable**: Whether properties are discoverable via `Object.keys()`

## Usage

### Quick Check

```bash
npm run check:export-surface
```

### Manual Execution

```bash
# Run the full analysis
node scripts/analysis/export-surface.js

# Simple verification (ESM only)
node scripts/analysis/export-surface.js --mode=quick
```

## Output Format

The script provides detailed output:

```
🔍 Export Surface Consistency Check v2
====================================

📦 Loading ESM builds...
✅ Server ESM loaded
✅ Browser ESM loaded

📦 Testing UMD builds...
✅ Browser UMD has UMD wrapper pattern
✅ Browser UMD contains OptaveJavaScriptSDK reference

🔍 Analyzing export surfaces...

📦 SERVERESM:
   Static methods: getSchemaRef, getSdkVersion, getSpecVersion
   Static properties: buildFlags(object), CONSTANTS(object), defaultPayload(object)...
   Instance methods: 52 total
   Sample methods: authenticate, openConnection, closeConnection, validate...

🔗 Consistency Check Results:
   Builds analyzed: 2
   Overall consistency: ✅ CONSISTENT
```

## What It Catches

### Missing Methods
```
❌ browserESM missing static methods: getSdkVersion
❌ serverUMD missing instance methods: validateEnvelope
```

### Extra Methods
```
❌ browserESM extra static methods: getBrowserInfo
❌ serverUMD extra instance methods: getNodeVersion
```

### Type Mismatches
```
❌ CONSTANTS property type mismatch: object vs undefined
```

## CI Integration

The script exits with code 0 for consistent builds, code 1 for inconsistencies, making it suitable for CI:

```yaml
- name: Check export surface consistency
  run: npm run check:export-surface
```

## Implementation Details

### ESM Loading
- Uses dynamic `import()` for ES modules
- Direct analysis of exported default constructor

### UMD Loading
- Server UMD: Uses `require()` with cache clearing
- Browser UMD: Syntax analysis (VM execution can be complex due to browser APIs)
- Handles multiple export patterns (`module.exports`, `exports.default`, globals)

### Analysis Method
- `Object.getOwnPropertyNames()` for complete property discovery
- `Object.getOwnPropertyDescriptor()` for enumerability information
- Recursive prototype chain analysis for instance methods
- Type-aware comparison for properties vs methods

## Troubleshooting

### UMD Loading Issues
If UMD builds fail to load:
1. Check webpack configuration externals
2. Verify UMD wrapper pattern in generated files
3. Ensure all required dependencies are properly handled

### False Positives
The script focuses on major API differences. Minor differences in:
- Internal/private methods (prefixed with `_`)
- Build-specific utilities
- Environment detection methods

Are expected and don't indicate real inconsistencies.

## Files

- `analysis/export-surface.js` - Main analysis script with multiple modes
- `analysis/export-surface-diff.js` - Differential analysis utility

## Future Enhancements

- JSON output format for automated processing
- Baseline comparison against previous versions
- Integration with bundle size analysis
- Cross-environment testing (Node.js versions, browser engines)