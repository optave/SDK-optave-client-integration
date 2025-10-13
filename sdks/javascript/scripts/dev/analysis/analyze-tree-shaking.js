#!/usr/bin/env node

/**
 * Tree-shaking Analysis Script
 * Analyzes the effectiveness of tree-shaking in different build variants
 */

import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import {
  BUILD_ARTIFACTS,
  VALIDATION_PATTERNS,
  formatBytes
} from '../../../../scripts/config/build-governance.js';

const DIST_DIR = './dist';

// Build mapping derived from shared governance config
const BUILDS = BUILD_ARTIFACTS.reduce((builds, artifact) => {
  const filename = artifact.file.replace('dist/', '');
  builds[filename] = artifact.name;
  return builds;
}, {});

// Module detection patterns derived from shared governance config
const MODULE_INDICATORS = {
    'AJV validation': VALIDATION_PATTERNS.AJV_EXCLUSION.pattern,
    'UUID generation': /uuid.*v[47]|randomUUID/gi,
    'WebSocket handling': /WebSocket|socket.*connect/gi,
    'Event emitting': /EventEmitter|emit.*event/gi,
    'Crypto polyfills': VALIDATION_PATTERNS.REQUIRED_IN_BROWSER.find(p => p.description.includes('crypto'))?.pattern || /crypto.*polyfill|getRandomValues/gi,
    'Generated validators': /validateMessageEnvelope|validatePayload/gi,
    'Constants module': /SPEC_VERSION|SCHEMA_REF/gi,
    'Error handling': /OptaveError|makeStructuredError/gi,
    'Node.js modules': new RegExp(VALIDATION_PATTERNS.FORBIDDEN_IN_BROWSER.map(p => p.pattern.source).join('|'), 'gi')
};

function analyzeBuildFile(filePath, buildName) {
    try {
        const stats = statSync(filePath);
        const content = readFileSync(filePath, 'utf8');

        const analysis = {
            name: buildName,
            path: filePath,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            modules: {}
        };

        // Check for module indicators
        for (const [module, regex] of Object.entries(MODULE_INDICATORS)) {
            const matches = content.match(regex);
            analysis.modules[module] = {
                present: !!matches,
                count: matches ? matches.length : 0
            };
        }

        return analysis;
    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error.message);
        return null;
    }
}

function generateReport(analyses) {
    console.log('\n🌳 Tree-shaking Analysis Report\n');
    console.log('='.repeat(80));

    // Size comparison
    console.log('\n📊 Build Sizes:');
    analyses.sort((a, b) => a.size - b.size);

    for (const analysis of analyses) {
        console.log(`  ${analysis.name.padEnd(15)} ${analysis.sizeFormatted.padStart(10)}`);
    }

    // Module inclusion analysis
    console.log('\n📦 Module Inclusion Analysis:');
    console.log('\nModule'.padEnd(20) + analyses.map(a => a.name.substring(0, 8).padStart(10)).join(''));
    console.log('─'.repeat(20 + analyses.length * 10));

    const moduleNames = Object.keys(MODULE_INDICATORS);
    for (const module of moduleNames) {
        const row = module.padEnd(20);
        const indicators = analyses.map(analysis =>
            analysis.modules[module]?.present ? '✓'.padStart(10) : '✗'.padStart(10)
        );
        console.log(row + indicators.join(''));
    }

    // Tree-shaking effectiveness
    console.log('\n🎯 Tree-shaking Effectiveness:');
    const esmBuilds = analyses.filter(a => a.name.includes('ESM'));
    const umdBuilds = analyses.filter(a => a.name.includes('UMD'));

    if (esmBuilds.length > 0) {
        console.log('\n  ESM builds (should have better tree-shaking):');
        for (const build of esmBuilds) {
            const unusedModules = Object.entries(build.modules)
                .filter(([, info]) => !info.present).length;
            console.log(`    ${build.name}: ${unusedModules}/${moduleNames.length} modules unused`);
        }
    }

    console.log('\n💡 Recommendations:');

    // Check if browser builds include server-only modules
    const browserBuilds = analyses.filter(a => a.name.includes('Browser'));
    const serverOnlyModules = ['AJV validation', 'WebSocket handling'];

    for (const build of browserBuilds) {
        for (const module of serverOnlyModules) {
            if (build.modules[module]?.present && module === 'AJV validation') {
                console.log(`  ⚠️  ${build.name} includes AJV (should use CSP-safe validators)`);
            }
        }
    }

    // Size comparison insights
    const minSize = Math.min(...analyses.map(a => a.size));
    const maxSize = Math.max(...analyses.map(a => a.size));
    const ratio = (maxSize / minSize).toFixed(2);

    console.log(`  📈 Size variance: ${ratio}x between smallest and largest build`);

    if (ratio > 3) {
        console.log(`  🎯 Consider further tree-shaking optimizations for larger builds`);
    }
}

async function main() {
    console.log('🔍 Analyzing tree-shaking effectiveness...\n');

    const analyses = [];

    for (const [filename, buildName] of Object.entries(BUILDS)) {
        const filePath = resolve(DIST_DIR, filename);
        const analysis = analyzeBuildFile(filePath, buildName);
        if (analysis) {
            analyses.push(analysis);
        }
    }

    if (analyses.length === 0) {
        console.error('❌ No build files found. Run `npm run build` first.');
        process.exit(1);
    }

    generateReport(analyses);

    console.log('\n✅ Tree-shaking analysis complete!\n');
}

main().catch(console.error);