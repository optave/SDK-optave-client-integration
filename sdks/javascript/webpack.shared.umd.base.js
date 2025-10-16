import path from 'path';
import webpack from 'webpack';
import { readFileSync } from 'fs';
import TerserPlugin from 'terser-webpack-plugin';
import { BUILD_TARGETS } from './runtime/core/build-targets.js';
import { umdAliases, browserUmdAliases, fallbackUMD, fallbackBrowserUMD, fallbackServerUMD } from './scripts/prod/webpack/aliases.js';
import { LWSStrictModeRemovalPlugin } from './scripts/prod/webpack/lws-strict-mode-plugin.js';

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));

// Shared UMD base (browser + server)
export const createUMDBase = (options = {}) => {
    const {
        buildTarget = 'browser', // 'browser' or 'server' (legacy)
        filename = 'build.umd.js',
        // Note: Uses 'minimize' as parameter name (not 'shouldMinify' like standalone configs)
        // This follows webpack's standard terminology for reusable factory functions
        // Standalone configs compute their own minification logic and pass it here
        minimize = false,
        salesforceBuild = false
    } = options;

    // Convert legacy build target to specific UMD build target
    const umdBuildTarget = buildTarget === 'browser'
        ? BUILD_TARGETS.BROWSER_UMD
        : BUILD_TARGETS.SERVER_UMD;

    return {
        entry: './runtime/core/umd-entry.js',
        target: 'web', // UMD must target web environment for browser/Salesforce compatibility

        output: {
            filename,
            path: path.resolve('dist'),
            // Traditional UMD wrapper for Salesforce Lightning compatibility
            library: 'OptaveJavaScriptSDK',
            libraryTarget: 'umd', // Use traditional libraryTarget for (function(root, factory) wrapper
            libraryExport: 'default',
            umdNamedDefine: true, // Named AMD define for Salesforce compatibility
            environment: {
                module: false,
            },
            globalObject: buildTarget === 'browser'
                ? '(function() { return typeof globalThis !== \'undefined\' ? globalThis : (typeof self !== \'undefined\' ? self : (typeof window !== \'undefined\' ? window : this)); })()'
                : '(function() { return typeof globalThis !== \'undefined\' ? globalThis : (typeof window !== \'undefined\' ? window : this); })()',
            publicPath: '',
        },

        mode: 'production',
        // External source maps for CSP compliance and debugging
        // source-map generates external .map files (required for Salesforce Lightning CSP)
        devtool: 'source-map',

        // Lightning Web Security Compliance: Avoid explicit "use strict" injection
        // Server UMD must be completely self-contained with no externals for Salesforce deployment
        externals: {}, // IMPORTANT: Empty = self-contained (do not add external dependencies)

        resolve: {
            // Ensure webpack can resolve all modules
            modules: ['node_modules'],
            extensions: ['.js', '.mjs', '.json'],
            // Use centralized alias configuration based on build target
            alias: buildTarget === 'browser' ? browserUmdAliases : umdAliases,
            fallback: buildTarget === 'browser' ? fallbackBrowserUMD : fallbackServerUMD
        },

        module: {
            rules: [
                // No transpilation needed - target browsers and Node.js support ES6+ natively
            ],
        },

        plugins: [
            new webpack.DefinePlugin({
                __WEBPACK_BUILD_TARGET__: JSON.stringify(umdBuildTarget), // Accurate UMD build target (browser-umd or server-umd)
                __INCLUDE_WS_REQUIRE__: false, // Disable WebSocket require for browser environment
                __SDK_VERSION__: JSON.stringify(packageJson.version),
                __SALESFORCE_BUILD__: salesforceBuild, // Server UMD is specifically for Salesforce deployment
                // Browser builds should not have process.versions.node references
                // Provide minimal process object for third-party library compatibility
                ...(buildTarget === 'browser' && {
                    'process.versions.node': 'undefined',
                    'process.version': 'undefined',
                    'process.env': '{}',
                    'process.versions': '{}'
                })
            }),

            // Provide browser APIs for UMD builds
            new webpack.ProvidePlugin({
                URLSearchParams: [path.resolve('./runtime/platform/browser/urlsearchparams-polyfill.js'), 'URLSearchParams'],
            }),

            // Browser builds: Replace AJV with CSP-safe validators
            ...(buildTarget === 'browser' ? [
                new webpack.NormalModuleReplacementPlugin(/ajv/, path.resolve('./runtime/platform/browser/ajv-stub.js'))
            ] : []),

            // LIGHTNING WEB SECURITY COMPLIANCE: Remove explicit "use strict" declarations
            new LWSStrictModeRemovalPlugin({
                verbose: process.env.NODE_ENV === 'development' || process.env.VERBOSE_BUILD === '1'
            }),
        ],

        optimization: {
            minimize, // Enable/disable minification based on build type
            // Simplified optimization settings for source map generation
            splitChunks: false, // Single file UMD bundle

            // ALWAYS configure TerserPlugin for license extraction (even in non-minified builds)
            // This ensures legal compliance regardless of build type
            minimizer: [
                new TerserPlugin({
                    minify: minimize ? TerserPlugin.terserMinify : undefined,
                    terserOptions: minimize ? {
                        // Salesforce Lightning compatible minification settings
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
                            // Preserve build flags and UMD wrapper structure
                            unused: false,
                            side_effects: false,
                            // Keep essential build information
                            keep_fnames: /^__(WEBPACK_BUILD_TARGET|SALESFORCE_BUILD|SDK_VERSION|INCLUDE_WS_REQUIRE)__|webpackUniversalModuleDefinition$/,
                            drop_console: false
                        },
                        format: {
                            // Keep critical comments and preserve UMD format
                            comments: /SECURITY|CRITICAL|Salesforce.*Lightning|webpackUniversalModuleDefinition/i
                        }
                    } : {},
                    // CRITICAL: Extract licenses in ALL builds (minified and full)
                    // This will automatically catch and extract licenses from bundled dependencies
                    extractComments: true
                })
            ]
        }
    };
};

export default createUMDBase;