#!/usr/bin/env node

/**
 * Tree-shaking Validation Script
 * Validates that tree-shaking optimizations are working correctly
 * and enforces bundle size thresholds
 */

import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import {
  BUILD_ARTIFACTS,
  evaluateSize,
  validateTreeShaking,
  formatBytes
} from '../../../../scripts/config/build-governance.js';
import { UnifiedReporter, StatusReporter } from '../shared/report-utilities.js';

const DIST_DIR = './dist';

function validateBuild(artifactName, content, size) {
    const sizeEvaluation = evaluateSize(artifactName, size);
    const treeShakingValidation = validateTreeShaking(artifactName, content);

    const errors = [];
    const warnings = [];

    // Add size validation errors
    if (sizeEvaluation.level === 'error') {
        errors.push(...sizeEvaluation.messages);
    } else if (sizeEvaluation.level === 'warning') {
        warnings.push(...sizeEvaluation.messages);
    }

    // Add tree-shaking validation results
    errors.push(...treeShakingValidation.errors);
    warnings.push(...treeShakingValidation.warnings);

    return { errors, warnings, evaluation: sizeEvaluation };
}

function generateReport(results) {
    const reporter = new UnifiedReporter({ format: 'console' });

    reporter.header('🔍 Tree-shaking Validation Report');

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const [artifactName, result] of Object.entries(results)) {
        if (!result) continue;

        reporter.text(`\n📦 ${artifactName}:`);
        reporter.text(`   Size: ${formatBytes(result.size)}`);

        if (result.evaluation) {
            const { threshold, status } = result.evaluation;
            if (threshold) {
                const percentage = (result.size / threshold.error * 100).toFixed(1);
                const statusIcon = StatusReporter.getIcon(status);
                reporter.text(`   Threshold: ${statusIcon} ${percentage}% of ${formatBytes(threshold.error)} limit`);
            }
        }

        if (result.errors.length > 0) {
            reporter.text(`\n   ${StatusReporter.icons.ERROR} Errors:`);
            result.errors.forEach(error => reporter.text(`      • ${error}`));
            totalErrors += result.errors.length;
        }

        if (result.warnings.length > 0) {
            reporter.text(`\n   ${StatusReporter.icons.WARNING} Warnings:`);
            result.warnings.forEach(warning => reporter.text(`      • ${warning}`));
            totalWarnings += result.warnings.length;
        }

        if (result.errors.length === 0 && result.warnings.length === 0) {
            reporter.text(`   ${StatusReporter.icons.SUCCESS} All validations passed`);
        }
    }

    reporter.section('📊 Summary', 1);
    reporter.text(`   Total errors: ${totalErrors}`);
    reporter.text(`   Total warnings: ${totalWarnings}`);

    if (totalErrors > 0) {
        reporter.status('error', 'Tree-shaking validation FAILED');
        reporter.text('   Fix the errors above before proceeding');
        return false;
    } else if (totalWarnings > 0) {
        reporter.status('warning', 'Tree-shaking validation passed with warnings');
        reporter.text('   Consider addressing the warnings above');
        return true;
    } else {
        reporter.status('success', 'Tree-shaking validation PASSED');
        reporter.text('   All optimizations are working correctly');
        return true;
    }
}

async function main() {
    const reporter = new UnifiedReporter({ format: 'console' });
    reporter.status('info', 'Validating tree-shaking optimizations...');

    const results = {};

    for (const artifact of BUILD_ARTIFACTS) {
        const filePath = resolve(DIST_DIR, artifact.file.replace('dist/', ''));

        try {
            const stats = statSync(filePath);
            const content = readFileSync(filePath, 'utf8');

            const validation = validateBuild(artifact.name, content, stats.size);

            results[artifact.name] = {
                size: stats.size,
                errors: validation.errors,
                warnings: validation.warnings,
                evaluation: validation.evaluation
            };
        } catch (error) {
            reporter.status('warning', `Could not validate ${artifact.name}: ${error.message}`);
            results[artifact.name] = null;
        }
    }

    const success = generateReport(results);

    if (!success) {
        process.exit(1);
    }

    reporter.status('success', 'Tree-shaking validation complete!');
}

// Add this to package.json scripts: "validate:tree-shaking": "node scripts/analysis/validate-tree-shaking.js"
main().catch((error) => {
    const reporter = new UnifiedReporter({ format: 'console' });
    reporter.status('error', `Validation failed: ${error.message}`);
    process.exit(1);
});