#!/usr/bin/env node

/**
 * Schema Drift Guard
 *
 * CI-only validation script that ensures generated schemas remain aligned
 * with the AsyncAPI specification. Detects schema drift that could cause
 * validation inconsistencies between development environments.
 *
 * This guard loads full AJV validators (even in environments where production
 * builds use lightweight validators) and validates against the source AsyncAPI
 * specification to ensure schema integrity.
 *
 * Environment Variables:
 * - SCHEMA_DRIFT_FRESH_IMPORTS=true: Force fresh imports with cache busting
 *   to bypass ESM module caching. Useful after schema regeneration.
 *
 * ESM Caching Notes:
 * - The guard automatically detects file changes and uses cache-busting imports
 * - For guaranteed fresh imports after schema regeneration, restart Node.js process
 * - File modification time tracking prevents unnecessary cache busting in CI
 */

import { readFileSync, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths relative to the script location
// Script directory: sdks/javascript/scripts/dev/validation
// SDK root: three levels up from here (../../.. from scripts/dev/validation)
const SDK_ROOT = path.resolve(__dirname, '../../..');
// Repo root: two levels up from SDK root (sdks/javascript -> sdks -> repo root)
const REPO_ROOT = path.resolve(SDK_ROOT, '../..');

// Import safeExit from repo root utils (5 levels up: validation -> dev -> scripts -> javascript -> sdks -> repo root)
const safeExitModule = await import(pathToFileURL(path.join(REPO_ROOT, 'utils/scripts/utils/safe-exit.js')).href);
const { safeExit } = safeExitModule;

const CANDIDATE_SPEC_PATHS = [
  path.resolve(REPO_ROOT, 'config/specs/asyncapi.yaml'),  // Correct: repo root has config/specs/
  path.resolve(process.cwd(), 'config/specs/asyncapi.yaml'),
  path.resolve(SDK_ROOT, 'config/specs/asyncapi.yaml'), // fallback (unlikely)
];
const ASYNCAPI_SPEC_PATH = CANDIDATE_SPEC_PATHS.find(p => existsSync(p)) || CANDIDATE_SPEC_PATHS[0];
// Correct locations inside SDK root
const GENERATED_VALIDATORS_PATH = path.join(SDK_ROOT, 'generated/validators.js');
const BROWSER_VALIDATORS_PATH = path.join(SDK_ROOT, 'runtime/platform/browser/validators.js');

// Schema validation test cases - representative payloads for each action
const TEST_PAYLOADS = {
  MessageEnvelope: {
    action: 'message',
    headers: {
      correlationId: '01997e6f-03b0-71ae-8ea3-435b459a9b3b',
      action: 'adjust',
      schemaRef: 'optave.message.v3',
      identifier: 'message',
      timestamp: '2024-01-15T10:30:00.000Z',
      issuedAt: '2024-01-15T10:30:00.000Z',
    },
    payload: {
      session: {
        sessionId: 'test-session-123',
        channel: {
          medium: 'chat',
          language: 'en',
        },
        interface: {
          name: 'salesforce',
          category: 'crm',
        },
      },
      request: {
        requestId: 'req-123',
        connections: {
          threadId: 'thread-123',
        },
        context: {
          organizationId: 'org-123',
        },
        scope: {
          conversations: [
            {
              conversationId: 'conv-123',
              participants: [
                {
                  participantId: 'user-123',
                  displayName: 'Test User',
                  role: 'user',
                },
              ],
              messages: [
                {
                  content: 'Test message',
                  participantId: 'user-123',
                  timestamp: '2024-01-15T10:30:00.000Z',
                },
              ],
            },
          ],
        },
      },
    },
  },
  ResponseEnvelope: {
    action: 'message',
    headers: {
      correlationId: '01997e6f-03b0-71ae-8ea3-435b459a9b3b',
      action: 'adjust',
      schemaRef: 'optave.response.v3',
      identifier: 'message',
      timestamp: '2024-01-15T10:30:00.000Z',
      issuedAt: '2024-01-15T10:30:00.000Z',
    },
    payload: {
      action: 'superpower',
      actionType: 'adjust_suggestion',
      state: 'completed',
      message: {
        results: [
          {
            response: [
              {
                content: 'Adjusted response',
              },
            ],
          },
        ],
      },
    },
  },
  Payload: {
    session: {
      sessionId: 'test-session-123',
      channel: {
        medium: 'chat',
        language: 'en',
      },
      interface: {
        name: 'salesforce',
        category: 'crm',
      },
    },
    request: {
      requestId: 'req-123',
      connections: {
        threadId: 'thread-123',
      },
      context: {
        organizationId: 'org-123',
      },
    },
  },
};

/**
 * Extracts version information from various sources
 */
class VersionExtractor {
  /**
   * Extract version from AsyncAPI spec
   */
  static extractSpecVersion(spec) {
    return spec?.info?.version || 'unknown';
  }

  /**
   * Extract version from generated validators file content
   */
  static extractValidatorsVersion(filePath) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const versionMatch = content.match(/info\.version:\s*([0-9.]+)/);
      return versionMatch ? versionMatch[1] : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Extract version from package.json
   */
  static extractPackageVersion(packageJsonPath) {
    try {
      const content = readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      return packageJson.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

/**
 * Enhanced ModuleImporter with ESM cache management and robust error handling
 *
 * Addresses ESM module caching issues that can prevent loading regenerated schemas
 * by providing cache-busting mechanisms and file modification time tracking.
 */
class ModuleImporter {
  // Static cache tracking for file modification times and import timestamps
  static _importTimes = new Map();
  static _fileStats = new Map();

  /**
   * Import a module with optional ESM cache management
   * @param {string} modulePath - Absolute path to the module
   * @param {string} description - Human-readable description of the module for error context
   * @param {object} options - Import options
   * @param {boolean} options.bustCache - Force fresh import with cache-busting query parameters
   * @param {boolean} options.checkFileTime - Check file modification time to detect changes
   * @returns {Promise<any>} - The imported module
   */
  static async importModule(modulePath, description, options = {}) {
    const { bustCache = process.env.SCHEMA_DRIFT_FRESH_IMPORTS === 'true', checkFileTime = true } =
      options;

    try {
      let shouldBustCache = bustCache;

      // Check file modification time if requested and cache busting isn't already enabled
      if (checkFileTime && !shouldBustCache) {
        try {
          const stats = await stat(modulePath);
          const lastImportTime = this._importTimes.get(modulePath);
          const lastFileTime = this._fileStats.get(modulePath);

          // Force fresh import if file is newer than last import or never imported before
          if (!lastImportTime || !lastFileTime || stats.mtime.getTime() > lastFileTime) {
            shouldBustCache = true;
            this._fileStats.set(modulePath, stats.mtime.getTime());
          }
        } catch (statError) {
          // If we can't stat the file, proceed without cache busting but warn
          console.warn(
            `[ModuleImporter] Warning: Could not stat ${modulePath}: ${statError.message}`
          );
        }
      }

      // Create module URL with proper Windows path handling
      const moduleUrl = pathToFileURL(modulePath).href;

      // Add cache-busting query parameters if needed to force fresh import
      const finalUrl = shouldBustCache
        ? `${moduleUrl}?_cache_bust=${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
        : moduleUrl;

      // Track import timing for cache management
      if (shouldBustCache) {
        this._importTimes.set(modulePath, Date.now());
        console.log(`[ModuleImporter] Fresh import (cache bust): ${description}`);
      }

      const module = await import(finalUrl);
      return module;
    } catch (error) {
      const enhancedError = new Error(
        `Failed to import ${description} from '${modulePath}': ${error.message}\n` +
          `  ESM Import Troubleshooting:\n` +
          `  - Check if the file exists and is accessible\n` +
          `  - Verify the module has valid ES module syntax\n` +
          `  - Ensure no circular dependencies exist\n` +
          `  - If schema was recently regenerated, try setting SCHEMA_DRIFT_FRESH_IMPORTS=true\n` +
          `  - For persistent cache issues, restart the Node.js process\n` +
          `  - Cache management: checkFileTime=${options.checkFileTime || true}, bustCache=${
            options.bustCache || false
          }\n` +
          `  - Original error: ${error.stack}`
      );
      enhancedError.cause = error;
      enhancedError.modulePath = modulePath;
      enhancedError.description = description;
      throw enhancedError;
    }
  }

  /**
   * Clear import tracking cache (useful for tests and development)
   */
  static clearImportCache() {
    this._importTimes.clear();
    this._fileStats.clear();
    console.log('[ModuleImporter] Import cache cleared');
  }

  /**
   * Get import statistics for debugging ESM cache behavior
   * @returns {object} Import statistics including tracked modules and timing data
   */
  static getImportStats() {
    return {
      trackedModules: this._importTimes.size,
      imports: Array.from(this._importTimes.entries()).map(([path, time]) => ({
        path,
        importTime: new Date(time).toISOString(),
        timeSinceImport: Date.now() - time,
      })),
      fileStats: Array.from(this._fileStats.entries()).map(([path, mtime]) => ({
        path,
        lastModified: new Date(mtime).toISOString(),
        ageSinceModification: Date.now() - mtime,
      })),
    };
  }
}

class SchemaDriftGuard {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.specVersion = null;
    this.generatedValidators = null;
    this.browserValidators = null;
    this.generatedValidatorsVersion = null;
    this.packageVersion = null;
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (level === 'error') {
      console.error(`${prefix} ${message}`);
      this.errors.push(message);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`);
      this.warnings.push(message);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  async loadAsyncAPISpec() {
    try {
      this.log('info', 'Loading AsyncAPI specification...');
      this.log('info', `  Spec path: ${ASYNCAPI_SPEC_PATH}`);

      const specContent = readFileSync(ASYNCAPI_SPEC_PATH, 'utf8');
      const spec = yaml.parse(specContent);

      this.specVersion = VersionExtractor.extractSpecVersion(spec);
      this.log('info', `  AsyncAPI spec version: ${this.specVersion}`);

      return spec;
    } catch (error) {
      const contextualError = new Error(
        `Failed to load AsyncAPI specification: ${error.message}\n` +
          `  - Spec path: ${ASYNCAPI_SPEC_PATH}\n` +
          `  - Check if the file exists and contains valid YAML\n` +
          `  - Verify the AsyncAPI spec has proper structure with info.version`
      );
      contextualError.cause = error;
      this.log('error', contextualError.message);
      throw contextualError;
    }
  }

  async loadGeneratedValidators() {
    try {
      this.log('info', 'Loading generated AJV validators...');
      this.log('info', `  Validators path: ${GENERATED_VALIDATORS_PATH}`);

      // Use enhanced import with ESM cache management
      // Automatically detects file changes and uses cache busting for regenerated schemas
      this.generatedValidators = await ModuleImporter.importModule(
        GENERATED_VALIDATORS_PATH,
        'generated AJV validators',
        {
          checkFileTime: true, // Check if validators were regenerated
          bustCache: process.env.NODE_ENV === 'development', // Fresh imports in dev mode
        }
      );

      // Extract version using centralized logic
      this.generatedValidatorsVersion =
        VersionExtractor.extractValidatorsVersion(GENERATED_VALIDATORS_PATH);
      this.log('info', `  Generated validators version: ${this.generatedValidatorsVersion}`);

      // Validate that we got expected exports
      if (!this.generatedValidators || typeof this.generatedValidators !== 'object') {
        throw new Error('Generated validators module did not export expected object structure');
      }

      this.log('info', `  Successfully loaded generated validators`);
      return this.generatedValidators;
    } catch (error) {
      // Enhanced error already created by ModuleImporter, just re-throw
      throw error;
    }
  }

  async loadBrowserValidators() {
    try {
      this.log('info', 'Loading browser platform validators...');
      this.log('info', `  Browser validators path: ${BROWSER_VALIDATORS_PATH}`);

      // Use enhanced import with ESM cache management
      this.browserValidators = await ModuleImporter.importModule(
        BROWSER_VALIDATORS_PATH,
        'browser platform validators',
        {
          checkFileTime: true, // Check if browser validators were updated
          bustCache: false, // Browser validators change less frequently
        }
      );

      // Validate that we got expected exports
      if (!this.browserValidators || typeof this.browserValidators !== 'object') {
        throw new Error('Browser validators module did not export expected object structure');
      }

      // Check for expected validator functions
      const expectedFunctions = ['validatePayload'];
      const missingFunctions = expectedFunctions.filter(
        fn => typeof this.browserValidators[fn] !== 'function'
      );

      if (missingFunctions.length > 0) {
        throw new Error(
          `Browser validators missing expected functions: ${missingFunctions.join(', ')}\n` +
            `Available exports: ${Object.keys(this.browserValidators).join(', ')}`
        );
      }

      this.log('info', `  Successfully loaded browser validators`);
      return this.browserValidators;
    } catch (error) {
      // Enhanced error already created by ModuleImporter, just re-throw
      throw error;
    }
  }

  validateGeneratedSchemas() {
    this.log('info', 'Validating generated schemas against test payloads...');

    const validators = this.generatedValidators;
    let validationCount = 0;
    let failureCount = 0;

    for (const [schemaName, testPayload] of Object.entries(TEST_PAYLOADS)) {
      try {
        validationCount++;

        // Get validator function
        const validateFunction = validators[`validate${schemaName}`];
        if (!validateFunction) {
          this.log('error', `Missing validator function: validate${schemaName}`);
          failureCount++;
          continue;
        }

        // Run validation
        const result = validateFunction(testPayload);

        if (!result.valid) {
          this.log('error', `Schema validation failed for ${schemaName}`);
          this.log('error', `  Validator function: validate${schemaName}`);
          this.log('error', `  Test payload keys: ${Object.keys(testPayload).join(', ')}`);

          if (result.errors && result.errors.length > 0) {
            this.log('error', `  Validation errors (${result.errors.length} total):`);
            result.errors.forEach((error, index) => {
              this.log(
                'error',
                `    ${index + 1}. ${error.instancePath || 'root'}: ${error.message}`
              );
              if (error.keyword) {
                this.log('error', `       Keyword: ${error.keyword}`);
              }
              if (error.schemaPath) {
                this.log('error', `       Schema path: ${error.schemaPath}`);
              }
            });
          } else {
            this.log('error', `  No detailed error information available from validator`);
          }
          failureCount++;
        } else {
          this.log('info', `✅ Schema validation passed for ${schemaName}`);
        }
      } catch (error) {
        this.log('error', `Exception during ${schemaName} validation: ${error.message}`);
        failureCount++;
      }
    }

    this.log(
      'info',
      `Schema validation summary: ${validationCount - failureCount}/${validationCount} passed`
    );
    return failureCount === 0;
  }

  validateBrowserCompatibility() {
    this.log('info', 'Validating browser validator compatibility...');

    const generatedValidators = this.generatedValidators;
    const browserValidators = this.browserValidators;
    let compatibilityIssues = 0;

    // Test each payload against both validator systems
    for (const [schemaName, testPayload] of Object.entries(TEST_PAYLOADS)) {
      if (schemaName !== 'Payload') continue; // Browser validators only handle Payload

      try {
        // Generated AJV validation
        const ajvResult = generatedValidators.validatePayload(testPayload);

        // Browser validation
        const browserResult = browserValidators.validatePayload(testPayload);

        // Compare results
        if (ajvResult.valid !== browserResult.valid) {
          this.log(
            'error',
            `Validation mismatch for ${schemaName}: AJV=${ajvResult.valid}, Browser=${browserResult.valid}`
          );
          compatibilityIssues++;
        } else {
          this.log('info', `✅ Browser compatibility verified for ${schemaName}`);
        }
      } catch (error) {
        this.log(
          'error',
          `Exception during browser compatibility test for ${schemaName}: ${error.message}`
        );
        compatibilityIssues++;
      }
    }

    this.log('info', `Browser compatibility summary: ${compatibilityIssues} issues found`);
    return compatibilityIssues === 0;
  }

  checkVersionConsistency() {
    this.log('info', 'Checking version consistency across components...');

    let versionIssues = 0;

    try {
      // Extract package version using centralized logic
      const packageJsonPath = path.join(SDK_ROOT, 'package.json');
      this.packageVersion = VersionExtractor.extractPackageVersion(packageJsonPath);

      this.log('info', `  AsyncAPI spec version: ${this.specVersion}`);
      this.log('info', `  Package.json version: ${this.packageVersion}`);
      this.log('info', `  Generated validators version: ${this.generatedValidatorsVersion}`);

      // Check AsyncAPI spec vs package.json
      if (this.specVersion !== this.packageVersion) {
        this.log(
          'warn',
          `Version mismatch: AsyncAPI spec (${this.specVersion}) vs package.json (${this.packageVersion})`
        );
        versionIssues++;
      } else {
        this.log('info', `  ✅ AsyncAPI spec and package.json versions match: ${this.specVersion}`);
      }

      // Check generated validators vs spec version
      if (
        this.generatedValidatorsVersion !== this.specVersion &&
        this.generatedValidatorsVersion !== 'unknown'
      ) {
        this.log(
          'warn',
          `Version mismatch: Generated validators (${this.generatedValidatorsVersion}) vs AsyncAPI spec (${this.specVersion})`
        );
        versionIssues++;
      } else if (this.generatedValidatorsVersion !== 'unknown') {
        this.log(
          'info',
          `  ✅ Generated validators and AsyncAPI spec versions match: ${this.generatedValidatorsVersion}`
        );
      } else {
        this.log('warn', `  ⚠️  Could not extract version from generated validators`);
      }

      if (versionIssues === 0) {
        this.log('info', `✅ All version consistency checks passed`);
      }
    } catch (error) {
      const contextualError = new Error(
        `Failed to check version consistency: ${error.message}\n` +
          `  - Check if package.json exists and is readable\n` +
          `  - Verify version extraction patterns are correct`
      );
      this.log('error', contextualError.message);
      versionIssues++;
    }

    return versionIssues === 0;
  }

  checkAvailableValidators() {
    this.log('info', 'Checking available validator functions...');

    const expectedValidators = [
      'validate',
      'validateMessageEnvelope',
      'validateResponseEnvelope',
      'validatePayload',
      'validateSuperpowerResponse',
      'validateErrorResponse',
    ];

    let missingValidators = 0;

    for (const validatorName of expectedValidators) {
      if (typeof this.generatedValidators[validatorName] !== 'function') {
        this.log('error', `Missing validator function: ${validatorName}`);
        missingValidators++;
      } else {
        this.log('info', `✅ Validator function available: ${validatorName}`);
      }
    }

    // Check available validators list
    if (this.generatedValidators.availableValidators) {
      const availableCount = this.generatedValidators.availableValidators.length;
      this.log('info', `Total available validators: ${availableCount}`);
      this.log(
        'info',
        `Available validators: ${this.generatedValidators.availableValidators.join(', ')}`
      );
    } else {
      this.log('warn', 'availableValidators list not found in generated validators');
    }

    return missingValidators === 0;
  }

  async run() {
    this.log('info', 'Starting Schema Drift Guard validation...');

    // Log ESM cache management configuration
    const freshImportsEnabled = process.env.SCHEMA_DRIFT_FRESH_IMPORTS === 'true';
    const nodeEnv = process.env.NODE_ENV || 'unset';
    this.log('info', `ESM Cache Management Configuration:`);
    this.log('info', `  SCHEMA_DRIFT_FRESH_IMPORTS: ${freshImportsEnabled}`);
    this.log('info', `  NODE_ENV: ${nodeEnv}`);
    this.log('info', `  File modification time checking: enabled`);
    if (freshImportsEnabled) {
      this.log('info', '  → Fresh imports will be forced with cache-busting query parameters');
    }

    try {
      // Load all components
      await this.loadAsyncAPISpec();
      await this.loadGeneratedValidators();
      await this.loadBrowserValidators();

      // Run all validation checks
      const checks = [
        this.checkVersionConsistency(),
        this.checkAvailableValidators(),
        this.validateGeneratedSchemas(),
        this.validateBrowserCompatibility(),
      ];

      const allPassed = checks.every(check => check === true);

      // Final summary
      this.log('info', '');
      this.log('info', '=== SCHEMA DRIFT GUARD SUMMARY ===');
      this.log('info', `Errors: ${this.errors.length}`);
      this.log('info', `Warnings: ${this.warnings.length}`);

      // Log import statistics for debugging ESM cache behavior
      const importStats = ModuleImporter.getImportStats();
      this.log('info', `ESM Import Statistics:`);
      this.log('info', `  Tracked modules: ${importStats.trackedModules}`);
      if (importStats.imports.length > 0) {
        this.log('info', `  Fresh imports performed: ${importStats.imports.length}`);
        importStats.imports.forEach(({ path, importTime }) => {
          const fileName = path.split(/[/\\]/).pop();
          this.log('info', `    ${fileName}: ${importTime}`);
        });
      } else {
        this.log('info', `  No fresh imports needed (using cached modules)`);
      }

      if (allPassed && this.errors.length === 0) {
        this.log('info', '✅ All schema validation checks passed');
        this.log('info', '✅ No schema drift detected');
        return 0; // Success exit code
      } else {
        this.log('error', '❌ Schema validation failed');
        if (this.errors.length > 0) {
          this.log('error', 'Errors found:');
          this.errors.forEach(error => this.log('error', `  - ${error}`));
        }
        return 1; // Error exit code
      }
    } catch (error) {
      this.log('error', `Schema drift guard failed: ${error.message}`);
      return 1;
    }
  }
}

// Run the schema drift guard if this script is executed directly
const scriptPath = fileURLToPath(import.meta.url);
const isMainModule =
  process.argv[1] &&
  (process.argv[1] === scriptPath || process.argv[1].endsWith('schema-drift-guard.js'));

if (isMainModule) {
  const guard = new SchemaDriftGuard();
  guard
    .run()
    .then(exitCode => {
      safeExit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      safeExit(1);
    });
}

export default SchemaDriftGuard;
export { VersionExtractor, ModuleImporter };
