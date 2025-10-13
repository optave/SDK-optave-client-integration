# Building @optave/client-sdk from Source

This guide explains how to build the Optave Client SDK from source in your own environment. Most users don't need to build from source - the package includes pre-built bundles in the `dist/` folder that work out of the box.

## Quick Start

```bash
# 1. Navigate to the JavaScript SDK directory
cd sdks/javascript

# 2. Install dependencies
npm install

# 3. Build from source
npm run build:all:prod
```

## Requirements

- **Node.js** >= 20.0.0
- **npm** >= 10.8.1
- Dependencies (automatically installed):
  - webpack, webpack-cli
  - tsup
  - cross-env
  - typescript

## What Gets Built

The build process:

1. **Webpack Bundles** - Compiles and optimizes 4 target bundles
   - Browser ESM (modern bundlers like Vite, Webpack 5+)
   - Server ESM (Node.js with ES modules)
   - Browser UMD (CDN usage, legacy browsers, Salesforce Lightning)
   - Server UMD (Node.js with CommonJS)

2. **Source Maps** - Generates external source maps for debugging

3. **TypeScript Declarations** - Creates `.d.ts` files for type checking

### What Does NOT Need to Be Built

The package includes **pre-generated files** that you don't need to regenerate:

```
generated/
├── types.d.ts        - TypeScript interfaces from AsyncAPI spec
├── validators.js     - Runtime validation functions
├── validators.d.ts   - Validator type definitions
└── constants.js      - SDK constants (version, schema refs)
```

These files are stable, version-locked, and derived from the AsyncAPI specification. They're ready to use as-is.

## Build Scripts

### Production Build (Recommended)

```bash
# Ensure you're in the correct directory
cd sdks/javascript

# Install dependencies if not already installed
npm install

# Run production build
npm run build:all:prod
```

Simplified build for production use. Skips development-only validation and analysis.

This generates:

```
dist/
├── browser.mjs          ~47KB  - Browser ESM bundle
├── server.mjs           ~164KB - Server ESM bundle
├── browser.umd.js       ~50KB  - Browser UMD bundle
├── server.umd.js        ~55KB  - Server UMD bundle
├── browser.umd.js.map   - Source map for browser UMD
├── server.umd.js.map    - Source map for server UMD
├── index.js             - ESM entry point
├── index.cjs            - CommonJS entry point
├── index.d.ts           - TypeScript declarations (ESM)
└── index.d.cts          - TypeScript declarations (CJS)
```

### Partial Builds

Build specific targets if you only need certain bundles:

```bash
# Ensure you're in the correct directory and dependencies are installed
cd sdks/javascript
npm install

# Browser builds only
npm run build:browser:esm && npm run build:browser:umd

# Server builds only
npm run build:server:esm && npm run build:server:umd
```

### Individual Targets

```bash
# Browser ESM
webpack --config webpack.browser.config.js

# Server ESM
webpack --config webpack.server.config.js

# Browser UMD
webpack --config webpack.browser.umd.config.js

# Server UMD
webpack --config webpack.server.umd.config.js

# TypeScript type declarations
npm run generate:types
```

## Build Configuration

The SDK includes all necessary configuration files:

- `webpack.browser.config.js` - Browser ESM configuration
- `webpack.server.config.js` - Server ESM configuration
- `webpack.browser.umd.config.js` - Browser UMD configuration
- `webpack.server.umd.config.js` - Server UMD configuration
- `webpack.shared.umd.base.js` - Shared UMD configuration
- `tsconfig.json` - TypeScript compiler options

## Troubleshooting

### Missing Dependencies

If the build fails due to missing dependencies:

```bash
npm install webpack webpack-cli tsup cross-env typescript
```

All build dependencies are listed in the package's `devDependencies` and should install automatically.

### Clean Build

If you encounter build errors, try a clean build:

```bash
# Navigate to the JavaScript SDK directory
cd sdks/javascript

# Remove build artifacts and dependencies
rm -rf dist node_modules package-lock.json

# Reinstall and rebuild
npm install
npm run build:all:prod
```

### Build Takes Too Long

The production build is optimized for speed. If it's taking unusually long:

1. Check your Node.js version: `node --version` (should be >= 20.0.0)
2. Ensure you're using `build:all:prod` not `build:all:dev` (dev build includes validation)
3. Check available system memory (webpack requires ~1-2GB)

### Webpack Configuration Errors

If you're customizing webpack configs and encounter errors:

- The configs reference `scripts/prod/webpack/` plugins
- Don't modify the original configs - extend them instead
- See `webpack.shared.umd.base.js` for the base UMD configuration

## Build Artifacts Verification

After building, verify the output:

```bash
# Check that all 4 bundles exist
ls -lh dist/*.{mjs,js,map}

# Verify bundle sizes (approximate)
# browser.mjs:     ~47KB
# server.mjs:      ~164KB
# browser.umd.js:  ~50KB
# server.umd.js:   ~55KB

# Test a quick import
node -e "const SDK = require('./dist/index.cjs'); console.log('✓ CJS import works');"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Build SDK

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build SDK
        working-directory: node_modules/@optave/client-sdk
        run: npm run build:all:prod

      - name: Verify build
        working-directory: node_modules/@optave/client-sdk
        run: ls -lh dist/
```

### Docker Example

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install SDK
RUN npm install @optave/client-sdk

# Build from source
WORKDIR /app/node_modules/@optave/client-sdk
RUN npm run build:all:prod

# Verify
RUN ls -lh dist/

WORKDIR /app
```

## Performance Tips

1. **Use production build** - `build:all:prod` is optimized for speed
2. **Cache node_modules** - Avoid reinstalling dependencies
3. **Parallel builds** - The build script runs webpack sequentially for reliability
4. **Skip if unnecessary** - Pre-built bundles in `dist/` work for most use cases

## Getting Help

- **Issues**: https://github.com/optave/SDK-optave-client-integration/issues
- **Documentation**: See README.md for SDK usage

## License

Apache-2.0 - See LICENSE file for details
