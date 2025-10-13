#!/usr/bin/env node

/**
 * Governance Check Orchestrator
 *
 * Single meta-command that orchestrates all quality assurance checks:
 * - Build (if dist missing)
 * - UMD bundle assertions
 * - Export surface validation (quick mode)
 * - Tree-shaking validation
 * - Size reporting (warn-only locally)
 * - Schema drift guard (skipped locally unless --full)
 *
 * Usage:
 *   npm run governance:check          # Standard local development workflow
 *   npm run governance:check --full   # Include CI-only checks locally
 *   npm run governance:check --strict # Enforce strict mode (fail on warnings)
 *
 * Environment Variables:
 *   GOVERNANCE_WARN_ONLY=true        # Convert all failures to warnings
 *   GOVERNANCE_SKIP_BUILD=true       # Skip build step (assume dist exists)
 *   GOVERNANCE_VERBOSE=true          # Enable verbose output
 *
 * @fileoverview Comprehensive governance orchestration for SDK quality assurance
 */

import { execSync, spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SDK_ROOT = resolve(__dirname, '..');
const DIST_DIR = resolve(SDK_ROOT, 'dist');

/**
 * Governance Check Orchestrator
 * Coordinates multiple quality gates with flexible configuration
 */
class GovernanceOrchestrator {
  constructor(options = {}) {
    this.options = {
      full: options.full || false,           // Include CI-only checks
      strict: options.strict || false,       // Fail on warnings
      verbose: options.verbose || process.env.GOVERNANCE_VERBOSE === 'true',
      warnOnly: process.env.GOVERNANCE_WARN_ONLY === 'true',
      skipBuild: process.env.GOVERNANCE_SKIP_BUILD === 'true',
      ...options
    };

    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      skipped: 0,
      checks: []
    };

    // Configure logging
    this.startTime = Date.now();
    this.log('info', '🔍 Governance Check Orchestrator Starting');
    this.logConfiguration();
  }

  /**
   * Log governance configuration for transparency
   */
  logConfiguration() {
    const config = [
      `Mode: ${this.options.full ? 'FULL (CI-like)' : 'STANDARD (local dev)'}`,
      `Enforcement: ${this.options.warnOnly ? 'WARN-ONLY' : (this.options.strict ? 'STRICT' : 'BALANCED')}`,
      `Build: ${this.options.skipBuild ? 'SKIPPED' : 'INCLUDED'}`,
      `Verbose: ${this.options.verbose ? 'ENABLED' : 'DISABLED'}`
    ];

    this.log('info', '📋 Configuration:');
    config.forEach(line => this.log('info', `   ${line}`));
    this.log('info', '');
  }

  /**
   * Unified logging with timestamps and level indicators
   */
  log(level, message, details = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const icons = { info: '💬', warn: '⚠️', error: '❌', success: '✅' };
    const icon = icons[level] || '📝';

    console.log(`[${timestamp}] ${icon} ${message}`);

    if (details && this.options.verbose) {
      if (typeof details === 'string') {
        console.log(`    ${details}`);
      } else {
        console.log('    ', JSON.stringify(details, null, 2));
      }
    }
  }

  /**
   * Execute a command with proper error handling and output capture
   */
  async executeCommand(command, description, options = {}) {
    const {
      cwd = SDK_ROOT,
      captureOutput = false,
      timeout = 120000 // 2 minutes default
    } = options;

    this.log('info', `Executing: ${description}`);
    if (this.options.verbose) {
      this.log('info', `Command: ${command}`, `Working directory: ${cwd}`);
    }

    try {
      const result = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: captureOutput ? 'pipe' : (this.options.verbose ? 'inherit' : 'pipe'),
        timeout
      });

      return { success: true, output: result, command, description };
    } catch (error) {
      const errorInfo = {
        success: false,
        error: error.message,
        exitCode: error.status,
        signal: error.signal,
        command,
        description,
        stdout: error.stdout,
        stderr: error.stderr
      };

      if (this.options.verbose || !captureOutput) {
        this.log('error', `Command failed: ${description}`);
        this.log('error', `Exit code: ${error.status || 'unknown'}`);
        if (error.stderr) {
          this.log('error', 'STDERR:', error.stderr);
        }
      }

      return errorInfo;
    }
  }

  /**
   * Record the result of a governance check
   */
  recordResult(checkName, success, message, details = null, isWarning = false) {
    const result = {
      check: checkName,
      success,
      isWarning,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.checks.push(result);

    if (success) {
      this.results.passed++;
      this.log('success', `${checkName}: ${message}`);
    } else if (isWarning || this.options.warnOnly) {
      this.results.warnings++;
      this.log('warn', `${checkName}: ${message}`);
      if (this.options.warnOnly) {
        this.log('warn', '  → Converted to warning (GOVERNANCE_WARN_ONLY=true)');
      }
    } else {
      this.results.failed++;
      this.log('error', `${checkName}: ${message}`);
    }

    if (details && this.options.verbose) {
      this.log('info', 'Details:', details);
    }

    return result;
  }

  /**
   * Check if build artifacts exist and are recent
   */
  async checkBuildStatus() {
    this.log('info', '🔨 Checking build status...');

    if (!existsSync(DIST_DIR)) {
      return { needsBuild: true, reason: 'dist directory does not exist' };
    }

    // Check for essential build artifacts
    const essentialFiles = [
      'browser.umd.js',
      'server.umd.js',
      'browser.mjs',
      'server.mjs'
    ];

    const missingFiles = essentialFiles.filter(file =>
      !existsSync(resolve(DIST_DIR, file))
    );

    if (missingFiles.length > 0) {
      return {
        needsBuild: true,
        reason: `missing essential files: ${missingFiles.join(', ')}`
      };
    }

    // Check if build artifacts are reasonably recent (within last hour for dev)
    if (!this.options.full) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const oldFiles = essentialFiles.filter(file => {
        const filePath = resolve(DIST_DIR, file);
        const stats = statSync(filePath);
        return stats.mtime.getTime() < oneHourAgo;
      });

      if (oldFiles.length > 0) {
        return {
          needsBuild: false,
          shouldRebuild: true,
          reason: `build artifacts are older than 1 hour: ${oldFiles.join(', ')}`
        };
      }
    }

    return { needsBuild: false, reason: 'build artifacts are current' };
  }

  /**
   * Perform build if needed
   */
  async performBuild() {
    if (this.options.skipBuild) {
      this.recordResult('Build Check', true, 'Skipped (GOVERNANCE_SKIP_BUILD=true)', null, false);
      return true;
    }

    const buildStatus = await this.checkBuildStatus();

    if (!buildStatus.needsBuild && !buildStatus.shouldRebuild) {
      this.recordResult('Build Check', true, `Build not needed: ${buildStatus.reason}`, null, false);
      return true;
    }

    const buildReason = buildStatus.needsBuild ? 'required' : 'recommended';
    this.log('info', `Build ${buildReason}: ${buildStatus.reason}`);

    const buildResult = await this.executeCommand(
      'npm run build',
      'Building SDK artifacts'
    );

    if (buildResult.success) {
      this.recordResult('Build', true, 'SDK artifacts built successfully', null, false);
      return true;
    } else {
      this.recordResult('Build', false, 'Build failed', buildResult, false);
      return false;
    }
  }

  /**
   * Run UMD bundle assertions
   */
  async runUMDAssertions() {
    this.log('info', '📦 Running UMD bundle assertions...');

    const result = await this.executeCommand(
      'npm run assert:umd-bundles',
      'UMD bundle format validation',
      { captureOutput: true }
    );

    if (result.success) {
      this.recordResult('UMD Assertions', true, 'All UMD bundles validated successfully', null, false);
      return true;
    } else {
      const message = 'UMD bundle validation failed';
      const details = {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode
      };
      this.recordResult('UMD Assertions', false, message, details, false);
      return false;
    }
  }

  /**
   * Run export surface validation (quick mode)
   */
  async runExportSurfaceCheck() {
    this.log('info', '🔌 Running export surface validation (quick mode)...');

    const result = await this.executeCommand(
      'npm run check:export-surface',
      'Export surface validation',
      { captureOutput: true }
    );

    if (result.success) {
      this.recordResult('Export Surface', true, 'Export surface validation passed', null, false);
      return true;
    } else {
      const message = 'Export surface validation failed';
      const details = {
        stdout: result.stdout,
        stderr: result.stderr
      };

      // Check if this is a warning-level failure
      const isWarning = result.stderr && result.stderr.includes('warning') && !result.stderr.includes('error');
      this.recordResult('Export Surface', !isWarning, message, details, isWarning);
      return isWarning || this.options.warnOnly;
    }
  }

  /**
   * Run tree-shaking validation
   */
  async runTreeShakingValidation() {
    this.log('info', '🌳 Running tree-shaking validation...');

    const result = await this.executeCommand(
      'npm run validate:tree-shaking',
      'Tree-shaking optimization validation',
      { captureOutput: true }
    );

    if (result.success) {
      this.recordResult('Tree-shaking', true, 'Tree-shaking validation passed', null, false);
      return true;
    } else {
      const message = 'Tree-shaking validation failed';
      const details = {
        stdout: result.stdout,
        stderr: result.stderr
      };
      this.recordResult('Tree-shaking', false, message, details, false);
      return false;
    }
  }

  /**
   * Generate size report (warn-only locally)
   */
  async runSizeReport() {
    this.log('info', '📊 Generating bundle size report...');

    // Set warn-only mode for local development
    const env = {
      ...process.env,
      SIZE_WARN_ONLY: this.options.full ? 'false' : 'true'
    };

    const result = await this.executeCommand(
      'npm run size:report',
      'Bundle size analysis',
      { captureOutput: true }
    );

    if (result.success) {
      const message = this.options.full
        ? 'Bundle size validation passed'
        : 'Bundle size report generated (warn-only mode)';
      this.recordResult('Size Report', true, message, null, !this.options.full);

      // Parse and display key size metrics if available
      if (result.stdout && this.options.verbose) {
        this.log('info', 'Size Report Details:', result.stdout.trim());
      }

      return true;
    } else {
      const message = 'Bundle size analysis failed';
      const details = { stdout: result.stdout, stderr: result.stderr };

      // In local mode (non-full), treat size issues as warnings
      const isWarning = !this.options.full;
      this.recordResult('Size Report', isWarning, message, details, isWarning);
      return isWarning || this.options.warnOnly;
    }
  }

  /**
   * Run schema drift guard (CI-only unless --full)
   */
  async runSchemaDriftGuard() {
    if (!this.options.full) {
      this.recordResult('Schema Drift', true, 'Skipped in local mode (use --full to include)', null, false);
      this.results.skipped++;
      return true;
    }

    this.log('info', '🛡️ Running schema drift guard...');

    const result = await this.executeCommand(
      'npm run spec:drift-guard',
      'Schema drift detection',
      { captureOutput: true, timeout: 60000 } // 1 minute timeout for schema checks
    );

    if (result.success) {
      this.recordResult('Schema Drift', true, 'No schema drift detected', null, false);
      return true;
    } else {
      const message = 'Schema drift detected';
      const details = {
        stdout: result.stdout,
        stderr: result.stderr
      };
      this.recordResult('Schema Drift', false, message, details, false);
      return false;
    }
  }

  /**
   * Generate final governance summary
   */
  generateSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 100;

    this.log('info', '');
    this.log('info', '📋 ===== GOVERNANCE CHECK SUMMARY =====');
    this.log('info', `⏱️  Duration: ${duration}s`);
    this.log('info', `📊 Results: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.warnings} warnings`);
    if (this.results.skipped > 0) {
      this.log('info', `⏭️  Skipped: ${this.results.skipped} checks`);
    }
    this.log('info', `🎯 Success Rate: ${successRate}%`);

    // List failed checks
    if (this.results.failed > 0) {
      this.log('error', '');
      this.log('error', '❌ Failed Checks:');
      this.results.checks
        .filter(check => !check.success && !check.isWarning)
        .forEach(check => {
          this.log('error', `   • ${check.check}: ${check.message}`);
        });
    }

    // List warnings (if strict mode, treat as failures for final decision)
    if (this.results.warnings > 0) {
      const level = this.options.strict ? 'error' : 'warn';
      this.log(level, '');
      this.log(level, this.options.strict ? '⚠️  Warnings (treated as failures in strict mode):' : '⚠️  Warnings:');
      this.results.checks
        .filter(check => check.isWarning || (!check.success && this.options.warnOnly))
        .forEach(check => {
          this.log(level, `   • ${check.check}: ${check.message}`);
        });
    }

    // Determine final status
    const hasRealFailures = this.results.failed > 0;
    const hasWarningsInStrictMode = this.options.strict && this.results.warnings > 0;
    const overallSuccess = !hasRealFailures && !hasWarningsInStrictMode;

    this.log('info', '');
    if (overallSuccess) {
      this.log('success', '🎉 All governance checks passed!');
      if (this.options.warnOnly && this.results.failed > 0) {
        this.log('info', '   (Some failures were converted to warnings)');
      }
    } else {
      this.log('error', '💥 Governance checks failed!');
      this.log('error', '   Please address the issues above before proceeding.');

      if (hasWarningsInStrictMode) {
        this.log('error', '   (Warnings treated as failures in strict mode)');
      }
    }

    return overallSuccess;
  }

  /**
   * Run all governance checks in sequence
   */
  async runAllChecks() {
    this.log('info', '🚀 Starting comprehensive governance checks...');
    this.log('info', '');

    try {
      // Define check sequence - order matters for dependencies
      const checks = [
        { name: 'Build', fn: () => this.performBuild() },
        { name: 'UMD Assertions', fn: () => this.runUMDAssertions() },
        { name: 'Export Surface', fn: () => this.runExportSurfaceCheck() },
        { name: 'Tree-shaking', fn: () => this.runTreeShakingValidation() },
        { name: 'Size Report', fn: () => this.runSizeReport() },
        { name: 'Schema Drift', fn: () => this.runSchemaDriftGuard() }
      ];

      let continueChecks = true;

      for (const check of checks) {
        if (!continueChecks) {
          this.recordResult(check.name, false, 'Skipped due to previous failures', null, false);
          this.results.skipped++;
          continue;
        }

        try {
          const checkResult = await check.fn();

          // Stop on critical failures (unless in warn-only mode)
          if (!checkResult && !this.options.warnOnly) {
            // Allow continuing for certain non-critical checks
            const nonCriticalChecks = ['Size Report', 'Schema Drift'];
            if (!nonCriticalChecks.includes(check.name)) {
              continueChecks = false;
              this.log('warn', `Stopping further checks due to ${check.name} failure`);
            }
          }
        } catch (error) {
          this.recordResult(check.name, false, `Check threw exception: ${error.message}`, { stack: error.stack }, false);
          if (!this.options.warnOnly) {
            continueChecks = false;
          }
        }

        this.log('info', ''); // Space between checks
      }

      return this.generateSummary();

    } catch (error) {
      this.log('error', `Fatal error during governance checks: ${error.message}`);
      if (this.options.verbose) {
        this.log('error', 'Stack trace:', error.stack);
      }
      return false;
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(args) {
  const options = {
    full: false,
    strict: false,
    verbose: false,
    help: false
  };

  for (const arg of args) {
    switch (arg) {
      case '--full':
        options.full = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`Warning: Unknown option ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
🔍 Governance Check Orchestrator

Single meta-command that orchestrates all SDK quality assurance checks:
• Build (if dist missing)
• UMD bundle assertions
• Export surface validation (quick mode)
• Tree-shaking validation
• Size reporting (warn-only locally)
• Schema drift guard (skipped locally unless --full)

USAGE:
  npm run governance:check          Standard local development workflow
  npm run governance:check --full   Include CI-only checks locally
  npm run governance:check --strict Enforce strict mode (fail on warnings)
  npm run governance:check --verbose Enable detailed output

OPTIONS:
  --full     Include all checks (CI mode)
  --strict   Treat warnings as failures
  --verbose  Enable detailed output and debugging
  --help     Show this help message

ENVIRONMENT VARIABLES:
  GOVERNANCE_WARN_ONLY=true        Convert all failures to warnings
  GOVERNANCE_SKIP_BUILD=true       Skip build step (assume dist exists)
  GOVERNANCE_VERBOSE=true          Enable verbose output

EXAMPLES:
  # Quick local development check
  npm run governance:check

  # Full validation (like CI)
  npm run governance:check --full --strict

  # Debug mode with all details
  npm run governance:check --verbose

  # Warning-only mode for experimentation
  GOVERNANCE_WARN_ONLY=true npm run governance:check --full
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArguments(args);

  if (options.help) {
    displayHelp();
    process.exit(0);
  }

  const orchestrator = new GovernanceOrchestrator(options);
  const success = await orchestrator.runAllChecks();

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run if executed directly
if (process.argv[1] === __filename || process.argv[1].endsWith('governance-check.js')) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default GovernanceOrchestrator;