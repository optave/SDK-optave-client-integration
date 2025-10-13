# Scripts Directory

This directory contains all build, development, and maintenance scripts for the JavaScript SDK. Scripts are organized by functionality for better maintainability.

## Directory Structure

### 📁 `analysis/`
Scripts for code analysis and surface inspection:
- `analyze-tree-shaking.js` - Tree shaking analysis
- `validate-tree-shaking.js` - Tree shaking validation
- `export-surface.js` - Export surface consistency checking (unified)
- `export-surface-diff.js` - Export surface differences
- `verify-analyzer-minimize.js` - Bundle analyzer verification

### 📁 `build/`
Build-related scripts:
- `bundle-size-reporter.js` - Bundle size reporting and analysis

### 📁 `generation/`
Code and asset generation scripts:
- `generate-constants.cjs` - Generate constants from specs
- `generate-examples.js` - Generate example code
- `generate-governance-manifest.js` - Generate governance manifest
- `generate-types.cjs` - Generate TypeScript types
- `generate-validators.cjs` - Generate AJV validators
- `sync-package-version.cjs` - Sync package version with specs

### 📁 `testing/`
Testing and validation harnesses:
- `csp-harness-runner.js` - CSP compliance testing
- `test-token-detection.cjs` - Token detection testing
- `test-umd-failure-harness.cjs` - UMD failure testing

### 📁 `validation/`
Build and code validation scripts:
- `assert-umd-bundles.cjs` - UMD bundle assertions (main)
- `assert-umd-bundles-modular.cjs` - Modular UMD bundle assertions
- `governance-check.js` - Governance compliance checking
- `schema-drift-guard.js` - Schema drift detection
- `bundle-assertions/` - Bundle assertion framework

### 📁 `shared/`
Shared utilities used across scripts:
- `report-utilities.js` - Reporting utilities
- `script-utilities.js` - Common script utilities

### 📁 `docs/`
Documentation for scripts:
- `README-ASSERT-UMD-BUNDLES.md` - UMD bundle assertion docs
- `README-EXPORT-SURFACE-CHECK.md` - Export surface check docs
- `README-TOKEN-DETECTION-ENHANCEMENTS.md` - Token detection docs

## Script Usage

All scripts are referenced through npm scripts in `package.json`. Use the npm commands rather than running scripts directly:

```bash
# Analysis
npm run analyze:tree-shaking
npm run validate:tree-shaking
npm run export-surface:quick

# Build
npm run size:report
npm run size:baseline

# Generation
npm run spec:generate
npm run spec:examples

# Testing
npm run test:csp-harness

# Validation
npm run assert:umd-bundles
npm run governance:check
```

## Changes Made

### Removed Deprecated Scripts
The following deprecated wrapper scripts were removed as they delegated to the unified `export-surface.js`:
- ❌ `export-surface-check.js`
- ❌ `export-surface-check-simple.js`
- ❌ `export-surface-check-v2.js`

### Organized by Functionality
Scripts were moved from the root directory to organized subdirectories based on their primary function, making the codebase easier to navigate and maintain.