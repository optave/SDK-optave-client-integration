#!/usr/bin/env node

/*
 * Copyright (c) 2025 Optave AI Solutions Inc.
 * All rights reserved.
 *
 * This software and associated documentation files (the "Software") are the
 * proprietary and confidential information of Optave AI Solutions Inc.
 * Unauthorized copying, modification, distribution, or use of this Software
 * is strictly prohibited without express written permission.
 */

/**
 * Test Environment Setup
 * Configures test environments for all SDKs with proper environment variable management
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TestEnvironment {
    constructor() {
        this.envTemplate = {
            // Optave API Configuration
            OPTAVE__AUTH_URL: 'https://auth.optave.example.com',
            OPTAVE__WEBSOCKET_URL: 'wss://api.optave.example.com',
            OPTAVE__CLIENT_ID: 'test-client-id',
            OPTAVE__CLIENT_SECRET: 'test-client-secret',
            OPTAVE__ORGANIZATION_ID: 'test-org-id',
            OPTAVE__TENANT_ID: 'test-tenant-id',

            // Test Configuration
            NODE_ENV: 'test',
            VITEST_ENV: 'test',
            TEST_TIMEOUT: '10000',

            // Integration Test Flags
            SKIP_INTEGRATION_TESTS: 'false',
            INTEGRATION_TEST_MODE: 'mock',

            // Logging Configuration
            LOG_LEVEL: 'warn',
            DEBUG: 'false'
        };
    }

    async setupEnvironment(options = {}) {
        const { force = false, verbose = false } = options;

        console.log('🧪 Setting up test environment...');

        // Create environment files for each SDK
        await this.createSdkEnvironmentFiles(force, verbose);

        // Create global test environment file
        await this.createGlobalEnvironmentFile(force, verbose);

        // Setup test fixtures
        await this.setupTestFixtures(verbose);

        console.log('✅ Test environment setup completed');
    }

    async createSdkEnvironmentFiles(force, verbose) {
        const sdksDir = path.join(__dirname, '../../sdks');

        if (!fs.existsSync(sdksDir)) {
            if (verbose) console.log('⚠️  SDKs directory not found, skipping SDK environment setup');
            return;
        }

        const sdkDirs = fs.readdirSync(sdksDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const sdk of sdkDirs) {
            const sdkPath = path.join(sdksDir, sdk);
            const envPath = path.join(sdkPath, '.env.test');

            if (fs.existsSync(envPath) && !force) {
                if (verbose) console.log(`⏭️  Skipping ${sdk} - .env.test already exists`);
                continue;
            }

            // Create SDK-specific environment file
            const envContent = this.generateEnvContent(sdk);
            fs.writeFileSync(envPath, envContent);

            if (verbose) console.log(`✅ Created .env.test for ${sdk} SDK`);
        }
    }

    async createGlobalEnvironmentFile(force, verbose) {
        const globalEnvPath = path.join(__dirname, '../..', '.env.test');

        if (fs.existsSync(globalEnvPath) && !force) {
            if (verbose) console.log('⏭️  Skipping global .env.test - already exists');
            return;
        }

        const envContent = this.generateEnvContent('global');
        fs.writeFileSync(globalEnvPath, envContent);

        if (verbose) console.log('✅ Created global .env.test file');
    }

    generateEnvContent(context) {
        const header = `# Test Environment Configuration for ${context}
# Generated automatically - modify template in utils/tests/test-environment.js
#
# This file contains test credentials that are safe for development/testing.
# Do NOT use these values in production!

`;

        const envVars = Object.entries(this.envTemplate)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        return header + envVars + '\n';
    }

    async setupTestFixtures(verbose) {
        const fixturesDir = path.join(__dirname, 'fixtures');

        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
        }

        // Create mock server configuration
        const mockServerConfig = {
            websocket: {
                port: 8080,
                mockResponses: true,
                delays: {
                    connection: 100,
                    message: 50
                }
            },
            auth: {
                port: 8081,
                mockTokens: true,
                tokenExpiry: 3600
            }
        };

        fs.writeFileSync(
            path.join(fixturesDir, 'mock-server-config.json'),
            JSON.stringify(mockServerConfig, null, 2)
        );

        // Create test data fixtures
        const testPayloads = {
            validInteraction: {
                session: {
                    sessionId: "test-session-123"
                },
                request: {
                    connections: {
                        threadId: "test-thread-456"
                    },
                    context: {
                        organizationId: "test-org-id"
                    }
                }
            }
        };

        fs.writeFileSync(
            path.join(fixturesDir, 'test-payloads.json'),
            JSON.stringify(testPayloads, null, 2)
        );

        if (verbose) console.log('✅ Created test fixtures');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        force: args.includes('--force'),
        verbose: args.includes('--verbose')
    };

    const testEnv = new TestEnvironment();

    try {
        await testEnv.setupEnvironment(options);
        process.exit(0);
    } catch (error) {
        console.error('💥 Test environment setup failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    main();
}

export { TestEnvironment };