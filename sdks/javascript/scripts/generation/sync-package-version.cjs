#!/usr/bin/env node
/**
 * Sync package.json version with AsyncAPI spec version.
 */
const fs = require('fs');
const path = require('path');
let yaml;
try {
    yaml = require('yaml');
} catch {
    console.error('Install yaml: npm i -D yaml');
    process.exit(1);
}

const specPath = path.join(__dirname, '..', '..', '..', '..', 'config', 'specs', 'asyncapi.yaml');
const packagePath = path.join(__dirname, '..', '..', 'package.json');

// Read and parse the AsyncAPI spec
const rawSpec = fs.readFileSync(specPath, 'utf8');
const spec = yaml.parse(rawSpec);

// Read package.json
const rawPackage = fs.readFileSync(packagePath, 'utf8');
const packageJson = JSON.parse(rawPackage);

// Extract version from spec
const specVersion = spec.info?.version || '3.0.0';
const currentVersion = packageJson.version;

if (currentVersion === specVersion) {
    console.log(`Package version (${currentVersion}) already matches AsyncAPI spec version (${specVersion})`);
    process.exit(0);
}

// Update package.json version
packageJson.version = specVersion;

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, '\t') + '\n');
console.log(`Updated package.json version from ${currentVersion} to ${specVersion}`);