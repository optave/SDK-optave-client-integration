import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { createUMDBase } from './webpack.shared.umd.base.js';
import path, { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import TerserPlugin from 'terser-webpack-plugin';

/**
 * Webpack Bundle Analyzer Configuration
 *
 * This configuration extends the standard UMD builds to include bundle analysis
 * capabilities for investigating bundle composition and optimization opportunities.
 *
 * Usage:
 *   npm run analyze:browser-umd
 *   npm run analyze:server-umd
 *   npm run analyze:all
 */

// Environment variables for controlling analysis
const ANALYZE_OPEN = process.env.ANALYZE_OPEN === 'true'; // Don't open browser by default
const ANALYZE_MODE = process.env.ANALYZE_MODE || 'static'; // 'server' | 'static' | 'json' | 'disabled'
const ANALYZE_PORT = parseInt(process.env.ANALYZE_PORT || '8888');

/**
 * Create analyzer configuration for a specific build target
 */
export function createAnalyzerConfig(buildTarget = 'server', options = {}, env = {}) {
    const {
        filename = `${buildTarget}.umd.analysis.js`,
        outputPath = `analysis/${buildTarget}`,
        reportsPath = `reports/analysis`, // Machine-readable reports go to reports directory
        minimize = false, // Don't minify for analysis by default to see clear module names
        ...otherOptions
    } = options;

    // Support both old minimize and new FULL environment variable systems
    // New system: FULL=1 means non-minified, otherwise minified
    // Old system: minimize=true means minified
    let shouldMinimize;
    if (env.minimize !== undefined) {
        // Old system for backward compatibility
        shouldMinimize = env.minimize === 'true' || env.minimize === true;
    } else {
        // New system: FULL=1 means non-minified, otherwise minified (default)
        const fullBuild = process.env.FULL === '1' || env.full === 'true' || env.full === true;
        // For analyzer, default to minified unless explicitly set to full
        shouldMinimize = !fullBuild;
    }

    // Ensure filename reflects build type for better differentiation
    const actualFilename = shouldMinimize ? filename.replace('.analysis.js', '.min.analysis.js') : filename.replace('.min.analysis.js', '.analysis.js');

    // Ensure the reports directory exists for analyzer output
    const reportsDir = resolve(reportsPath);
    if (!existsSync(reportsDir)) {
        mkdirSync(reportsDir, { recursive: true });
    }

    const baseConfig = createUMDBase({
        buildTarget,
        filename,
        minimize: shouldMinimize,
        ...otherOptions
    });

    // Override Terser configuration for analyzer builds to avoid plugin conflicts
    if (shouldMinimize && baseConfig.optimization && baseConfig.optimization.minimizer) {
        // Use Terser configuration that preserves build flags for analyzer builds
        baseConfig.optimization.minimizer = [
            new TerserPlugin({
                terserOptions: {
                    // Preserve build flags during minification
                    mangle: {
                        reserved: [
                            'globalThis',
                            'OptaveJavaScriptSDK',
                            'window',
                            'self',
                            'root',
                            'factory',
                            'webpackUniversalModuleDefinition',
                            '__WEBPACK_BUILD_TARGET__',
                            '__SALESFORCE_BUILD__',
                            '__SDK_VERSION__',
                            '__INCLUDE_WS_REQUIRE__'
                        ]
                    },
                    compress: {
                        drop_console: false,
                        unused: false,
                        side_effects: false,
                        // Preserve build target strings by disabling optimizations that could remove them
                        dead_code: false,
                        evaluate: false,
                        conditionals: false,
                        // Keep essential build information
                        keep_fnames: /^__(WEBPACK_BUILD_TARGET|SALESFORCE_BUILD|SDK_VERSION|INCLUDE_WS_REQUIRE)__|webpackUniversalModuleDefinition$/
                    },
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            })
        ];
    }

    return {
        ...baseConfig,
        output: {
            ...baseConfig.output,
            filename: actualFilename,
            path: path.resolve(`dist/${outputPath}`)
        },
        plugins: [
            ...baseConfig.plugins,
            new BundleAnalyzerPlugin({
                analyzerMode: ANALYZE_MODE,
                analyzerHost: 'localhost',
                analyzerPort: ANALYZE_PORT + (buildTarget === 'browser' ? 1 : 0), // Different ports for different builds
                openAnalyzer: ANALYZE_OPEN,
                generateStatsFile: true,
                statsFilename: path.resolve(`${reportsPath}/${buildTarget}-stats.json`),
                reportFilename: path.resolve(`${reportsPath}/${buildTarget}-report.html`),
                logLevel: 'info',
                // Custom bundle size analysis
                statsOptions: {
                    source: true,
                    chunks: true,
                    chunkModules: true,
                    modules: true,
                    modulesSpace: 999,
                    reasons: true,
                    usedExports: true,
                    providedExports: true,
                    optimizationBailout: true,
                    errorDetails: true,
                    publicPath: true,
                    exclude: false
                }
            })
        ]
    };
}

// Default exports for different build targets
export const browserAnalyzerConfig = createAnalyzerConfig('browser', {
    filename: 'browser.umd.analysis.js'
});

export const serverAnalyzerConfig = createAnalyzerConfig('server', {
    filename: 'server.umd.analysis.js'
});

export const serverMinAnalyzerConfig = createAnalyzerConfig('server', {
    filename: 'server.umd.min.analysis.js',
    minimize: true
});

// Default export for webpack CLI - function that accepts environment variables
export default (env = {}) => {
    const buildTarget = env.buildTarget || 'server';
    return createAnalyzerConfig(buildTarget, {
        filename: `${buildTarget}.umd.analysis.js`
    }, env);
};