#!/usr/bin/env node

/**
 * Export Surface Diff Tool
 *
 * ⚠️  DEPRECATED: This script is deprecated and will be removed in a future version.
 * Please use the unified export surface tool instead:
 *
 *   npm run export-surface:diff
 *   or
 *   node scripts/analysis/export-surface.js --mode=diff
 *
 * This script now delegates to the unified tool for compatibility.
 */

console.warn('⚠️  DEPRECATED: export-surface-diff.js is deprecated.');
console.warn('Please use: npm run export-surface:diff or node scripts/analysis/export-surface.js --mode=diff');
console.warn('This compatibility wrapper will be removed in a future version.\n');

// Delegate to unified script
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const unifiedScript = join(__dirname, 'export-surface.js');

const child = spawn('node', [unifiedScript, '--mode=diff'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to run unified export surface script:', err);
  process.exit(1);
});

// Keep original implementation as backup (commented out)
/*
import { loadAllBuilds, analyzeExportSurface } from './export-surface-check.js';

// Create a detailed diff between two export surfaces
function createDiff(reference, comparison, refName, compName) {
  const diff = {
    reference: refName,
    comparison: compName,
    staticMethodsDiff: [],
    staticPropertiesDiff: [],
    instanceMethodsDiff: []
  };

  // Compare static methods
  const refStaticMethods = new Set(reference.staticMethods.map(m => m.name));
  const compStaticMethods = new Set(comparison.staticMethods.map(m => m.name));

  // Methods only in reference
  [...refStaticMethods].filter(name => !compStaticMethods.has(name))
    .forEach(name => diff.staticMethodsDiff.push(`- ${name} (missing in ${compName})`));

  // Methods only in comparison
  [...compStaticMethods].filter(name => !refStaticMethods.has(name))
    .forEach(name => diff.staticMethodsDiff.push(`+ ${name} (extra in ${compName})`));

  // Compare static properties
  const refStaticProps = new Set(reference.staticProperties.map(p => p.name));
  const compStaticProps = new Set(comparison.staticProperties.map(p => p.name));

  [...refStaticProps].filter(name => !compStaticProps.has(name))
    .forEach(name => diff.staticPropertiesDiff.push(`- ${name} (missing in ${compName})`));

  [...compStaticProps].filter(name => !refStaticProps.has(name))
    .forEach(name => diff.staticPropertiesDiff.push(`+ ${name} (extra in ${compName})`));

  // Compare instance methods
  const refInstanceMethods = new Set(reference.instanceMethods.map(m => m.name));
  const compInstanceMethods = new Set(comparison.instanceMethods.map(m => m.name));

  [...refInstanceMethods].filter(name => !compInstanceMethods.has(name))
    .forEach(name => diff.instanceMethodsDiff.push(`- ${name} (missing in ${compName})`));

  [...compInstanceMethods].filter(name => !refInstanceMethods.has(name))
    .forEach(name => diff.instanceMethodsDiff.push(`+ ${name} (extra in ${compName})`));

  return diff;
}

// Print diff in a readable format
function printDiff(diff) {
  console.log(`\n📊 Diff: ${diff.reference} vs ${diff.comparison}`);
  console.log('─'.repeat(50));

  if (diff.staticMethodsDiff.length > 0) {
    console.log('\n🔧 Static Methods:');
    diff.staticMethodsDiff.forEach(line => console.log(`   ${line}`));
  }

  if (diff.staticPropertiesDiff.length > 0) {
    console.log('\n📋 Static Properties:');
    diff.staticPropertiesDiff.forEach(line => console.log(`   ${line}`));
  }

  if (diff.instanceMethodsDiff.length > 0) {
    console.log('\n⚙️ Instance Methods:');
    diff.instanceMethodsDiff.forEach(line => console.log(`   ${line}`));
  }

  const totalDiffs = diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length;
  if (totalDiffs === 0) {
    console.log('\n✅ No differences found');
  }

  return totalDiffs;
}

async function main() {
  console.log('🔍 Export Surface Diff Analysis');
  console.log('===============================\n');

  try {
    // Load all builds
    const builds = await loadAllBuilds();
    const analyses = {};

    // Analyze each build
    Object.entries(builds).forEach(([buildName, BuildClass]) => {
      if (BuildClass) {
        analyses[buildName] = analyzeExportSurface(BuildClass, buildName);
      }
    });

    const validAnalyses = Object.entries(analyses).filter(([_, analysis]) => !analysis.error);

    if (validAnalyses.length < 2) {
      console.log('❌ Need at least 2 valid builds for diff analysis');
      process.exit(1);
    }

    let totalDifferences = 0;

    // Create diffs between all pairs
    for (let i = 0; i < validAnalyses.length; i++) {
      for (let j = i + 1; j < validAnalyses.length; j++) {
        const [refName, refAnalysis] = validAnalyses[i];
        const [compName, compAnalysis] = validAnalyses[j];

        const diff = createDiff(refAnalysis, compAnalysis, refName, compName);
        totalDifferences += printDiff(diff);
      }
    }

    console.log('\n' + '='.repeat(50));
    if (totalDifferences === 0) {
      console.log('🎉 All builds have consistent export surfaces!');
      process.exit(0);
    } else {
      console.log(`❌ Found ${totalDifferences} total differences across all builds`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
*/