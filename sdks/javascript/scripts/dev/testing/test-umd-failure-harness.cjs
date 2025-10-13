#!/usr/bin/env node

/**
 * Test Harness for UMD Bundle Failure Path Validation
 *
 * This script tests deliberately broken UMD bundles to ensure:
 * 1. The hardened regex correctly identifies various UMD global assignment patterns
 * 2. Failure detection provides clear, actionable error messages
 * 3. Edge cases like minified code with bracket notation are handled
 */

const fs = require('fs');
const path = require('path');
const { UMDBundleAssertor } = require('./assert-umd-bundles.cjs');

class UMDFailureHarnessTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.tempDir = path.join(__dirname, 'temp-test-bundles');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async setupTempDirectory() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async cleanupTempDirectory() {
    if (fs.existsSync(this.tempDir)) {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(this.tempDir, file));
      });
      fs.rmdirSync(this.tempDir);
    }
  }

  createTestBundle(filename, content) {
    const filePath = path.join(this.tempDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * Test cases for various UMD global assignment patterns
   * These should PASS the assertion (be detected correctly)
   */
  getValidUMDPatterns() {
    return {
      STANDARD_GLOBAL_THIS: {
        description: 'Standard globalThis.OptaveJavaScriptSDK assignment',
        content: `
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else {
    global = global || self;
    factory((global.OptaveJavaScriptSDK = {}));
  }
}(this, (function (exports) {
  // UMD bundle content
  globalThis.OptaveJavaScriptSDK = exports.OptaveJavaScriptSDK;
})));
        `,
        shouldPass: true
      },

      WINDOW_BRACKET_NOTATION: {
        description: 'Window bracket notation assignment: window["OptaveJavaScriptSDK"]',
        content: `
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else {
    window["OptaveJavaScriptSDK"] = factory({});
  }
}(this, (function (exports) {
  return { OptaveJavaScriptSDK: exports };
})));
        `,
        shouldPass: true
      },

      MINIFIED_VARIANT: {
        description: 'Minified variant with short variable name: t.OptaveJavaScriptSDK',
        content: `
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):(t=t||self).OptaveJavaScriptSDK=e({})}(this,function(t){
  // Minified UMD content
  var root = this || globalThis;
  root.OptaveJavaScriptSDK = t.OptaveJavaScriptSDK;
});
        `,
        shouldPass: true
      },

      BRACKET_WITH_MINIFIED_ROOT: {
        description: 'Minified with bracket notation: t["OptaveJavaScriptSDK"]',
        content: `
!function(t,e){
  if("object"==typeof exports&&"undefined"!=typeof module)e(exports);
  else if("function"==typeof define&&define.amd)define(["exports"],e);
  else{
    t=t||self;
    t["OptaveJavaScriptSDK"]=e({});
  }
}(this,function(exports){
  // Bundle content
});
        `,
        shouldPass: true
      },

      SELF_REFERENCE: {
        description: 'Self reference pattern: self.OptaveJavaScriptSDK',
        content: `
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    self.OptaveJavaScriptSDK = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  return { version: '1.0.0' };
}));
        `,
        shouldPass: true
      },

      EXPORTS_ASSIGNMENT: {
        description: 'Exports assignment: exports.OptaveJavaScriptSDK',
        content: `
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.OptaveJavaScriptSDK = {}));
}(this, (function (exports) {
  exports.OptaveJavaScriptSDK = {
    version: '1.0.0',
    initialize: function() { return true; }
  };
})));
        `,
        shouldPass: true
      }
    };
  }

  /**
   * Test cases that should FAIL the assertion (missing UMD patterns)
   * These simulate broken UMD bundles
   */
  getBrokenUMDPatterns() {
    return {
      NO_GLOBAL_ASSIGNMENT: {
        description: 'Missing global assignment entirely',
        content: `
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  }
}(this, (function (exports) {
  // Missing: globalThis.OptaveJavaScriptSDK = exports;
  return exports;
})));
        `,
        shouldFail: true,
        expectedError: 'Global OptaveJavaScriptSDK assignment not found'
      },

      WRONG_GLOBAL_NAME: {
        description: 'Wrong global variable name',
        content: `
(function (global, factory) {
  if (typeof exports === 'object') {
    factory(exports);
  } else {
    global.WrongSDKName = factory({});  // Should be OptaveJavaScriptSDK
  }
}(this, function(exports) {
  return { version: '1.0.0' };
}));
        `,
        shouldFail: true,
        expectedError: 'Global OptaveJavaScriptSDK assignment not found'
      },

      COMMENTED_ASSIGNMENT: {
        description: 'Assignment only exists in comments',
        content: `
(function (global, factory) {
  // TODO: Add globalThis.OptaveJavaScriptSDK = factory();
  if (typeof exports === 'object') {
    factory(exports);
  }
  /*
   * Note: Should assign global.OptaveJavaScriptSDK here
   * but it's missing in actual code
   */
}(this, function(exports) {
  return exports;
}));
        `,
        shouldFail: true,
        expectedError: 'Global OptaveJavaScriptSDK assignment not found'
      },

      INCOMPLETE_UMD_WRAPPER: {
        description: 'Incomplete UMD wrapper missing global branch',
        content: `
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  }
  // Missing else branch for global assignment
}(this, function() {
  return { OptaveJavaScriptSDK: { version: '1.0.0' } };
}));
        `,
        shouldFail: true,
        expectedError: 'Global OptaveJavaScriptSDK assignment not found'
      }
    };
  }

  async runValidPatternTests() {
    this.log('🧪 Testing Valid UMD Pattern Detection');
    this.log('=====================================');

    const validPatterns = this.getValidUMDPatterns();
    const assertor = new UMDBundleAssertor();

    for (const [testName, testCase] of Object.entries(validPatterns)) {
      try {
        this.log(`🔍 Testing: ${testCase.description}`);

        const bundlePath = this.createTestBundle(`valid-${testName.toLowerCase()}.umd.js`, testCase.content);

        // This should NOT throw an error
        assertor.assertGlobalSDKPresence(testCase.content, bundlePath);

        this.log(`✅ Pattern detected successfully`);
        this.testResults.passed++;

      } catch (error) {
        this.log(`❌ Unexpected failure: ${error.message}`, 'error');
        this.log(`   Expected: ${testCase.description} should be detected`, 'error');
        this.testResults.failed++;
        this.testResults.errors.push({
          test: testName,
          expected: 'should pass',
          actual: error.message
        });
      }
    }
  }

  async runBrokenPatternTests() {
    this.log('\n🚨 Testing Broken UMD Pattern Detection');
    this.log('========================================');

    const brokenPatterns = this.getBrokenUMDPatterns();
    const assertor = new UMDBundleAssertor();

    for (const [testName, testCase] of Object.entries(brokenPatterns)) {
      try {
        this.log(`🔍 Testing: ${testCase.description}`);

        const bundlePath = this.createTestBundle(`broken-${testName.toLowerCase()}.umd.js`, testCase.content);

        // This SHOULD throw an error
        assertor.assertGlobalSDKPresence(testCase.content, bundlePath);

        // If we reach here, the test failed (should have thrown)
        this.log(`❌ Expected failure but assertion passed`, 'error');
        this.log(`   Expected error containing: ${testCase.expectedError}`, 'error');
        this.testResults.failed++;
        this.testResults.errors.push({
          test: testName,
          expected: `should fail with: ${testCase.expectedError}`,
          actual: 'assertion passed unexpectedly'
        });

      } catch (error) {
        // This is expected - check if the error message is clear and helpful
        if (error.message.includes(testCase.expectedError)) {
          this.log(`✅ Correctly detected failure: ${error.message.substring(0, 100)}...`);
          this.testResults.passed++;
        } else {
          this.log(`❌ Wrong error message: ${error.message}`, 'error');
          this.log(`   Expected error containing: ${testCase.expectedError}`, 'error');
          this.testResults.failed++;
          this.testResults.errors.push({
            test: testName,
            expected: `error containing: ${testCase.expectedError}`,
            actual: error.message
          });
        }
      }
    }
  }

  async runRegexRobustnessTests() {
    this.log('\n🔧 Testing Regex Pattern Robustness');
    this.log('====================================');

    const robustnessTests = {
      EDGE_CASE_SPACING: {
        description: 'Various spacing patterns around assignment',
        content: `
globalThis  .  OptaveJavaScriptSDK   =   factory();
window[ "OptaveJavaScriptSDK" ] = factory();
root.OptaveJavaScriptSDK=factory();
        `,
        shouldPass: true
      },

      MIXED_QUOTES: {
        description: 'Mixed quote styles in bracket notation',
        content: `
window['OptaveJavaScriptSDK'] = factory();
global["OptaveJavaScriptSDK"] = factory();
root[\`OptaveJavaScriptSDK\`] = factory();
        `,
        shouldPass: true
      },

      NESTED_PROPERTY_ACCESS: {
        description: 'Nested property access patterns',
        content: `
window.myNamespace.OptaveJavaScriptSDK = factory();
global.someModule.OptaveJavaScriptSDK = factory();
        `,
        shouldPass: true
      }
    };

    const assertor = new UMDBundleAssertor();

    for (const [testName, testCase] of Object.entries(robustnessTests)) {
      try {
        this.log(`🔍 Testing: ${testCase.description}`);

        const bundlePath = this.createTestBundle(`robustness-${testName.toLowerCase()}.umd.js`, testCase.content);

        if (testCase.shouldPass) {
          assertor.assertGlobalSDKPresence(testCase.content, bundlePath);
          this.log(`✅ Robustness test passed`);
          this.testResults.passed++;
        }

      } catch (error) {
        if (testCase.shouldPass) {
          this.log(`❌ Robustness test failed: ${error.message}`, 'error');
          this.testResults.failed++;
          this.testResults.errors.push({
            test: testName,
            expected: 'should pass',
            actual: error.message
          });
        }
      }
    }
  }

  generateReport() {
    this.log('\n📊 UMD Failure Harness Test Report');
    this.log('===================================');
    this.log(`✅ Passed: ${this.testResults.passed}`);
    this.log(`❌ Failed: ${this.testResults.failed}`);

    if (this.testResults.errors.length > 0) {
      this.log('\n🚨 Test Failures:');
      this.testResults.errors.forEach((error, index) => {
        this.log(`\n${index + 1}. Test: ${error.test}`, 'error');
        this.log(`   Expected: ${error.expected}`, 'error');
        this.log(`   Actual: ${error.actual}`, 'error');
      });

      this.log('\n💡 Recommendations:');
      this.log('• Review regex patterns in assertGlobalSDKPresence method');
      this.log('• Ensure error messages are clear and actionable');
      this.log('• Consider edge cases in minified code detection');
    }

    return this.testResults.failed === 0;
  }

  async run() {
    try {
      this.log('🚀 Starting UMD Bundle Failure Path Validation');

      await this.setupTempDirectory();

      // Test valid patterns (should be detected)
      await this.runValidPatternTests();

      // Test broken patterns (should fail with clear errors)
      await this.runBrokenPatternTests();

      // Test regex robustness
      await this.runRegexRobustnessTests();

      // Generate final report
      const success = this.generateReport();

      await this.cleanupTempDirectory();

      if (!success) {
        this.log('\n💥 UMD failure harness tests failed!', 'error');
        process.exit(1);
      }

      this.log('\n🎉 All UMD failure harness tests passed!');
      this.log('The hardened regex patterns are working correctly and provide clear error messages.');
      process.exit(0);

    } catch (error) {
      this.log(`💥 Fatal error: ${error.message}`, 'error');
      await this.cleanupTempDirectory();
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const tester = new UMDFailureHarnessTest();
  tester.run();
}

module.exports = { UMDFailureHarnessTest };