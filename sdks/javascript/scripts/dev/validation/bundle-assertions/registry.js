#!/usr/bin/env node

/**
 * Bundle Assertion Registry System
 *
 * Modular architecture for UMD bundle validation with:
 * - Registry-based assertion task management
 * - Parallel execution support
 * - Machine-readable JSON output
 * - Configurable severity levels
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');

class BundleAssertionError extends Error {
  constructor(message, file, line, severity = 'high') {
    super(message);
    this.name = 'BundleAssertionError';
    this.file = file;
    this.line = line;
    this.severity = severity;
  }
}

class AssertionRegistry {
  constructor(options = {}) {
    this.options = {
      parallel: options.parallel !== false,
      maxWorkers: options.maxWorkers || Math.min(4, os.cpus().length),
      outputFormat: options.outputFormat || 'human', // 'human' | 'json'
      logLevel: options.logLevel || 'info', // 'silent' | 'error' | 'warn' | 'info' | 'verbose'
      ...options
    };

    this.tasks = [];
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      taskResults: new Map(),
      executionTime: 0,
      metadata: {
        parallel: this.options.parallel,
        workers: this.options.maxWorkers,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Register an assertion task
   * @param {Object} task - Task configuration
   * @param {string} task.name - Unique task identifier
   * @param {string} task.description - Human-readable description
   * @param {Function} task.run - Async function that takes (content, filePath) and throws on failure
   * @param {string} task.severity - 'low' | 'medium' | 'high' | 'critical'
   * @param {Array<string>} task.appliesTo - File pattern filters (e.g., ['*.browser.umd.js', '*.server.umd.js'])
   * @param {boolean} task.enabled - Whether this task is active
   */
  register(task) {
    if (!task.name || !task.run) {
      throw new Error('Task must have name and run function');
    }

    if (this.tasks.find(t => t.name === task.name)) {
      throw new Error(`Task with name '${task.name}' already registered`);
    }

    this.tasks.push({
      name: task.name,
      description: task.description || task.name,
      run: task.run,
      severity: task.severity || 'medium',
      appliesTo: task.appliesTo || ['*'],
      enabled: task.enabled !== false,
      ...task
    });

    this.log(`Registered assertion task: ${task.name} (${task.severity})`, 'verbose');
  }

  /**
   * Get tasks applicable to a specific file
   */
  getApplicableTasks(filePath) {
    const fileName = path.basename(filePath);

    return this.tasks.filter(task => {
      if (!task.enabled) return false;

      return task.appliesTo.some(pattern => {
        if (pattern === '*') return true;

        // Simple glob matching
        const regex = new RegExp(
          pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
        );

        return regex.test(fileName);
      });
    });
  }

  /**
   * Execute assertions on a bundle file
   */
  async executeTasks(filePath, content) {
    const applicableTasks = this.getApplicableTasks(filePath);

    if (applicableTasks.length === 0) {
      this.log(`No applicable tasks for ${path.basename(filePath)}`, 'info');
      return [];
    }

    this.log(`Running ${applicableTasks.length} tasks for ${path.basename(filePath)}`, 'info');

    if (this.options.parallel && applicableTasks.length > 1) {
      return await this.executeTasksParallel(filePath, content, applicableTasks);
    } else {
      return await this.executeTasksSequential(filePath, content, applicableTasks);
    }
  }

  /**
   * Execute tasks sequentially
   */
  async executeTasksSequential(filePath, content, tasks) {
    const results = [];

    for (const task of tasks) {
      const startTime = Date.now();
      let result;

      try {
        await task.run(content, filePath);
        result = {
          task: task.name,
          status: 'passed',
          severity: task.severity,
          executionTime: Date.now() - startTime,
          message: `✓ ${task.description}`
        };
        this.results.passed++;
      } catch (error) {
        const isWarning = error.severity === 'low' || error.severity === 'warning';

        result = {
          task: task.name,
          status: isWarning ? 'warning' : 'failed',
          severity: error.severity || task.severity,
          executionTime: Date.now() - startTime,
          message: error.message,
          file: error.file || filePath,
          line: error.line,
          context: error.context
        };

        if (isWarning) {
          this.results.warnings++;
        } else {
          this.results.failed++;
          this.results.errors.push(error);
        }
      }

      results.push(result);
      this.logTaskResult(result);
    }

    return results;
  }

  /**
   * Execute tasks in parallel using worker threads
   * For now, fallback to sequential execution to avoid complexity
   */
  async executeTasksParallel(filePath, content, tasks) {
    // Temporary fallback to sequential execution to avoid worker thread complexity
    this.log(`Falling back to sequential execution for ${tasks.length} tasks`, 'verbose');
    return await this.executeTasksSequential(filePath, content, tasks);
  }

  /**
   * Worker thread execution handler
   */
  static async executeInWorker(workerData) {
    const { tasks, filePath, content, options } = workerData;
    const results = [];
    let passed = 0, failed = 0, warnings = 0;
    const errors = [];

    for (const task of tasks) {
      const startTime = Date.now();
      let result;

      try {
        await task.run(content, filePath);
        result = {
          task: task.name,
          status: 'passed',
          severity: task.severity,
          executionTime: Date.now() - startTime,
          message: `✓ ${task.description}`
        };
        passed++;
      } catch (error) {
        const isWarning = error.severity === 'low' || error.severity === 'warning';

        result = {
          task: task.name,
          status: isWarning ? 'warning' : 'failed',
          severity: error.severity || task.severity,
          executionTime: Date.now() - startTime,
          message: error.message,
          file: error.file || filePath,
          line: error.line,
          context: error.context
        };

        if (isWarning) {
          warnings++;
        } else {
          failed++;
          errors.push(error);
        }
      }

      results.push(result);
    }

    return { results, passed, failed, warnings, errors };
  }

  /**
   * Utility methods
   */
  chunkArray(array, chunkCount) {
    const chunks = [];
    const chunkSize = Math.ceil(array.length / chunkCount);

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  log(message, level = 'info') {
    const levels = { silent: 0, error: 1, warn: 2, info: 3, verbose: 4 };
    const currentLevel = levels[this.options.logLevel] || 3;
    const messageLevel = levels[level] || 3;

    if (messageLevel <= currentLevel) {
      if (this.options.outputFormat === 'json') {
        // Store logs for JSON output
        this.results.logs = this.results.logs || [];
        this.results.logs.push({ level, message, timestamp: new Date().toISOString() });
      } else {
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'verbose' ? '🔍' : '✅';
        console.log(`${prefix} [${new Date().toISOString()}] ${message}`);
      }
    }
  }

  logTaskResult(result) {
    if (this.options.outputFormat === 'json') return;

    const prefix = result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const duration = result.executionTime ? ` (${result.executionTime}ms)` : '';

    this.log(`${prefix} ${result.task}: ${result.message}${duration}`, result.status === 'failed' ? 'error' : 'info');

    if (result.file && result.line) {
      this.log(`   📍 ${path.relative(process.cwd(), result.file)}:${result.line}`, result.status === 'failed' ? 'error' : 'warn');
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    this.results.executionTime = Date.now() - (this.results.startTime || Date.now());

    if (this.options.outputFormat === 'json') {
      return this.generateJSONReport();
    } else {
      return this.generateHumanReport();
    }
  }

  generateJSONReport() {
    const report = {
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        total: this.results.passed + this.results.failed + this.results.warnings,
        success: this.results.failed === 0
      },
      metadata: this.results.metadata,
      tasks: Array.from(this.results.taskResults.values()),
      errors: this.results.errors.map(error => ({
        name: error.name,
        message: error.message,
        severity: error.severity,
        file: error.file ? path.relative(process.cwd(), error.file) : null,
        line: error.line
      })),
      executionTime: this.results.executionTime,
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(report, null, 2));
    return report.summary.success;
  }

  generateHumanReport() {
    this.log('\n📊 Bundle Assertion Report');
    this.log('================================');
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`⚠️ Warnings: ${this.results.warnings}`);
    this.log(`❌ Failed: ${this.results.failed}`);
    this.log(`⏱️ Execution time: ${this.results.executionTime}ms`);

    if (this.results.errors.length > 0) {
      this.log('\n🚨 Errors:', 'error');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. [${error.severity?.toUpperCase() || 'HIGH'}] ${error.message}`, 'error');
        if (error.file) {
          this.log(`   📁 ${path.relative(process.cwd(), error.file)}`, 'error');
        }
      });
    }

    const success = this.results.failed === 0;
    this.log(success ? '\n🎉 All assertions passed!' : '\n💥 Some assertions failed!');

    return success;
  }
}

// Worker thread handler
if (!isMainThread) {
  (async () => {
    try {
      const result = await AssertionRegistry.executeInWorker(workerData);
      parentPort.postMessage(result);
    } catch (error) {
      parentPort.postMessage({
        results: [],
        passed: 0,
        failed: 1,
        warnings: 0,
        errors: [{ name: error.name, message: error.message, severity: 'high' }]
      });
    }
  })();
}

module.exports = { AssertionRegistry, BundleAssertionError };