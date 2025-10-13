#!/usr/bin/env node
/**
 * Generate constants from AsyncAPI spec version.
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
const outFile = path.join(__dirname, '..', '..', 'generated', 'constants.js');

// Read and parse the AsyncAPI spec
const raw = fs.readFileSync(specPath, 'utf8');
const doc = yaml.parse(raw);

// Extract version from spec
const specVersion = doc.info?.version || '3.0.0';
const specMajor = specVersion.split('.')[0];

// Generate the constants file
const content = `// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: config/specs/asyncapi.yaml (info.version: ${specVersion})

// SDK Constants derived from AsyncAPI spec
export const SPEC_VERSION = "${specVersion}";

// Schema ref is derived from spec major
const SPEC_MAJOR = SPEC_VERSION.split('.')[0];
export const SCHEMA_REF = \`optave.message.v\${SPEC_MAJOR}\`;
`;

// Write the generated file
fs.writeFileSync(outFile, content);
console.log(`Generated ${path.relative(process.cwd(), outFile)} with SPEC_VERSION: ${specVersion}`);