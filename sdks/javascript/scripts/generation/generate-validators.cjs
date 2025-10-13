#!/usr/bin/env node
/**
 * Generates precompiled standalone validators from AsyncAPI component schemas.
 * Strategy: Use AJV's standalone compilation to generate validation functions without runtime AJV dependency.
 * Output: generated/validators.js (ESM) + generated/validators.d.ts
 */
const fs = require('fs');
const path = require('path');
let yaml; try { yaml = require('yaml'); } catch { console.error('Install yaml: npm i -D yaml'); process.exit(1); }

// Import AJV and standalone compilation
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const generateStandaloneCode = require('ajv/dist/standalone').default;

const specPath = path.join(__dirname, '..', '..', '..', '..', 'config', 'specs', 'asyncapi.yaml');
const outDir = path.join(__dirname, '..', '..', 'generated');
const outFileJs = path.join(outDir, 'validators.js');
const outFileDts = path.join(outDir, 'validators.d.ts');

const raw = fs.readFileSync(specPath, 'utf8');
const doc = yaml.parse(raw);
const schemas = (doc.components && doc.components.schemas) || {};
const TARGETS = ['MessageEnvelope','ResponseEnvelope','Payload','SuperpowerResponse','ErrorResponse'];

function sanitize(schema){
  if (!schema || typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map(sanitize);
  const out = {};
  for (const [k,v] of Object.entries(schema)) {
    if (k.startsWith('x-') || k === 'examples') continue;
    out[k] = typeof v === 'object' ? sanitize(v) : v;
  }
  return out;
}

// Sanitize all component schemas first
const allSanitized = {};
for (const [name, schema] of Object.entries(schemas)) allSanitized[name] = sanitize(schema);

// Rewrite internal component refs (#/components/schemas/Name -> Name)
function rewriteRefs(obj){
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(rewriteRefs);
  const out = {};
  for (const [k,v] of Object.entries(obj)) {
    if (k === '$ref' && typeof v === 'string' && v.startsWith('#/components/schemas/')) out[k] = v.split('/').pop(); else out[k] = rewriteRefs(v);
  }
  return out;
}

// IMPORTANT: Rewrite refs in ALL component schemas before registering with Ajv.
// Previous version only rewrote refs inside TARGET schemas; Ajv compiles component schemas when added,
// so unresolved JSON Pointer refs (e.g. #/components/schemas/Payload) caused failures.
for (const name of Object.keys(allSanitized)) {
  allSanitized[name] = rewriteRefs(allSanitized[name]);
}

// Targets are now just references to the already rewritten component schemas
const targetsSanitized = {};
for (const t of TARGETS) if (allSanitized[t]) targetsSanitized[t] = allSanitized[t];

// Create AJV instance with standalone compilation enabled
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  code: { source: true, esm: true }, // Enable standalone ESM code generation
  verbose: true // Helps with error context
});

// Add formats support
addFormats(ajv);

// Add UUIDv7 format validator to eliminate console warnings
ajv.addFormat("uuidv7", /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

// Add standard JSON Schema definitions that might be referenced
ajv.addSchema({
  "type": "integer",
  "minimum": 0
}, "nonNegativeInteger");

// Register all component schemas with AJV
for (const [name, schema] of Object.entries(allSanitized)) {
  try {
    ajv.addSchema(schema, name);
  } catch(e) {
    console.warn(`Warning: Could not add schema ${name}:`, e.message);
  }
}

// Compile validators for target schemas and generate standalone code
const compiledValidators = {};

for (const name of Object.keys(targetsSanitized)) {
  try {
    const validator = ajv.getSchema(name) || ajv.compile(targetsSanitized[name]);
    if (validator) {
      compiledValidators[name] = validator;
    }
  } catch (e) {
    console.error(`Error compiling validator for ${name}:`, e.message);
  }
}

// Generate individual standalone validators
const individualValidators = {};
const validatorFunctions = Object.keys(compiledValidators);

for (const name of validatorFunctions) {
  try {
    const validator = compiledValidators[name];
    const code = generateStandaloneCode(ajv, validator);

    // Identify the MAIN validator function from AJV's default export
    // AJV generates multiple functions (main + helpers for nested schemas)
    // Only the default export is the correct entry point for validation
    const exportMatch = code.match(/export\s+default\s+(\w+)/);
    const mainValidatorName = exportMatch ? exportMatch[1] : null;

    if (!mainValidatorName) {
      console.warn(`Could not find AJV default export for ${name}`);
      continue;
    }

    // Process the generated code to be ESM compatible
    let processedCode = code;

    // Remove "use strict" as ESM modules are strict by default
    processedCode = processedCode.replace(/["']use strict["'];?\s*/g, '');

    // Remove all export statements (we'll create our own exports)
    processedCode = processedCode.replace(/export\s+(const\s+)?[^;]+;?/g, '');
    processedCode = processedCode.replace(/export\s+default\s+[^;]+;?/g, '');

    // CRITICAL: Prefix ALL identifiers to avoid collisions when concatenating validators
    // AJV generates main + helper functions, schemas, and formats that can collide across validators

    // Prefix schemas to avoid collisions when concatenating multiple validators
    processedCode = processedCode.replace(/const\s+(schema\d+)/g, `const ${name}_$1`);
    processedCode = processedCode.replace(/\b(schema\d+)(?!\s*=)/g, `${name}_$1`);

    // Prefix formats (these are unique per schema)
    processedCode = processedCode.replace(/const\s+(formats\d+)/g, `const ${name}_$1`);
    processedCode = processedCode.replace(/\b(formats\d+)(?!\s*=)/g, `${name}_$1`);

    // BUGFIX: AJV generates formatVar as a function, but references it as formatVar.validate
    // The format variable is defined as an IIFE that returns a validate function
    // So formatVar IS the function, not formatVar.validate
    // We need to replace formatVar.validate(x) with formatVar(x)
    const formatRefs = processedCode.match(/(\w+_formats\d+)\.validate/g);
    if (formatRefs) {
      const uniqueFormatRefs = [...new Set(formatRefs.map(ref => ref.replace('.validate', '')))];
      uniqueFormatRefs.forEach(formatVar => {
        const escapedFormatVar = formatVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Replace formatVar.validate with just formatVar (the function itself)
        const formatValidateRegex = new RegExp(`${escapedFormatVar}\\.validate`, 'g');
        processedCode = processedCode.replace(formatValidateRegex, formatVar);
      });
    }

    // Prefix ALL validator functions (main + helpers) to avoid collisions
    // Different schemas can have helper functions with the same name (e.g., validate15)
    processedCode = processedCode.replace(/function\s+(validate\d+)/g, `function ${name}_$1`);
    processedCode = processedCode.replace(/\b(validate\d+)(?=[\(.])/g, `${name}_$1`);

    // Create our wrapper function using the MAIN validator identified by AJV's default export
    const renamedValidatorName = `${name}_${mainValidatorName}`;
    // Add assignment to create our implementation function
    processedCode += `\nconst validate${name}Impl = ${renamedValidatorName};`;

    // Handle require statements for ajv-formats
    processedCode = processedCode.replace(/require\(["']ajv-formats\/dist\/formats["']\)\.fullFormats\[["']([^"']+)["']\]/g, (match, formatName) => {
      if (formatName === 'date-time') {
        return `(function() { return function validate(str) { return /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?(?:Z|[+-]\\d{2}:\\d{2})$/.test(str); }; })()`;
      }
      return match;
    });

    individualValidators[name] = processedCode;

  } catch (error) {
    console.error(`Error generating standalone code for ${name}:`, error.message);
    individualValidators[name] = `
const validate${name}Impl = () => ({ valid: false, errors: [{ message: 'Validator could not be generated' }] });
`;
  }
}

// Combine all individual validators
const generatedStandaloneCode = `
// Precompiled AJV validators - no runtime AJV dependency required
const uuidv7Format = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

${Object.values(individualValidators).join('\n\n')}

${validatorFunctions.map(name => `
export const validate${name} = (data) => {
  const result = validate${name}Impl(data);
  return { valid: result, errors: validate${name}Impl.errors || null };
};`).join('\n')}
`;

const js = `// AUTO-GENERATED FILE. DO NOT EDIT.
// Precompiled validators built from specs/asyncapi.yaml (info.version: ${(doc.info && doc.info.version) || 'unknown'})
// Generated using AJV standalone compilation - no runtime AJV dependency required

${generatedStandaloneCode}

// Main validation function
export function validate(name, data) {
  switch (name) {
${validatorFunctions.map(name =>
    `    case '${name}': return validate${name}(data);`).join('\n')}
    default:
      return { valid: false, errors: [{ message: 'Unknown schema ' + name }] };
  }
}

export const availableValidators = [${validatorFunctions.map(name => `'${name}'`).join(', ')}];
`;

const dts = `// AUTO-GENERATED FILE. DO NOT EDIT.\nimport type { ErrorObject } from 'ajv';\nexport interface ValidationResult { valid: boolean; errors: null | ErrorObject[]; }\nexport function validate(name: string, data: unknown): ValidationResult;\n${TARGETS.filter(t=>targetsSanitized[t]).map(t=>`export function validate${t}(data: unknown): ValidationResult;`).join('\\n')}\nexport const availableValidators: string[];\n`;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFileJs, js);
fs.writeFileSync(outFileDts, dts);
console.log(`Generated validators for: ${Object.keys(targetsSanitized).join(', ')}`);
