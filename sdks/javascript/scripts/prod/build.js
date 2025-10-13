#!/usr/bin/env node

/**
 * Production build script for @optave/client-sdk
 *
 * This simplified build script is designed for customers who need to rebuild
 * the SDK in their own production environments. It skips development-only
 * validation, analysis, and compliance checks.
 *
 * What this script does:
 * 1. Builds all 4 webpack bundles (browser/server, ESM/UMD)
 * 2. Generates source maps for UMD bundles
 * 3. Builds TypeScript declarations
 *
 * What this script does NOT do:
 * - AsyncAPI spec regeneration (uses pre-generated files from generated/)
 * - Bundle validation and assertions
 * - Bundle analysis and reporting
 * - Size budget checking
 * - Governance manifest generation
 *
 * Requirements:
 * - Node.js >= 20.0.0
 * - npm >= 10.8.1
 * - webpack, webpack-cli, tsup (listed in devDependencies)
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Check if we're in the right directory
if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error('❌ Error: package.json not found. Please run this script from the SDK root directory.');
  process.exit(1);
}

console.log('🏗️  Building @optave/client-sdk for production...\n');
console.log('📁 Root directory:', rootDir);
console.log('📦 This build uses pre-generated files from the generated/ folder.\n');

const startTime = Date.now();

try {
  // Step 1: Build all webpack bundles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Step 1/3: Building webpack bundles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('  → Building browser ESM bundle...');
  execSync('webpack --config webpack.browser.config.js', {
    stdio: 'inherit',
    cwd: rootDir
  });

  console.log('\n  → Building server ESM bundle...');
  execSync('webpack --config webpack.server.config.js', {
    stdio: 'inherit',
    cwd: rootDir
  });

  console.log('\n  → Building browser UMD bundle...');
  execSync('webpack --config webpack.browser.umd.config.js', {
    stdio: 'inherit',
    cwd: rootDir
  });

  console.log('\n  → Building server UMD bundle...');
  execSync('webpack --config webpack.server.umd.config.js', {
    stdio: 'inherit',
    cwd: rootDir
  });

  // Step 2: Generate source maps
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗺️  Step 2/3: Generating source maps');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  execSync('node scripts/prod/generate-source-maps.js', {
    stdio: 'inherit',
    cwd: rootDir
  });

  // Step 3: Build TypeScript declarations
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📘 Step 3/3: Building TypeScript declarations');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  execSync('tsup runtime/core/index.ts --dts --format esm,cjs --out-dir dist', {
    stdio: 'inherit',
    cwd: rootDir
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Production build complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n⏱️  Build time: ${duration}s`);
  console.log('📁 Output directory: dist/');
  console.log('\nBuild artifacts:');
  console.log('  • browser.mjs      - Browser ESM bundle');
  console.log('  • server.mjs       - Server ESM bundle');
  console.log('  • browser.umd.js   - Browser UMD bundle');
  console.log('  • server.umd.js    - Server UMD bundle');
  console.log('  • *.d.ts           - TypeScript declarations');
  console.log('  • *.map            - Source maps\n');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('  1. Ensure all dependencies are installed: npm install');
  console.error('  2. Check Node.js version: node --version (requires >= 20.0.0)');
  console.error('  3. Try cleaning and rebuilding: rm -rf dist node_modules && npm install && npm run build:all:prod\n');
  process.exit(1);
}
