#!/usr/bin/env node

/**
 * Verification script for analyzer minimize functionality
 *
 * This script tests that the serverMinAnalyzerConfig respects the minimize override
 * and produces different bundle sizes for minimized vs non-minimized builds.
 *
 * Usage:
 *   node scripts/verify-analyzer-minimize.js [--json]
 *
 * Options:
 *   --json    Output results in JSON format for machine parsing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist/analysis/server';
const ANALYSIS_FILE = 'server.umd.analysis.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isJsonOutput = args.includes('--json');

// Helper functions for error classification and output
class VerificationError extends Error {
    constructor(message, category, details = null) {
        super(message);
        this.category = category;
        this.details = details;
    }
}

/**
 * Safely reads file size with proper error handling
 */
function safeReadFileSize(filePath, context) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new VerificationError(
                `${context} file was not created at expected path: ${filePath}`,
                'FILE_MISSING',
                { expectedPath: filePath, context }
            );
        }

        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            throw new VerificationError(
                `Expected file but found directory at: ${filePath}`,
                'INVALID_FILE_TYPE',
                { path: filePath, context }
            );
        }

        return stats.size;
    } catch (error) {
        if (error instanceof VerificationError) {
            throw error;
        }

        // Handle filesystem access errors
        throw new VerificationError(
            `Failed to read ${context.toLowerCase()} file size: ${error.message}`,
            'FILESYSTEM_ERROR',
            { path: filePath, context, originalError: error.message }
        );
    }
}

/**
 * Executes webpack build with enhanced error handling
 */
function executeBuild(command, context, env = {}) {
    try {
        const result = execSync(command, {
            stdio: 'pipe',
            cwd: process.cwd(),
            env: { ...process.env, ...env },
            encoding: 'utf8'
        });
        return result;
    } catch (error) {
        const errorDetails = {
            command,
            context,
            exitCode: error.status,
            stderr: error.stderr ? error.stderr.toString() : 'No stderr output',
            stdout: error.stdout ? error.stdout.toString() : 'No stdout output'
        };

        throw new VerificationError(
            `${context} build failed: ${error.message}`,
            'BUILD_FAILURE',
            errorDetails
        );
    }
}

/**
 * Outputs results in the specified format
 */
function outputResults(results) {
    if (isJsonOutput) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        const { unminifiedSize, minifiedSize, sizeReduction, percentReduction, success, message } = results;

        console.log(`\n📊 Size Analysis:`);
        console.log(`   Unminified: ${(unminifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Minified:   ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Reduction:  ${(sizeReduction / 1024).toFixed(2)} KB (${percentReduction.toFixed(1)}%)`);

        if (success) {
            console.log(`\n✅ SUCCESS: ${message}`);
        } else {
            console.log(`\n❌ FAILURE: ${message}`);
        }
    }
}

if (!isJsonOutput) {
    console.log('🔍 Verifying analyzer minimize functionality...\n');
}

// Clean up any existing analysis files
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}

try {
    // Test 1: Build with minimize=false
    if (!isJsonOutput) {
        console.log('📦 Building analyzer output with minimize=false...');
    }

    executeBuild(
        'npx webpack --config webpack.analyzer.config.js --env buildTarget=server --env minimize=false',
        'Unminified analysis',
        {
            ANALYZE_MODE: 'static',
            ANALYZE_PORT: '8893'
        }
    );

    const unminifiedPath = path.join(DIST_DIR, ANALYSIS_FILE);
    const unminifiedSize = safeReadFileSize(unminifiedPath, 'Unminified analysis');

    if (!isJsonOutput) {
        console.log(`✅ Unminified bundle: ${(unminifiedSize / 1024).toFixed(2)} KB`);
    }

    // Clean up for next test
    try {
        fs.rmSync(unminifiedPath);
    } catch (cleanupError) {
        throw new VerificationError(
            `Failed to clean up unminified file: ${cleanupError.message}`,
            'CLEANUP_FAILURE',
            { path: unminifiedPath, originalError: cleanupError.message }
        );
    }

    // Test 2: Build with minimize=true
    if (!isJsonOutput) {
        console.log('🗜️  Building analyzer output with minimize=true...');
    }

    executeBuild(
        'npx webpack --config webpack.analyzer.config.js --env buildTarget=server --env minimize=true',
        'Minified analysis',
        {
            ANALYZE_MODE: 'static',
            ANALYZE_PORT: '8894'
        }
    );

    const minifiedPath = path.join(DIST_DIR, ANALYSIS_FILE);
    const minifiedSize = safeReadFileSize(minifiedPath, 'Minified analysis');

    if (!isJsonOutput) {
        console.log(`✅ Minified bundle: ${(minifiedSize / 1024).toFixed(2)} KB`);
    }

    // Calculate size reduction metrics
    const sizeReduction = unminifiedSize - minifiedSize;
    const percentReduction = ((sizeReduction / unminifiedSize) * 100);

    // Validate results
    let success = true;
    let message = `Analyzer minimize functionality is working correctly! The minimize option produces a ${percentReduction.toFixed(1)}% size reduction.`;
    let warnings = [];

    if (sizeReduction <= 0) {
        success = false;
        message = 'Minified bundle is not smaller than unminified bundle - minimize option is not working';
        throw new VerificationError(message, 'MINIFICATION_INEFFECTIVE', {
            unminifiedSize,
            minifiedSize,
            sizeReduction,
            percentReduction
        });
    }

    if (percentReduction < 20) {
        warnings.push(`Size reduction is only ${percentReduction.toFixed(1)}% - this seems low for minification`);
        if (!isJsonOutput) {
            console.warn(`⚠️  ${warnings[0]}`);
        }
    }

    // Prepare results object
    const results = {
        success,
        message,
        timestamp: new Date().toISOString(),
        unminifiedSize,
        minifiedSize,
        sizeReduction,
        percentReduction: Math.round(percentReduction * 10) / 10, // Round to 1 decimal
        unminifiedSizeKB: Math.round((unminifiedSize / 1024) * 100) / 100,
        minifiedSizeKB: Math.round((minifiedSize / 1024) * 100) / 100,
        sizeReductionKB: Math.round((sizeReduction / 1024) * 100) / 100,
        warnings,
        buildConfig: {
            distDir: DIST_DIR,
            analysisFile: ANALYSIS_FILE,
            unminifiedEnv: { ANALYZE_MODE: 'static', ANALYZE_PORT: '8893' },
            minifiedEnv: { ANALYZE_MODE: 'static', ANALYZE_PORT: '8894' }
        }
    };

    outputResults(results);

} catch (error) {
    const isVerificationError = error instanceof VerificationError;

    const errorResult = {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
        error: {
            category: isVerificationError ? error.category : 'UNKNOWN_ERROR',
            details: isVerificationError ? error.details : null,
            stack: error.stack
        }
    };

    if (isJsonOutput) {
        console.log(JSON.stringify(errorResult, null, 2));
    } else {
        console.error(`\n❌ FAILURE: ${error.message}`);
        if (isVerificationError && error.details) {
            console.error(`Category: ${error.category}`);
            if (error.details.stderr) {
                console.error(`Build stderr: ${error.details.stderr}`);
            }
        }
    }

    process.exit(1);
}