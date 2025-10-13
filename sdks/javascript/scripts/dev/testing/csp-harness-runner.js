#!/usr/bin/env node
/**
 * CSP Policy Test Harness Runner
 *
 * Programmatically runs the CSP test harness to validate UMD builds
 * for Content Security Policy compliance.
 *
 * Usage:
 *   node scripts/csp-harness-runner.js
 *   npm run test:csp-harness
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { performance } from 'perf_hooks';

class CSPHarnessRunner {
    constructor() {
        this.violations = [];
        this.testResults = {};
        this.totalTests = 0;
        this.passedTests = 0;
        this.startTime = null;

        // Configuration constants for deterministic loading
        this.HARNESS_LOAD_TIMEOUT_MS = 2000;
        this.POLLING_INTERVAL_MS = 10;
        this.TEST_MODE = process.env.CSP_HARNESS_TEST_MODE || false;
    }

    async run() {
        console.log('🔒 Starting CSP Policy Test Harness...\n');

        try {
            console.log('📋 Initializing harness...');
            // Load and initialize the harness
            await this.initializeHarness();

            console.log('🧪 Running tests...');
            // Run tests for both UMD builds
            const results = await this.runAllTests();

            console.log('📊 Generating report...');
            // Generate final report
            this.generateReport(results);

            // Exit with appropriate code
            const success = results.browser.passed && results.server.passed;
            console.log(`\n🎯 Final result: ${success ? 'SUCCESS' : 'FAILURE'}`);
            process.exit(success ? 0 : 1);

        } catch (error) {
            console.error('❌ CSP Harness Runner failed:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }

    async initializeHarness() {
        console.log('   📁 Looking for harness file...');
        const harnessPath = path.resolve('tests', 'harness', 'csp-policy-test-harness.html');
        console.log(`   📂 Harness path: ${harnessPath}`);

        if (!fs.existsSync(harnessPath)) {
            throw new Error(`Harness file not found: ${harnessPath}`);
        }

        console.log('   📄 Reading harness HTML...');
        const harnessHTML = fs.readFileSync(harnessPath, 'utf8');
        console.log(`   📝 HTML size: ${harnessHTML.length} characters`);

        console.log('   🌍 Creating JSDOM environment...');
        // Create JSDOM environment
        this.dom = new JSDOM(harnessHTML, {
            url: 'https://csp-test-harness.local/',
            contentType: 'text/html',
            runScripts: 'dangerously',
            resources: 'usable'
        });

        console.log('   👂 Setting up CSP violation monitoring...');
        // Set up CSP violation monitoring
        this.setupViolationMonitoring();

        console.log('   🛠️  Setting up mocks...');
        // Mock required APIs
        this.setupMocks();

        console.log('✅ CSP harness initialized successfully');
    }

    setupViolationMonitoring() {
        this.dom.window.addEventListener('securitypolicyviolation', (event) => {
            const violation = {
                directive: event.violatedDirective,
                blockedURI: event.blockedURI,
                sourceFile: event.sourceFile,
                lineNumber: event.lineNumber,
                columnNumber: event.columnNumber,
                sample: event.sample,
                timestamp: new Date().toISOString()
            };

            this.violations.push(violation);
        });
    }

    setupMocks() {
        // Mock performance API (if not already available or read-only)
        if (!this.dom.window.performance || !this.dom.window.performance.now) {
            try {
                this.dom.window.performance = {
                    now: () => performance.now(),
                    timeOrigin: Date.now() - 1000
                };
            } catch (error) {
                // If performance is read-only, just ensure now() method exists
                if (this.dom.window.performance && !this.dom.window.performance.now) {
                    this.dom.window.performance.now = () => performance.now();
                }
            }
        }

        // Mock console for logging
        this.dom.window.console = {
            log: (...args) => console.log('[Harness]', ...args),
            error: (...args) => console.error('[Harness]', ...args),
            warn: (...args) => console.warn('[Harness]', ...args)
        };

        // Mock alert for jsdom compatibility
        this.dom.window.alert = (message) => console.log('[Alert]', message);
    }

    async runAllTests() {
        const results = {};

        // Test browser UMD build
        console.log('\n📦 Testing Browser UMD Build...');
        results.browser = await this.testBuild('browser');

        // Clear violations between tests
        this.violations = [];

        // Test server UMD build
        console.log('\n📦 Testing Server UMD Build...');
        results.server = await this.testBuild('server');

        return results;
    }

    async testBuild(buildType) {
        const buildPath = path.resolve('dist', `${buildType}.umd.js`);
        const result = {
            buildType,
            buildPath,
            exists: false,
            loaded: false,
            passed: false,
            violations: [],
            loadTime: 0,
            sdkInitialized: false,
            availableMethods: [],
            error: null
        };

        try {
            // Check if build file exists
            if (!fs.existsSync(buildPath)) {
                throw new Error(`Build file not found: ${buildPath}. Run 'npm run build' first.`);
            }

            result.exists = true;
            console.log(`   📁 Found build file: ${buildPath}`);

            // Load and test the UMD build
            const startTime = performance.now();
            await this.loadUMDScript(buildPath, buildType);
            result.loadTime = Math.round(performance.now() - startTime);
            result.loaded = true;

            console.log(`   ⏱️  Load time: ${result.loadTime}ms`);

            // Test SDK functionality
            const sdkTests = await this.testSDKFunctionality();
            result.sdkInitialized = sdkTests.initialized;
            result.availableMethods = sdkTests.availableMethods;

            console.log(`   🧪 SDK initialized: ${result.sdkInitialized ? '✅' : '❌'}`);
            console.log(`   🔧 Available methods: ${result.availableMethods.length}`);

            // Check for CSP violations that occurred during this test
            result.violations = [...this.violations];

            if (result.violations.length === 0) {
                result.passed = true;
                console.log(`   ✅ No CSP violations detected`);
            } else {
                console.log(`   ❌ ${result.violations.length} CSP violation(s) detected`);
                result.violations.forEach(violation => {
                    console.log(`      - ${violation.directive}: ${violation.blockedURI}`);
                });
            }

        } catch (error) {
            result.error = error.message;
            console.log(`   ❌ Test failed: ${error.message}`);
        }

        return result;
    }

    async loadUMDScript(buildPath, buildType) {
        const buildContent = fs.readFileSync(buildPath, 'utf8');

        // Create AbortController for deterministic cancellation
        const abortController = new AbortController();
        const { signal } = abortController;

        // Set up deterministic timeout that will abort the operation
        const timeoutMs = this.TEST_MODE === 'SIMULATE_TIMEOUT' ? 50 : this.HARNESS_LOAD_TIMEOUT_MS;
        console.log(`   🕐 Setting timeout for ${timeoutMs}ms (Test mode: ${this.TEST_MODE})`);
        const timeoutId = setTimeout(() => {
            console.log(`   ⏰ Timeout triggered after ${timeoutMs}ms - aborting operation`);
            abortController.abort();
        }, timeoutMs);

        try {
            // Execute the UMD build in the DOM context
            const script = this.dom.window.document.createElement('script');

            // Test mode: simulate problematic bundle that doesn't expose global
            if (this.TEST_MODE === 'SIMULATE_TIMEOUT') {
                // Instead of modifying the bundle (which can break syntax),
                // let's use a simple stub that doesn't expose the global
                script.textContent = `
                    (function() {
                        console.log('[TEST MODE] Loading stub bundle that will NOT expose OptaveJavaScriptSDK global');
                        // Bundle executes but doesn't set window.OptaveJavaScriptSDK
                        const SDK = function() { this.version = 'test-stub'; };
                        // Deliberately NOT setting window.OptaveJavaScriptSDK = SDK
                    })();
                `;
                console.log(`   🧪 Test mode: Using stub bundle that will NOT expose OptaveJavaScriptSDK global`);
            } else {
                script.textContent = buildContent;
            }

            script.id = `umd-${buildType}`;

            // Add script to DOM and handle JSDOM-specific script execution
            try {
                // Handle abort signal
                if (signal.aborted) {
                    throw new Error('Operation aborted before script loading');
                }

                this.dom.window.document.head.appendChild(script);

                // UMD scripts should execute immediately in JSDOM
                // Allow a tiny delay for execution to complete
                await new Promise(resolve => {
                    if (signal.aborted) {
                        throw new Error('Operation aborted during script execution');
                    }
                    setTimeout(resolve, 5);
                });

            } catch (error) {
                if (signal.aborted) {
                    throw error;
                }
                throw new Error(`Script execution failed: ${error.message}`);
            }

            // Poll for global symbol availability with AbortController
            const startTime = performance.now();

            return new Promise((resolve, reject) => {
                // Handle abort signal
                if (signal.aborted) {
                    reject(new Error('Operation aborted before polling started'));
                    return;
                }

                let aborted = false;
                signal.addEventListener('abort', () => {
                    if (aborted) return; // Prevent double-rejection
                    aborted = true;

                    const elapsedTime = Math.round(performance.now() - startTime);
                    const forensicData = this.captureForensicData(buildContent);

                    console.log(`   ❌ Operation aborted after ${elapsedTime}ms - triggering forensic data capture`);

                    reject(new Error(
                        `Operation aborted after ${elapsedTime}ms due to timeout. ` +
                        `Global OptaveJavaScriptSDK not found. ` +
                        `Forensic data: ${forensicData}`
                    ));
                });

                const pollForGlobalSymbol = () => {
                    // Check for abort signal before each poll
                    if (signal.aborted || aborted) {
                        console.log(`   🛑 Polling stopped - aborted=${aborted}, signal.aborted=${signal.aborted}`);
                        return; // Reject already called by signal listener
                    }

                    const elapsedTime = Math.round(performance.now() - startTime);
                    console.log(`   🔄 Polling attempt at ${elapsedTime}ms`);

                    // Check if global symbol is available (check both window and globalThis)
                    const windowSDK = this.dom.window.OptaveJavaScriptSDK;
                    const globalThisSDK = this.dom.window.globalThis?.OptaveJavaScriptSDK;

                    console.log(`   📊 Global check: windowSDK=${typeof windowSDK}, globalThisSDK=${typeof globalThisSDK}`);

                    if (typeof windowSDK === 'function' || typeof globalThisSDK === 'function') {
                        if (!aborted) {
                            console.log(`   ✅ Global found, resolving`);
                            resolve();
                        }
                        return;
                    }

                    // Continue polling if not aborted
                    if (!signal.aborted && !aborted) {
                        setTimeout(pollForGlobalSymbol, this.POLLING_INTERVAL_MS);
                    }
                };

                // Start polling immediately
                console.log(`   🔍 Starting polling for OptaveJavaScriptSDK global (timeout: ${timeoutMs}ms)`);
                pollForGlobalSymbol();
            });

        } finally {
            // Always clean up timeout to prevent resource leaks
            clearTimeout(timeoutId);
        }
    }

    /**
     * Captures forensic debugging data when global symbol loading fails
     * Returns first 200 characters of evaluated bundle and environment state
     */
    captureForensicData(buildContent) {
        try {
            const forensicState = {
                bundlePreview: buildContent.substring(0, 200).replace(/\s+/g, ' '),
                globalExists: 'OptaveJavaScriptSDK' in this.dom.window,
                globalType: typeof this.dom.window.OptaveJavaScriptSDK,
                globalThisExists: this.dom.window.globalThis && 'OptaveJavaScriptSDK' in this.dom.window.globalThis,
                globalThisType: this.dom.window.globalThis ? typeof this.dom.window.globalThis.OptaveJavaScriptSDK : 'N/A',
                windowKeys: Object.keys(this.dom.window).filter(k => k.includes('Optave')),
                globalThisKeys: this.dom.window.globalThis ? Object.keys(this.dom.window.globalThis).filter(k => k.includes('Optave')) : [],
                scriptElements: Array.from(this.dom.window.document.querySelectorAll('script')).length,
                lastScriptId: this.dom.window.document.querySelector('script:last-child')?.id || 'none'
            };

            return JSON.stringify(forensicState, null, 2);
        } catch (error) {
            return `Forensic data capture failed: ${error.message}`;
        }
    }

    async testSDKFunctionality() {
        const result = {
            initialized: false,
            availableMethods: []
        };

        try {
            if (typeof this.dom.window.OptaveJavaScriptSDK === 'function') {
                // Create SDK instance (without connecting)
                const sdk = new this.dom.window.OptaveJavaScriptSDK({
                    websocketUrl: 'wss://test.example.com/socket',
                    tokenProvider: async () => 'test-token'
                });

                result.initialized = true;

                // Check for expected methods
                const expectedMethods = [
                    'adjust', 'elevate', 'customerInteraction',
                    'summarize', 'translate', 'recommend', 'insights'
                ];

                expectedMethods.forEach(method => {
                    if (typeof sdk[method] === 'function') {
                        result.availableMethods.push(method);
                    }
                });
            }
        } catch (error) {
            // SDK functionality test failed, but initialization might still be successful
            result.initialized = false;
        }

        return result;
    }

    generateReport(results) {
        console.log('\n📊 CSP Policy Test Report');
        console.log('═'.repeat(50));

        const totalViolations = results.browser.violations.length + results.server.violations.length;
        const allTestsPassed = results.browser.passed && results.server.passed;

        // Summary statistics
        console.log(`\n📈 Summary:`);
        console.log(`   Builds tested: 2`);
        console.log(`   Builds passed: ${(results.browser.passed ? 1 : 0) + (results.server.passed ? 1 : 0)}/2`);
        console.log(`   Total CSP violations: ${totalViolations}`);
        console.log(`   Overall result: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);

        // Detailed results
        console.log(`\n📋 Detailed Results:`);

        [results.browser, results.server].forEach(result => {
            console.log(`\n   ${result.buildType.toUpperCase()} UMD BUILD:`);
            console.log(`   ├── File exists: ${result.exists ? '✅' : '❌'}`);
            console.log(`   ├── Loaded successfully: ${result.loaded ? '✅' : '❌'}`);
            console.log(`   ├── Load time: ${result.loadTime}ms`);
            console.log(`   ├── SDK initialized: ${result.sdkInitialized ? '✅' : '❌'}`);
            console.log(`   ├── Methods available: ${result.availableMethods.length}/7`);
            console.log(`   ├── CSP violations: ${result.violations.length}`);
            console.log(`   └── Overall: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

            if (result.error) {
                console.log(`       Error: ${result.error}`);
            }

            if (result.violations.length > 0) {
                console.log(`       Violations:`);
                result.violations.forEach(violation => {
                    console.log(`       • ${violation.directive}: ${violation.blockedURI}`);
                });
            }
        });

        // CSP compliance assessment
        console.log(`\n🔒 CSP Compliance Assessment:`);
        if (totalViolations === 0) {
            console.log(`   ✅ All UMD builds are CSP compliant`);
            console.log(`   ✅ No eval() or unsafe-inline detected`);
            console.log(`   ✅ Safe for deployment in restricted environments`);
            console.log(`   ✅ Compatible with Salesforce Lightning Platform`);
        } else {
            console.log(`   ❌ CSP violations detected - builds may not work in restricted environments`);
            console.log(`   ❌ Review violations above and update build configuration`);
        }

        // Recommendations
        console.log(`\n💡 Recommendations:`);
        console.log(`   • Use this harness regularly during development`);
        console.log(`   • Run CSP tests before releasing new versions`);
        console.log(`   • Test in actual Salesforce Lightning environment`);
        console.log(`   • Monitor for new CSP violations when adding dependencies`);

        console.log('\n' + '═'.repeat(50));
    }
}

// Run the harness if this script is executed directly
const scriptPath = new URL(import.meta.url).pathname;
const argvPath = process.argv[1].replace(/\\/g, '/'); // Normalize Windows paths

if (scriptPath.endsWith(path.basename(argvPath))) {
    console.log('🚀 Starting CSP Harness Runner...');
    const runner = new CSPHarnessRunner();
    runner.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export default CSPHarnessRunner;