#!/usr/bin/env node

/**
 * Bundle Size Delta Reporter
 *
 * Generates comprehensive bundle size reports comparing current build sizes
 * with baseline sizes, suitable for PR comments, CI/CD integration, and
 * GitHub Code Scanning via SARIF output.
 *
 * Usage:
 *   node scripts/bundle-size-reporter.js --baseline=baseline-sizes.json
 *   node scripts/bundle-size-reporter.js --generate-baseline
 *   node scripts/bundle-size-reporter.js --format=github-comment
 *   node scripts/bundle-size-reporter.js --format=sarif
 *   node scripts/bundle-size-reporter.js --format=sarif --output=analysis.sarif
 */

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import {
  BUILD_ARTIFACTS,
  SIZE_THRESHOLDS,
  CHANGE_THRESHOLDS,
  ENV_CONFIG,
  evaluateSize,
  getStatusIcon,
  formatBytes,
  calculatePercentageChange,
  logGovernanceModeStatus
} from '../../../../scripts/config/build-governance.js';
import {
  generateSARIF,
  generateBundleSizeSARIFResults,
  saveSARIFToFile,
  validateSARIF
} from '../../../scripts/config/sarif-utils.js';
import { safeExit } from '../../../scripts/utils/safe-exit.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build artifacts and thresholds imported from shared governance config

/**
 * Get file size information
 */
function getFileSize(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    const stats = fs.statSync(resolvedPath);
    const content = fs.readFileSync(resolvedPath);
    const gzipSize = gzipSync(content).length;

    return {
      raw: stats.size,
      gzipped: gzipSize,
      exists: true,
      path: resolvedPath
    };
  } catch (error) {
    return {
      raw: 0,
      gzipped: 0,
      exists: false,
      error: error.message,
      path: path.resolve(filePath)
    };
  }
}

// formatBytes, calculatePercentageChange, getStatusIcon, and evaluateSize imported from shared governance config

/**
 * Generate current size report
 */
function generateCurrentSizes() {
  const results = {};

  BUILD_ARTIFACTS.forEach(artifact => {
    const filePath = path.resolve(artifact.file);
    const sizes = getFileSize(filePath);

    results[artifact.name] = {
      ...sizes,
      critical: artifact.critical,
      file: artifact.file
    };
  });

  return results;
}

/**
 * Load baseline sizes from file
 */
function loadBaseline(baselineFile) {
  try {
    const content = fs.readFileSync(baselineFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Warning: Could not load baseline file ${baselineFile}:`, error.message);
    return null;
  }
}

/**
 * Generate markdown report for GitHub comments
 */
function generateMarkdownReport(currentSizes, baselineSizes = null) {
  let report = '## 📦 Bundle Size Report\n\n';

  // Summary table
  report += '| Bundle | Size | Gzipped | Status |\n';
  report += '|--------|------|---------|--------|\n';

  BUILD_ARTIFACTS.forEach(artifact => {
    const current = currentSizes[artifact.name];
    const baseline = baselineSizes?.[artifact.name];

    if (!current || !current.exists) {
      report += `| ${artifact.name} | ❌ Not found | - | 🚨 |\n`;
      return;
    }

    const evaluation = evaluateSize(artifact.name, current.raw, baseline?.raw || 0);
    const hasBaseline = baseline?.raw > 0;
    const status = getStatusIcon(evaluation.status, hasBaseline, current.raw - (baseline?.raw || 0));
    const rawSize = formatBytes(current.raw);
    const gzippedSize = formatBytes(current.gzipped);

    report += `| ${artifact.name} | ${rawSize} | ${gzippedSize} | ${status} |\n`;
  });

  // Detailed changes if baseline exists
  if (baselineSizes) {
    report += '\n### 📊 Size Changes\n\n';

    let hasChanges = false;
    BUILD_ARTIFACTS.forEach(artifact => {
      const current = currentSizes[artifact.name];
      const baseline = baselineSizes[artifact.name];

      if (!current?.exists || !baseline?.exists) return;

      const rawChange = current.raw - baseline.raw;
      const gzipChange = current.gzipped - baseline.gzipped;

      if (Math.abs(rawChange) >= CHANGE_THRESHOLDS.MIN_CHANGE_BYTES) { // Only show significant changes
        hasChanges = true;
        const rawPercent = calculatePercentageChange(current.raw, baseline.raw);
        const gzipPercent = calculatePercentageChange(current.gzipped, baseline.gzipped);
        const evaluation = evaluateSize(artifact.name, current.raw, baseline.raw);
        const status = getStatusIcon(evaluation.status, true, rawChange);

        report += `**${artifact.name}** ${status}\n`;
        report += `- Raw: ${formatBytes(Math.abs(rawChange))} (${rawPercent > 0 ? '+' : ''}${rawPercent}%)\n`;
        report += `- Gzipped: ${formatBytes(Math.abs(gzipChange))} (${gzipPercent > 0 ? '+' : ''}${gzipPercent}%)\n\n`;
      }
    });

    if (!hasChanges) {
      report += '*No significant size changes detected.*\n';
    }
  }

  // Threshold warnings
  const warnings = [];
  BUILD_ARTIFACTS.forEach(artifact => {
    const current = currentSizes[artifact.name];
    if (!current?.exists) return;

    const evaluation = evaluateSize(artifact.name, current.raw);
    if (evaluation.level === 'warning' || evaluation.level === 'error') {
      evaluation.messages.forEach(message => {
        warnings.push(`⚠️ **${artifact.name}**: ${message}`);
      });
    }
  });

  if (warnings.length > 0) {
    report += '\n### ⚠️ Size Warnings\n\n';
    warnings.forEach(warning => {
      report += `${warning}\n`;
    });
  }

  return report;
}

/**
 * Generate JSON report
 */
function generateJsonReport(currentSizes, baselineSizes = null) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    current: currentSizes,
    baseline: baselineSizes,
    thresholds: SIZE_THRESHOLDS,
    artifacts: BUILD_ARTIFACTS
  }, null, 2);
}

/**
 * Generate SARIF report for GitHub Code Scanning integration
 */
function generateSARIFReport(currentSizes, baselineSizes = null) {
  const runStartTime = new Date().toISOString();

  // Generate SARIF results from bundle analysis
  const sarifResults = generateBundleSizeSARIFResults(
    currentSizes,
    baselineSizes,
    BUILD_ARTIFACTS,
    SIZE_THRESHOLDS
  );

  // Create SARIF document
  const sarif = generateSARIF({
    results: sarifResults,
    toolName: 'bundle-size-analyzer',
    toolVersion: '1.0.0',
    runStartTime
  });

  // Validate SARIF structure
  const validation = validateSARIF(sarif);
  if (!validation.success) {
    console.warn('⚠️ SARIF validation warnings:', validation.errors);
  }

  return JSON.stringify(sarif, null, 2);
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const flags = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value || true;
    }
  });

  // Log governance mode status on startup for transparency
  logGovernanceModeStatus({
    showDetails: ENV_CONFIG.VERBOSE || flags['verbose'],
    showThresholds: flags['show-thresholds']
  });

  const currentSizes = generateCurrentSizes();

  // Generate baseline file
  if (flags['generate-baseline']) {
    const baselineFile = flags['output'] || 'reports/baseline-sizes.json';
    fs.writeFileSync(baselineFile, JSON.stringify(currentSizes, null, 2));
    console.log(`✅ Baseline sizes saved to ${baselineFile}`);
    return;
  }

  // Load baseline for comparison
  let baselineSizes = null;
  const baselinePath = flags['baseline'] || ENV_CONFIG.BASELINE_PATH;
  if (baselinePath) {
    baselineSizes = loadBaseline(baselinePath);
    if (ENV_CONFIG.VERBOSE && baselineSizes) {
      console.log(`✅ Loaded baseline from ${baselinePath}`);
    }
  }

  // Generate report based on format
  const format = flags['format'] || 'markdown';

  let report;
  switch (format) {
    case 'json':
      report = generateJsonReport(currentSizes, baselineSizes);
      break;
    case 'sarif':
      report = generateSARIFReport(currentSizes, baselineSizes);
      break;
    case 'github-comment':
    case 'markdown':
    default:
      report = generateMarkdownReport(currentSizes, baselineSizes);
      break;
  }

  // Output report
  if (flags['output']) {
    fs.writeFileSync(flags['output'], report);
    console.log(`✅ Report saved to ${flags['output']}`);
  } else {
    console.log(report);
  }

  // Exit with error code if any bundle exceeds error thresholds (unless WARN_ONLY is set)
  const hasErrors = !ENV_CONFIG.WARN_ONLY && BUILD_ARTIFACTS.some(artifact => {
    const current = currentSizes[artifact.name];
    if (!current?.exists) return false;

    const evaluation = evaluateSize(artifact.name, current.raw);
    return evaluation.level === 'error';
  });

  if (hasErrors) {
    console.error('❌ Bundle size check failed: One or more bundles exceed error thresholds');
    safeExit(1);
  } else if (ENV_CONFIG.WARN_ONLY && BUILD_ARTIFACTS.some(artifact => {
    const current = currentSizes[artifact.name];
    if (!current?.exists) return false;
    const evaluation = evaluateSize(artifact.name, current.raw);
    return evaluation.level === 'error';
  })) {
    console.warn('⚠️  Bundle size check completed with errors (ignored due to SIZE_WARN_ONLY)');
  }
}

// Check if this is the main module (handle both Windows and Unix paths)
const isMainModule = process.argv[1] && (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`
);

if (isMainModule) {
  main();
}

export { generateCurrentSizes, generateMarkdownReport, generateJsonReport, generateSARIFReport };