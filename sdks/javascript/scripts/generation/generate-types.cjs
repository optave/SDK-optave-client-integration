#!/usr/bin/env node
/**
 * AsyncAPI schema -> TypeScript declarations (clean generator).
 */
const fs = require('fs');
const path = require('path');
let yaml; try { yaml = require('yaml'); } catch { console.error('Install yaml: npm i -D yaml'); process.exit(1); }

const specPath = path.join(__dirname, '..', '..', '..', '..', 'config', 'specs', 'asyncapi.yaml');
const outDir = path.join(__dirname, '..', '..', 'generated');
const outFile = path.join(outDir, 'types.d.ts');

const raw = fs.readFileSync(specPath, 'utf8');
const doc = yaml.parse(raw);
const schemas = (doc.components && doc.components.schemas) || {};

const TARGETS = ['Payload','MessageEnvelope','ResponseEnvelope','SuperpowerResponse','ErrorResponse'];

function toTs(schema, hint){
  if(!schema) return 'any';
  if(schema.enum) return schema.enum.map(v=> typeof v==='string'?`'${v.replace(/'/g,"\\'")}'`:JSON.stringify(v)).join(' | ') || 'string';
  if(schema.$ref) return schema.$ref.split('/').pop() || 'any';
  if(schema.oneOf) return schema.oneOf.map(s=>toTs(s,hint)).join(' | ');
  if(schema.anyOf) return schema.anyOf.map(s=>toTs(s,hint)).join(' | ');
  if(schema.allOf) return '('+schema.allOf.map(s=>toTs(s,hint)).join(' & ')+')';
  switch(schema.type){
    case 'string': return 'string';
    case 'number':
    case 'integer': return 'number';
    case 'boolean': return 'boolean';
    case 'array': return `${toTs(schema.items||{type:'any'},hint+'Item')}[]`;
    case 'object': {
      const req = new Set(schema.required||[]);
      const props = Object.entries(schema.properties||{}).map(([k,v])=>`  ${k}${req.has(k)?'':'?'}: ${toTs(v,k)};`).join('\n');
      let addl='';
      if(schema.additionalProperties){
        const apType = schema.additionalProperties===true?'any':toTs(schema.additionalProperties,hint+'Additional');
        addl = (props? '\n':'')+`  [k: string]: ${apType};`;
      }
      return `{\n${props}${addl}\n}`;
    }
    default: return 'any';
  }
}

function emitInterface(name, schema){
  if(!schema || schema.type!=='object') return `// Skipped ${name}`;
  const req = new Set(schema.required||[]);
  const lines = Object.entries(schema.properties||{}).map(([k,v])=>`  ${k}${req.has(k)?'':'?'}: ${toTs(v,k)};`).join('\n');
  let addl='';
  if(schema.additionalProperties){
    const apType = schema.additionalProperties===true?'any':toTs(schema.additionalProperties,name+'Additional');
    addl = (lines? '\n':'')+`  [k: string]: ${apType};`;
  }
  return `export interface ${name} {\n${lines}${addl}\n}`;
}

let actionUnion='string';
try { const e = schemas.MessageEnvelope.properties.headers.properties.action.enum; if(Array.isArray(e)&&e.length) actionUnion = e.map(v=>`'${v}'`).join(' | ');} catch {}

const out=[];
out.push('// AUTO-GENERATED FILE. DO NOT EDIT.');
out.push(`// Source: specs/asyncapi.yaml (info.version: ${doc.info&&doc.info.version})`);
out.push('');
out.push(`export type OptaveAction = ${actionUnion};`);
out.push('');

for(const n of TARGETS){ if(!schemas[n]) continue; out.push(emitInterface(n, schemas[n])); out.push(''); }

const sdkErr = doc['x-sdkErrorSchema'];
if(sdkErr){
  let cat='string';
  try { if(sdkErr.properties.category.enum) cat = sdkErr.properties.category.enum.map(v=>`'${v}'`).join(' | ');} catch{}
  out.push('export interface SdkErrorEvent {');
  out.push(`  category: ${cat};`);
  out.push('  code: string;');
  out.push('  message: string;');
  out.push('  details?: any;');
  out.push('  suggestions: string[];');
  out.push('  timestamp: string; // ISO 8601');
  out.push('  correlationId?: string;');
  out.push('}');
  out.push('');
}

// Derive per-action attribute interfaces (Step 1)
try {
  const attrSchema = schemas.Payload?.properties?.request?.properties?.attributes;
  if (attrSchema && attrSchema.type === 'object') {
    out.push('// Base request attributes extracted from Payload.request.attributes');
    out.push('export interface RequestAttributes ' + toTs(attrSchema, 'RequestAttributes') + '');
    out.push('');
    if (actionUnion !== 'string') {
      const actionsList = actionUnion.split('|').map(s=>s.trim().replace(/'/g,'')).filter(Boolean);
      for (const act of actionsList) {
        const ifaceName = act.charAt(0).toUpperCase() + act.slice(1) + 'Attributes';
        out.push(`// Currently identical to RequestAttributes; customize if ${act} needs specialized fields later`);
        out.push(`export type ${ifaceName} = RequestAttributes;`);
        out.push('');
      }
      if (actionsList.length) {
        out.push('export interface ActionAttributesMap {');
        for (const act of actionsList) {
          const ifaceName = act.charAt(0).toUpperCase() + act.slice(1) + 'Attributes';
          out.push(`  '${act}': ${ifaceName};`);
        }
        out.push('}');
        out.push('');
        out.push('export type AttributesFor<A extends OptaveAction> = A extends keyof ActionAttributesMap ? ActionAttributesMap[A] : RequestAttributes;');
        out.push('');
      }
    }
  }
} catch (e) {
  out.push('// Attribute interface generation skipped due to error: ' + (e && e.message ? e.message : 'unknown'));
  out.push('');
}

if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(outFile, out.join('\n'));
console.log(`Generated ${path.relative(process.cwd(), outFile)} (${TARGETS.filter(t=>schemas[t]).length} interfaces).`);
