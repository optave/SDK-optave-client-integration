#!/usr/bin/env node

/**
 * Modular UMD Bundle Assertion System
 *
 * Refactored from the monolithic assert-umd-bundles.cjs to use a registry-based
 * architecture with:
 * - Individual assertion modules for each validation concern
 * - Parallel execution support with worker threads
 * - Machine-readable JSON output option
 * - Configurable severity levels and filtering
 */

const fs = require('fs');
const path = require('path');
const process = require('process');
const { AssertionRegistry } = require('./bundle-assertions/registry');

// Import individual assertion tasks
const globalSDKPresence = require('./bundle-assertions/tasks/global-sdk-presence');
const evalSecurity = require('./bundle-assertions/tasks/eval-security');
const ajvExclusion = require('./bundle-assertions/tasks/ajv-exclusion');
const buildTargetValidation = require('./bundle-assertions/tasks/build-target-validation');
const websocketSchemeValidation = require('./bundle-assertions/tasks/websocket-scheme-validation');

class ModularBundleAssertor {
  constructor(options = {}) {
    this.options = {
      distDir: options.distDir || path.join(__dirname, '..', '..', 'dist'),
      parallel: options.parallel !== false,
      maxWorkers: options.maxWorkers || 4,
      outputFormat: options.outputFormat || 'human', // 'human' | 'json'
      logLevel: options.logLevel || 'info',
      includeSeverity: options.includeSeverity || ['high', 'medium', 'low'],
      ...options
    };

    this.registry = new AssertionRegistry({
      parallel: this.options.parallel,
      maxWorkers: this.options.maxWorkers,
      outputFormat: this.options.outputFormat,
      logLevel: this.options.logLevel
    });

    this.registerTasks();
  }

  registerTasks() {
    // Register all available assertion tasks
    const tasks = [
      globalSDKPresence,
      evalSecurity,
      ajvExclusion,
      buildTargetValidation,
      websocketSchemeValidation
    ];

    for (const task of tasks) {
      // Only register tasks with matching severity levels
      if (this.options.includeSeverity.includes(task.severity)) {
        this.registry.register(task);
      } else {
        this.registry.log(`Skipping task ${task.name} (severity: ${task.severity})`, 'verbose');
      }
    }

    this.registry.log(`Registered ${this.registry.tasks.length} assertion tasks`, 'info');
  }

  findUMDBundles() {
    if (!fs.existsSync(this.options.distDir)) {
      throw new Error(`Distribution directory not found: ${this.options.distDir}`);
    }

    const files = fs.readdirSync(this.options.distDir);
    const umdFiles = files.filter(file =>
      file.includes('.umd.') &&
      file.endsWith('.js') &&
      !file.endsWith('.map') &&
      // Exclude webpack chunk files (usually numeric prefixes)
      !(/^\d+\./.test(file))
    );

    if (umdFiles.length === 0) {
      throw new Error('No UMD bundle files found in dist directory');
    }

    this.registry.log(`Found ${umdFiles.length} UMD bundle files: ${umdFiles.join(', ')}`);

    // Log excluded files for transparency
    const excludedFiles = files.filter(file =>
      file.includes('.umd.') &&
      file.endsWith('.js') &&
      !file.endsWith('.map') &&
      /^\d+\./.test(file)
    );

    if (excludedFiles.length > 0) {
      this.registry.log(`ℹ️ Excluded webpack chunk files: ${excludedFiles.join(', ')}`);
    }

    return umdFiles.map(file => path.join(this.options.distDir, file));
  }

  readBundle(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.registry.log(`Successfully read bundle: ${path.basename(filePath)} (${content.length} bytes)`, 'verbose');
      return content;
    } catch (error) {
      throw new Error(`Failed to read bundle file: ${error.message}`);
    }
  }

  async assertBundle(filePath) {
    try {
      this.registry.log(`Starting assertions for: ${path.basename(filePath)}`);

      const content = this.readBundle(filePath);
      const results = await this.registry.executeTasks(filePath, content);

      // Store results for this file
      this.registry.results.taskResults.set(filePath, results);

      this.registry.log(`✅ Completed assertions for: ${path.basename(filePath)}`, 'info');

    } catch (error) {
      this.registry.log(`❌ Failed assertions for ${path.basename(filePath)}: ${error.message}`, 'error');
      throw error;
    }
  }

  async run() {
    const startTime = Date.now();
    this.registry.results.startTime = startTime;

    try {
      this.registry.log('🚀 Starting Modular UMD Bundle Static Assertions');
      this.registry.log(`Configuration: parallel=${this.options.parallel}, maxWorkers=${this.options.maxWorkers}, outputFormat=${this.options.outputFormat}`, 'verbose');

      const bundleFiles = this.findUMDBundles();

      // Process all bundle files
      if (this.options.parallel && bundleFiles.length > 1) {
        this.registry.log(`Processing ${bundleFiles.length} bundles in parallel`, 'info');
        await Promise.all(bundleFiles.map(filePath => this.assertBundle(filePath)));
      } else {
        this.registry.log(`Processing ${bundleFiles.length} bundles sequentially`, 'info');
        for (const filePath of bundleFiles) {
          await this.assertBundle(filePath);
        }
      }

      // Generate final report
      const success = this.registry.generateReport();

      if (!success) {
        this.registry.log('\n💥 UMD Bundle assertions failed!', 'error');
        process.exit(1);
      }

      this.registry.log('\n🎉 All UMD Bundle assertions passed!');
      process.exit(0);

    } catch (error) {
      this.registry.log(`💥 Fatal error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--json':
        options.outputFormat = 'json';
        break;
      case '--no-parallel':
        options.parallel = false;
        break;
      case '--max-workers':
        options.maxWorkers = parseInt(args[++i]) || 4;
        break;
      case '--log-level':
        options.logLevel = args[++i] || 'info';
        break;
      case '--severity':
        options.includeSeverity = (args[++i] || 'high,medium,low').split(',');
        break;
      case '--dist-dir':
        options.distDir = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Modular UMD Bundle Assertion System

Usage: node assert-umd-bundles-modular.cjs [options]

Options:
  --json                Output results in JSON format
  --no-parallel         Disable parallel execution
  --max-workers N       Maximum number of worker threads (default: 4)
  --log-level LEVEL     Logging level: silent|error|warn|info|verbose (default: info)
  --severity LIST       Comma-separated severity levels to include: high,medium,low (default: all)
  --dist-dir DIR        Distribution directory path (default: ../dist)
  --help, -h           Show this help message

Examples:
  node assert-umd-bundles-modular.cjs --json
  node assert-umd-bundles-modular.cjs --no-parallel --log-level verbose
  node assert-umd-bundles-modular.cjs --severity high,medium --max-workers 2
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const assertor = new ModularBundleAssertor(options);
  assertor.run();
}

module.exports = { ModularBundleAssertor };