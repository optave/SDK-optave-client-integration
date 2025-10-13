#!/usr/bin/env node

/**
 * Unified Export Surface Analysis Tool
 *
 * Consolidates four overlapping scripts into a single, maintainable solution:
 * - export-surface-check.js (full analysis with VM contexts)
 * - export-surface-check-v2.js (simplified ESM + basic UMD)
 * - export-surface-check-simple.js (basic file existence checks)
 * - export-surface-diff.js (detailed diff output)
 *
 * Usage:
 *   npm run export-surface [--mode=full|quick|diff] [--output=json|markdown] [--help]
 *
 * Modes:
 *   full  - Comprehensive analysis with VM-based UMD loading (default)
 *   quick - Fast ESM-focused analysis with basic UMD syntax checks
 *   diff  - Detailed diff-style comparison between all builds
 *
 * Output formats:
 *   console   - Human-readable console output (default)
 *   json      - Structured JSON output
 *   markdown  - Markdown-formatted report
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { createRequire } from 'module';
import vm from 'vm';
import { EventEmitter } from 'events';

const require = createRequire(import.meta.url);

// Configuration
const DIST_PATH = join(process.cwd(), 'dist');
const BUILD_FORMATS = ['serverESM', 'browserESM', 'serverUMD', 'browserUMD'];
const VERSION = '1.0.0';

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'full',
    output: 'console',
    help: false,
    version: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--version' || arg === '-v') {
      config.version = true;
    } else if (arg.startsWith('--mode=')) {
      config.mode = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      config.output = arg.split('=')[1];
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  // Validate mode
  if (!['full', 'quick', 'diff'].includes(config.mode)) {
    console.error(`Invalid mode: ${config.mode}. Must be one of: full, quick, diff`);
    process.exit(1);
  }

  // Validate output format
  if (!['console', 'json', 'markdown'].includes(config.output)) {
    console.error(`Invalid output format: ${config.output}. Must be one of: console, json, markdown`);
    process.exit(1);
  }

  return config;
}

// Show help message
function showHelp() {
  console.log(`
Export Surface Analysis Tool v${VERSION}

USAGE:
  npm run export-surface [options]
  node scripts/analysis/export-surface.js [options]

OPTIONS:
  --mode=MODE       Analysis mode (full, quick, diff) [default: full]
  --output=FORMAT   Output format (console, json, markdown) [default: console]
  --help, -h        Show this help message
  --version, -v     Show version information

MODES:
  full              Comprehensive analysis with VM-based UMD loading
                    - Tests all build formats (ESM + UMD)
                    - Deep export surface analysis
                    - Consistency checking
                    - Suitable for CI/CD validation

  quick             Fast ESM-focused analysis with basic UMD checks
                    - Fast ESM import testing
                    - Basic UMD syntax validation
                    - Suitable for development workflow

  diff              Detailed diff-style comparison between builds
                    - Shows exact differences between build formats
                    - Git-style diff output
                    - Suitable for troubleshooting inconsistencies

OUTPUT FORMATS:
  console           Human-readable console output with emojis
  json              Structured JSON for programmatic processing
  markdown          Markdown-formatted report for documentation

EXAMPLES:
  npm run export-surface
  npm run export-surface -- --mode=quick --output=json
  npm run export-surface -- --mode=diff --output=markdown

EXIT CODES:
  0    All builds consistent or check passed
  1    Inconsistencies found or analysis failed
`);
}

// Browser globals setup for VM contexts
function setupBrowserGlobals() {
  // Mock EventTarget for browser builds
  if (!global.EventTarget) {
    global.EventTarget = class EventTarget {
      constructor() { this._events = {}; }
      addEventListener(event, listener) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(listener);
      }
      removeEventListener(event, listener) {
        if (this._events[event]) {
          const index = this._events[event].indexOf(listener);
          if (index > -1) this._events[event].splice(index, 1);
        }
      }
      dispatchEvent(event) {
        if (this._events[event.type]) {
          this._events[event.type].forEach(listener => listener(event));
        }
        return true;
      }
    };
  }

  // Mock CustomEvent and Event
  if (!global.CustomEvent) {
    global.CustomEvent = class CustomEvent extends Event {
      constructor(type, options = {}) {
        super(type);
        this.detail = options.detail;
      }
    };
  }

  if (!global.Event) {
    global.Event = class Event {
      constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles || false;
        this.cancelable = options.cancelable || false;
      }
    };
  }

  // Mock crypto.getRandomValues for UUID generation
  if (!global.crypto) {
    global.crypto = {};
  }
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }

  // Mock WebSocket
  global.WebSocket = class WebSocket extends EventEmitter {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url, protocols) {
      super();
      this.url = url;
      this.protocols = protocols;
      this.readyState = WebSocket.CONNECTING;
      setTimeout(() => {
        this.readyState = WebSocket.OPEN;
        this.emit('open');
      }, 0);
    }

    send(data) { this.emit('send', data); }
    close() {
      this.readyState = WebSocket.CLOSED;
      this.emit('close');
    }
  };

  // Mock fetch
  global.fetch = async () => ({ ok: true, json: async () => ({ access_token: 'mock-token' }) });
}

// Create mock crypto for VM contexts
function createMockCrypto() {
  return {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  };
}

// Load browser UMD build using VM context (full mode)
async function loadBrowserUMD() {
  try {
    const browserUmdCode = readFileSync(join(DIST_PATH, 'browser.umd.js'), 'utf8');
    const mockCrypto = createMockCrypto();

    const browserContext = {
      window: { WebSocket: global.WebSocket, crypto: mockCrypto },
      WebSocket: global.WebSocket,
      fetch: global.fetch,
      console,
      setTimeout, clearTimeout, setInterval, clearInterval,
      process: { env: {} },
      EventTarget: global.EventTarget,
      Event: global.Event,
      CustomEvent: global.CustomEvent,
      crypto: mockCrypto,
      global: { crypto: mockCrypto },
      self: { crypto: mockCrypto },
      exports: {},
      module: { exports: {} },
      require: (id) => {
        // Provide minimal mocks for dependencies
        switch (id) {
          case 'events':
            return { default: EventEmitter };
          case 'uuid':
            return { v7: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9) };
          case 'uuidv7':
            return { default: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9) };
          default:
            return {}; // Return empty object for other dependencies
        }
      }
    };

    browserContext.globalThis = browserContext;
    vm.createContext(browserContext);

    // Set up crypto globally in the VM context
    vm.runInContext(`
      this.crypto = {
        getRandomValues: function(array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        },
        randomUUID: function() {
          return 'mock-uuid-' + Math.random().toString(36).substr(2, 9);
        }
      };
      globalThis.crypto = this.crypto;
    `, browserContext);

    // Patch crypto check in UUID library
    let patchedCode = browserUmdCode.replace(
      "throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');",
      `getRandomValues = function(array) {
         for (let i = 0; i < array.length; i++) {
           array[i] = Math.floor(Math.random() * 256);
         }
         return array;
       };`
    );

    vm.runInContext(patchedCode, browserContext);

    const browserResult = browserContext.OptaveJavaScriptSDK ||
                         browserContext.exports?.OptaveJavaScriptSDK ||
                         browserContext.exports?.default ||
                         browserContext.module?.exports ||
                         browserContext.module?.exports?.default;

    if (browserResult && typeof browserResult === 'object' &&
        (typeof browserResult.default === 'function' || typeof browserResult.OptaveJavaScriptSDK === 'function')) {
      return browserResult.default || browserResult.OptaveJavaScriptSDK;
    } else if (typeof browserResult === 'function') {
      return browserResult;
    }

    return browserResult;
  } catch (error) {
    return { error: error.message };
  }
}

// Load server UMD build using VM context (full mode)
async function loadServerUMD() {
  try {
    const serverUmdCode = readFileSync(resolve('../../dist/server.umd.js'), 'utf8');
    const mockCrypto = createMockCrypto();

    const serverContext = {
      globalThis: { crypto: mockCrypto },
      global: { crypto: mockCrypto },
      crypto: mockCrypto,
      exports: {},
      module: { exports: {} },
      console,
      EventTarget: global.EventTarget,
      require: (id) => {
        switch (id) {
          case 'events':
            return EventEmitter;
          case 'uuid':
            return { v7: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9) };
          case 'ws':
            return class MockWebSocket {
              constructor() { this.readyState = 1; }
              send() {}
              close() {}
              addEventListener() {}
              removeEventListener() {}
            };
          case 'crypto':
            return mockCrypto;
          default:
            return {};
        }
      }
    };

    vm.createContext(serverContext);
    vm.runInContext(serverUmdCode, serverContext);

    const result = serverContext.module?.exports;

    if (result && typeof result === 'object' &&
        (typeof result.default === 'function' || typeof result.OptaveJavaScriptSDK === 'function')) {
      return result.default || result.OptaveJavaScriptSDK;
    } else if (typeof result === 'function') {
      return result;
    } else if (serverContext.OptaveJavaScriptSDK) {
      return serverContext.OptaveJavaScriptSDK;
    }

    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// Load server UMD with simple require (quick mode)
async function loadServerUMDSimple() {
  try {
    delete require.cache[require.resolve('../../dist/server.umd.js')];
    const serverUMD = require('../../dist/server.umd.js');

    let ServerSDK = null;
    if (typeof serverUMD === 'function') {
      ServerSDK = serverUMD;
    } else if (serverUMD && typeof serverUMD.default === 'function') {
      ServerSDK = serverUMD.default;
    } else if (serverUMD && typeof serverUMD.OptaveJavaScriptSDK === 'function') {
      ServerSDK = serverUMD.OptaveJavaScriptSDK;
    }

    return ServerSDK || { error: 'Could not find constructor function' };
  } catch (err) {
    return { error: err.message };
  }
}

// Quick browser UMD syntax check
function checkBrowserUMDSyntax() {
  try {
    const browserUmdCode = readFileSync(join(DIST_PATH, 'browser.umd.js'), 'utf8');

    const hasUMDPattern = browserUmdCode.includes('(function webpackUniversalModuleDefinition') ||
                         browserUmdCode.includes('typeof exports === \'object\'') ||
                         browserUmdCode.includes('typeof define === \'function\'');

    const hasGlobalAssignment = browserUmdCode.includes('OptaveJavaScriptSDK');

    return {
      hasUMDPattern,
      hasGlobalAssignment,
      size: Math.round(browserUmdCode.length / 1024)
    };
  } catch (err) {
    return { error: err.message };
  }
}

// Check build file existence and sizes
function checkBuildFiles() {
  const results = {};
  const files = ['server.mjs', 'browser.mjs', 'server.umd.js', 'browser.umd.js'];

  files.forEach(file => {
    try {
      const filepath = join(DIST_PATH, file);
      const stats = readFileSync(filepath, 'utf8').length;
      results[file] = {
        exists: true,
        size: Math.round(stats / 1024)
      };
    } catch (err) {
      results[file] = {
        exists: false,
        error: err.message
      };
    }
  });

  return results;
}

// Load all builds based on mode
async function loadAllBuilds(mode) {
  const builds = {};
  const errors = {};

  try {
    // Always try to load ESM builds
    try {
      const serverESMModule = await import('../../dist/server.mjs');
      builds.serverESM = serverESMModule.default;
    } catch (err) {
      errors.serverESM = err.message;
    }

    try {
      const browserESMModule = await import('../../dist/browser.mjs');
      builds.browserESM = browserESMModule.default;
    } catch (err) {
      errors.browserESM = err.message;
    }

    // Load UMD builds based on mode
    if (mode === 'full') {
      // Full VM-based loading
      const browserUMD = await loadBrowserUMD();
      if (browserUMD && !browserUMD.error) {
        builds.browserUMD = browserUMD;
      } else {
        errors.browserUMD = browserUMD?.error || 'Failed to load';
      }

      const serverUMD = await loadServerUMD();
      if (serverUMD && !serverUMD.error) {
        builds.serverUMD = serverUMD;
      } else {
        errors.serverUMD = serverUMD?.error || 'Failed to load';
      }
    } else if (mode === 'quick') {
      // Simple require for server UMD
      const serverUMD = await loadServerUMDSimple();
      if (serverUMD && !serverUMD.error) {
        builds.serverUMD = serverUMD;
      } else {
        errors.serverUMD = serverUMD?.error || 'Failed to load';
      }

      // Just syntax check for browser UMD
      builds.browserUMDSyntax = checkBrowserUMDSyntax();
    }

  } catch (error) {
    errors.general = error.message;
  }

  return { builds, errors };
}

// Analyze export surface of a constructor function
function analyzeExportSurface(BuildClass, buildName) {
  if (!BuildClass || typeof BuildClass !== 'function') {
    return {
      buildName,
      error: 'Invalid or missing constructor function',
      staticProperties: [],
      staticMethods: [],
      instanceMethods: [],
      enumerableStatic: [],
      enumerableInstance: []
    };
  }

  const analysis = {
    buildName,
    error: null,
    staticProperties: [],
    staticMethods: [],
    instanceMethods: [],
    enumerableStatic: [],
    enumerableInstance: []
  };

  try {
    // Analyze static properties and methods
    const staticDescriptors = Object.getOwnPropertyDescriptors(BuildClass);
    const staticNames = Object.getOwnPropertyNames(BuildClass);

    staticNames.forEach(name => {
      if (name === 'prototype' || name === 'length' || name === 'name') return;

      const descriptor = staticDescriptors[name];
      const value = BuildClass[name];

      if (typeof value === 'function') {
        analysis.staticMethods.push({
          name,
          enumerable: descriptor.enumerable,
          configurable: descriptor.configurable,
          writable: descriptor.writable
        });
      } else {
        analysis.staticProperties.push({
          name,
          type: typeof value,
          enumerable: descriptor.enumerable,
          configurable: descriptor.configurable,
          writable: descriptor.writable,
          isObject: value && typeof value === 'object'
        });
      }

      if (descriptor.enumerable) {
        analysis.enumerableStatic.push(name);
      }
    });

    // Analyze instance methods from prototype
    if (BuildClass.prototype) {
      const prototypeDescriptors = Object.getOwnPropertyDescriptors(BuildClass.prototype);
      const prototypeNames = Object.getOwnPropertyNames(BuildClass.prototype);

      prototypeNames.forEach(name => {
        if (name === 'constructor') return;

        const descriptor = prototypeDescriptors[name];
        const value = BuildClass.prototype[name];

        if (typeof value === 'function') {
          analysis.instanceMethods.push({
            name,
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
            writable: descriptor.writable
          });

          if (descriptor.enumerable) {
            analysis.enumerableInstance.push(name);
          }
        }
      });
    }

    // Sort arrays for consistent comparison
    analysis.staticProperties.sort((a, b) => a.name.localeCompare(b.name));
    analysis.staticMethods.sort((a, b) => a.name.localeCompare(b.name));
    analysis.instanceMethods.sort((a, b) => a.name.localeCompare(b.name));
    analysis.enumerableStatic.sort();
    analysis.enumerableInstance.sort();

  } catch (error) {
    analysis.error = error.message;
  }

  return analysis;
}

// Generate comparison report
function generateComparisonReport(exportSurfaces) {
  const report = {
    summary: {
      buildsAnalyzed: Object.keys(exportSurfaces).length,
      totalBuilds: BUILD_FORMATS.length,
      consistent: true,
      differences: []
    },
    buildAnalyses: exportSurfaces,
    consistencyCheck: {}
  };

  const validBuilds = Object.entries(exportSurfaces).filter(([_, analysis]) => !analysis.error);

  if (validBuilds.length < 2) {
    report.summary.consistent = false;
    report.summary.differences.push('Insufficient builds loaded for comparison');
    return report;
  }

  const [referenceName, referenceAnalysis] = validBuilds[0];

  // Compare each build against reference
  validBuilds.slice(1).forEach(([buildName, analysis]) => {
    const differences = [];

    // Compare static properties
    const refStaticProps = new Set(referenceAnalysis.staticProperties.map(p => p.name));
    const buildStaticProps = new Set(analysis.staticProperties.map(p => p.name));

    const missingStaticProps = [...refStaticProps].filter(name => !buildStaticProps.has(name));
    const extraStaticProps = [...buildStaticProps].filter(name => !refStaticProps.has(name));

    if (missingStaticProps.length > 0) {
      differences.push(`Missing static properties: ${missingStaticProps.join(', ')}`);
    }
    if (extraStaticProps.length > 0) {
      differences.push(`Extra static properties: ${extraStaticProps.join(', ')}`);
    }

    // Compare static methods
    const refStaticMethods = new Set(referenceAnalysis.staticMethods.map(m => m.name));
    const buildStaticMethods = new Set(analysis.staticMethods.map(m => m.name));

    const missingStaticMethods = [...refStaticMethods].filter(name => !buildStaticMethods.has(name));
    const extraStaticMethods = [...buildStaticMethods].filter(name => !refStaticMethods.has(name));

    if (missingStaticMethods.length > 0) {
      differences.push(`Missing static methods: ${missingStaticMethods.join(', ')}`);
    }
    if (extraStaticMethods.length > 0) {
      differences.push(`Extra static methods: ${extraStaticMethods.join(', ')}`);
    }

    // Compare instance methods
    const refInstanceMethods = new Set(referenceAnalysis.instanceMethods.map(m => m.name));
    const buildInstanceMethods = new Set(analysis.instanceMethods.map(m => m.name));

    const missingInstanceMethods = [...refInstanceMethods].filter(name => !buildInstanceMethods.has(name));
    const extraInstanceMethods = [...buildInstanceMethods].filter(name => !refInstanceMethods.has(name));

    if (missingInstanceMethods.length > 0) {
      differences.push(`Missing instance methods: ${missingInstanceMethods.join(', ')}`);
    }
    if (extraInstanceMethods.length > 0) {
      differences.push(`Extra instance methods: ${extraInstanceMethods.join(', ')}`);
    }

    // Compare enumerable properties
    const refEnumerableStatic = new Set(referenceAnalysis.enumerableStatic);
    const buildEnumerableStatic = new Set(analysis.enumerableStatic);

    const enumerabilityDiff = [...refEnumerableStatic].filter(name => !buildEnumerableStatic.has(name))
      .concat([...buildEnumerableStatic].filter(name => !refEnumerableStatic.has(name)));

    if (enumerabilityDiff.length > 0) {
      differences.push(`Enumerable static property differences: ${enumerabilityDiff.join(', ')}`);
    }

    report.consistencyCheck[buildName] = {
      comparedWith: referenceName,
      differences,
      consistent: differences.length === 0
    };

    if (differences.length > 0) {
      report.summary.consistent = false;
      report.summary.differences.push(`${buildName} vs ${referenceName}: ${differences.length} differences`);
    }
  });

  return report;
}

// Create detailed diff between two export surfaces
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

// Console output formatters
function printFullReport(report, buildFileInfo, loadErrors) {
  console.log('🔍 Export Surface Consistency Check Report');
  console.log('==========================================\n');

  // File info
  if (buildFileInfo) {
    console.log('📁 Build Files:');
    Object.entries(buildFileInfo).forEach(([file, info]) => {
      const status = info.exists ? `✅ ${file} (${info.size}KB)` : `❌ ${file} (missing)`;
      console.log(`   ${status}`);
    });
    console.log();
  }

  // Loading errors
  if (Object.keys(loadErrors).length > 0) {
    console.log('⚠️  Loading Issues:');
    Object.entries(loadErrors).forEach(([build, error]) => {
      console.log(`   ❌ ${build}: ${error}`);
    });
    console.log();
  }

  console.log(`📊 Summary:`);
  console.log(`   Builds analyzed: ${report.summary.buildsAnalyzed}/${report.summary.totalBuilds}`);
  console.log(`   Overall consistency: ${report.summary.consistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`);

  if (report.summary.differences.length > 0) {
    console.log(`   Issues found:`);
    report.summary.differences.forEach(diff => console.log(`     - ${diff}`));
  }
  console.log();

  // Print individual build analyses
  Object.entries(report.buildAnalyses).forEach(([buildName, analysis]) => {
    console.log(`📦 ${buildName.toUpperCase()} Build Analysis:`);

    if (analysis.error) {
      console.log(`   ❌ Error: ${analysis.error}`);
      console.log();
      return;
    }

    console.log(`   Static Properties (${analysis.staticProperties.length}):`);
    if (analysis.staticProperties.length > 0) {
      analysis.staticProperties.forEach(prop => {
        const enumMark = prop.enumerable ? '📝' : '🔒';
        console.log(`     ${enumMark} ${prop.name} (${prop.type})`);
      });
    } else {
      console.log('     (none)');
    }

    console.log(`   Static Methods (${analysis.staticMethods.length}):`);
    if (analysis.staticMethods.length > 0) {
      analysis.staticMethods.forEach(method => {
        const enumMark = method.enumerable ? '📝' : '🔒';
        console.log(`     ${enumMark} ${method.name}()`);
      });
    } else {
      console.log('     (none)');
    }

    console.log(`   Instance Methods (${analysis.instanceMethods.length}):`);
    if (analysis.instanceMethods.length > 0) {
      analysis.instanceMethods.forEach(method => {
        const enumMark = method.enumerable ? '📝' : '🔒';
        console.log(`     ${enumMark} ${method.name}()`);
      });
    } else {
      console.log('     (none)');
    }

    console.log();
  });

  // Print consistency check results
  if (Object.keys(report.consistencyCheck).length > 0) {
    console.log('🔗 Consistency Check Results:');
    Object.entries(report.consistencyCheck).forEach(([buildName, check]) => {
      const status = check.consistent ? '✅' : '❌';
      console.log(`   ${status} ${buildName} vs ${check.comparedWith}`);

      if (check.differences.length > 0) {
        check.differences.forEach(diff => console.log(`       - ${diff}`));
      }
    });
    console.log();
  }

  console.log('📋 Recommendations:');
  if (report.summary.consistent) {
    console.log('   ✅ All builds have consistent export surfaces');
    console.log('   ✅ No action needed');
  } else {
    console.log('   ❌ Export surface inconsistencies detected');
    console.log('   🔧 Review build configurations and source code');
    console.log('   🔧 Ensure all builds export the same API surface');
    console.log('   🔧 Consider using this script in CI to prevent regressions');
  }
  console.log();
}

function printQuickReport(builds, buildFileInfo, browserUMDSyntax, loadErrors) {
  console.log('🚀 Quick Export Surface Check');
  console.log('=============================\n');

  // File info
  if (buildFileInfo) {
    console.log('📁 Build Files:');
    Object.entries(buildFileInfo).forEach(([file, info]) => {
      const status = info.exists ? `✅ ${file} (${info.size}KB)` : `❌ ${file} (missing)`;
      console.log(`   ${status}`);
    });
    console.log();
  }

  console.log('📦 ESM Build Analysis:');

  // Server ESM
  if (builds.serverESM) {
    console.log('   ✅ Server ESM loaded');
    console.log(`      - Constructor: ${builds.serverESM.name}`);
    console.log(`      - Static methods: ${Object.getOwnPropertyNames(builds.serverESM)
      .filter(name => name !== 'prototype' && name !== 'length' && name !== 'name' &&
                     typeof builds.serverESM[name] === 'function').length}`);
    console.log(`      - Instance methods: ${Object.getOwnPropertyNames(builds.serverESM.prototype)
      .filter(name => name !== 'constructor' &&
                     typeof builds.serverESM.prototype[name] === 'function').length}`);
  } else {
    console.log(`   ❌ Server ESM failed: ${loadErrors.serverESM || 'Unknown error'}`);
  }

  // Browser ESM
  if (builds.browserESM) {
    console.log('   ✅ Browser ESM loaded');
    console.log(`      - Constructor: ${builds.browserESM.name}`);
    console.log(`      - Static methods: ${Object.getOwnPropertyNames(builds.browserESM)
      .filter(name => name !== 'prototype' && name !== 'length' && name !== 'name' &&
                     typeof builds.browserESM[name] === 'function').length}`);
    console.log(`      - Instance methods: ${Object.getOwnPropertyNames(builds.browserESM.prototype)
      .filter(name => name !== 'constructor' &&
                     typeof builds.browserESM.prototype[name] === 'function').length}`);
  } else {
    console.log(`   ❌ Browser ESM failed: ${loadErrors.browserESM || 'Unknown error'}`);
  }

  console.log('\n🔧 UMD Build Analysis:');

  // Server UMD
  if (builds.serverUMD) {
    console.log(`   ✅ Server UMD loaded: ${builds.serverUMD.name}`);
  } else {
    console.log(`   ❌ Server UMD failed: ${loadErrors.serverUMD || 'Unknown error'}`);
  }

  // Browser UMD syntax
  if (browserUMDSyntax && !browserUMDSyntax.error) {
    console.log(`   ${browserUMDSyntax.hasUMDPattern ? '✅' : '❌'} Browser UMD has UMD wrapper pattern`);
    console.log(`   ${browserUMDSyntax.hasGlobalAssignment ? '✅' : '❌'} Browser UMD contains OptaveJavaScriptSDK reference`);
    console.log(`   📏 Size: ${browserUMDSyntax.size}KB`);
  } else {
    console.log(`   ❌ Browser UMD syntax check failed: ${browserUMDSyntax?.error || 'Unknown error'}`);
  }

  console.log('\n✨ Quick check complete!');
}

function printDiffReport(diffs) {
  console.log('🔍 Export Surface Diff Analysis');
  console.log('===============================\n');

  let totalDifferences = 0;

  diffs.forEach(diff => {
    console.log(`📊 Diff: ${diff.reference} vs ${diff.comparison}`);
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

    const diffCount = diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length;
    if (diffCount === 0) {
      console.log('\n✅ No differences found');
    }

    totalDifferences += diffCount;
    console.log();
  });

  console.log('='.repeat(50));
  if (totalDifferences === 0) {
    console.log('🎉 All builds have consistent export surfaces!');
  } else {
    console.log(`❌ Found ${totalDifferences} total differences across all builds`);
  }

  return totalDifferences;
}

// JSON output formatter
function generateJSONOutput(mode, report, builds, buildFileInfo, loadErrors, diffs) {
  const output = {
    tool: 'export-surface-analyzer',
    version: VERSION,
    mode,
    timestamp: new Date().toISOString(),
    buildFiles: buildFileInfo,
    loadErrors
  };

  if (mode === 'diff') {
    output.diffs = diffs;
    output.summary = {
      totalDifferences: diffs.reduce((sum, diff) =>
        sum + diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length, 0),
      consistent: diffs.every(diff =>
        diff.staticMethodsDiff.length === 0 && diff.staticPropertiesDiff.length === 0 && diff.instanceMethodsDiff.length === 0)
    };
  } else {
    output.analysis = report;
    output.builds = Object.keys(builds);
  }

  return JSON.stringify(output, null, 2);
}

// Markdown output formatter
function generateMarkdownOutput(mode, report, builds, buildFileInfo, loadErrors, diffs) {
  let md = `# Export Surface Analysis Report

**Tool:** export-surface-analyzer v${VERSION}
**Mode:** ${mode}
**Generated:** ${new Date().toISOString()}

## Build Files

| File | Status | Size |
|------|--------|------|
`;

  Object.entries(buildFileInfo || {}).forEach(([file, info]) => {
    const status = info.exists ? '✅ Exists' : '❌ Missing';
    const size = info.exists ? `${info.size}KB` : 'N/A';
    md += `| ${file} | ${status} | ${size} |\n`;
  });

  if (Object.keys(loadErrors).length > 0) {
    md += `\n## Loading Issues\n\n`;
    Object.entries(loadErrors).forEach(([build, error]) => {
      md += `- **${build}**: ${error}\n`;
    });
  }

  if (mode === 'diff') {
    md += `\n## Differences Found\n\n`;

    diffs.forEach(diff => {
      md += `### ${diff.reference} vs ${diff.comparison}\n\n`;

      if (diff.staticMethodsDiff.length > 0) {
        md += `**Static Methods:**\n`;
        diff.staticMethodsDiff.forEach(line => md += `- ${line}\n`);
        md += `\n`;
      }

      if (diff.staticPropertiesDiff.length > 0) {
        md += `**Static Properties:**\n`;
        diff.staticPropertiesDiff.forEach(line => md += `- ${line}\n`);
        md += `\n`;
      }

      if (diff.instanceMethodsDiff.length > 0) {
        md += `**Instance Methods:**\n`;
        diff.instanceMethodsDiff.forEach(line => md += `- ${line}\n`);
        md += `\n`;
      }

      const diffCount = diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length;
      if (diffCount === 0) {
        md += `✅ No differences found\n\n`;
      }
    });

    const totalDiffs = diffs.reduce((sum, diff) =>
      sum + diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length, 0);

    md += `## Summary\n\n`;
    if (totalDiffs === 0) {
      md += `🎉 All builds have consistent export surfaces!\n`;
    } else {
      md += `❌ Found ${totalDiffs} total differences across all builds\n`;
    }
  } else {
    md += `\n## Analysis Summary\n\n`;
    md += `- **Builds analyzed:** ${report?.summary?.buildsAnalyzed || 0}/${report?.summary?.totalBuilds || BUILD_FORMATS.length}\n`;
    md += `- **Consistency:** ${report?.summary?.consistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}\n`;

    if (report?.summary?.differences?.length > 0) {
      md += `\n**Issues found:**\n`;
      report.summary.differences.forEach(diff => md += `- ${diff}\n`);
    }

    md += `\n## Build Details\n\n`;
    Object.entries(report?.buildAnalyses || {}).forEach(([buildName, analysis]) => {
      md += `### ${buildName.toUpperCase()}\n\n`;

      if (analysis.error) {
        md += `❌ **Error:** ${analysis.error}\n\n`;
        return;
      }

      md += `- **Static Properties:** ${analysis.staticProperties.length}\n`;
      md += `- **Static Methods:** ${analysis.staticMethods.length}\n`;
      md += `- **Instance Methods:** ${analysis.instanceMethods.length}\n\n`;
    });
  }

  return md;
}

// Main execution function
async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    return;
  }

  if (config.version) {
    console.log(`Export Surface Analysis Tool v${VERSION}`);
    return;
  }

  try {
    // Setup browser globals if needed
    if (config.mode === 'full') {
      setupBrowserGlobals();
    }

    // Check build files
    const buildFileInfo = checkBuildFiles();

    // Load builds
    const { builds, errors: loadErrors } = await loadAllBuilds(config.mode);

    let exitCode = 0;
    let report, diffs;

    if (config.mode === 'diff') {
      // Diff mode
      const exportSurfaces = {};

      Object.entries(builds).forEach(([buildName, BuildClass]) => {
        if (BuildClass && typeof BuildClass === 'function') {
          exportSurfaces[buildName] = analyzeExportSurface(BuildClass, buildName);
        }
      });

      const validAnalyses = Object.entries(exportSurfaces).filter(([_, analysis]) => !analysis.error);

      if (validAnalyses.length < 2) {
        console.error('❌ Need at least 2 valid builds for diff analysis');
        process.exit(1);
      }

      diffs = [];
      for (let i = 0; i < validAnalyses.length; i++) {
        for (let j = i + 1; j < validAnalyses.length; j++) {
          const [refName, refAnalysis] = validAnalyses[i];
          const [compName, compAnalysis] = validAnalyses[j];
          diffs.push(createDiff(refAnalysis, compAnalysis, refName, compName));
        }
      }

      if (config.output === 'console') {
        const totalDifferences = printDiffReport(diffs);
        exitCode = totalDifferences > 0 ? 1 : 0;
      }

    } else {
      // Full or quick mode
      const exportSurfaces = {};

      Object.entries(builds).forEach(([buildName, BuildClass]) => {
        if (BuildClass && typeof BuildClass === 'function') {
          exportSurfaces[buildName] = analyzeExportSurface(BuildClass, buildName);
        } else if (buildName === 'browserUMDSyntax') {
          // Skip syntax check object
          return;
        } else {
          exportSurfaces[buildName] = {
            buildName,
            error: 'Build not loaded or invalid',
            staticProperties: [],
            staticMethods: [],
            instanceMethods: [],
            enumerableStatic: [],
            enumerableInstance: []
          };
        }
      });

      report = generateComparisonReport(exportSurfaces);

      if (config.output === 'console') {
        if (config.mode === 'quick') {
          printQuickReport(builds, buildFileInfo, builds.browserUMDSyntax, loadErrors);
          // For quick mode, just check if major builds loaded
          exitCode = (builds.serverESM && builds.browserESM) ? 0 : 1;
        } else {
          printFullReport(report, buildFileInfo, loadErrors);
          exitCode = report.summary.consistent ? 0 : 1;
        }
      }
    }

    // Handle JSON output
    if (config.output === 'json') {
      const jsonOutput = generateJSONOutput(config.mode, report, builds, buildFileInfo, loadErrors, diffs);
      console.log(jsonOutput);

      if (config.mode === 'diff') {
        const totalDiffs = diffs.reduce((sum, diff) =>
          sum + diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length, 0);
        exitCode = totalDiffs > 0 ? 1 : 0;
      } else {
        exitCode = report?.summary?.consistent === false ? 1 : 0;
      }
    }

    // Handle markdown output
    if (config.output === 'markdown') {
      const markdownOutput = generateMarkdownOutput(config.mode, report, builds, buildFileInfo, loadErrors, diffs);
      console.log(markdownOutput);

      if (config.mode === 'diff') {
        const totalDiffs = diffs.reduce((sum, diff) =>
          sum + diff.staticMethodsDiff.length + diff.staticPropertiesDiff.length + diff.instanceMethodsDiff.length, 0);
        exitCode = totalDiffs > 0 ? 1 : 0;
      } else {
        exitCode = report?.summary?.consistent === false ? 1 : 0;
      }
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(console.error);
}

// Export functions for compatibility
export {
  loadAllBuilds,
  analyzeExportSurface,
  generateComparisonReport,
  createDiff,
  setupBrowserGlobals
};