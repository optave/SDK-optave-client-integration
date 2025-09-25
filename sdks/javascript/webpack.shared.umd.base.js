import path from 'path';
import webpack from 'webpack';
import { readFileSync } from 'fs';
import TerserPlugin from 'terser-webpack-plugin';
import { BUILD_TARGETS } from './runtime/core/build-targets.js';
import { umdAliases, browserUmdAliases, fallbackUMD, fallbackBrowserUMD, fallbackServerUMD } from './scripts/build/webpack/aliases.js';
import { LWSStrictModeRemovalPlugin } from './scripts/build/webpack/lws-strict-mode-plugin.js';

// Read package.json to get version and extract Node.js target
const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));

// Extract minimum Node.js version from engines field (e.g., ">=18.17" -> "18")
const nodeTarget = packageJson.engines.node.match(/\d+/)?.[0] || '18';

// Shared UMD base (browser + server)
export const createUMDBase = (options = {}) => {
    const {
        buildTarget = 'browser', // 'browser' or 'server' (legacy)
        filename = 'build.umd.js',
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
        devtool: 'source-map', // External source maps with automatic URL comment

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
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            // Enable source maps for babel-loader
                            sourceMaps: true,
                            presets: [
                                ['@babel/preset-env', {
                                    targets: buildTarget === 'browser'
                                        ? { browsers: ['> 1%', 'last 2 versions', 'not ie <= 11'] }
                                        : { node: nodeTarget },
                                    modules: false, // Let webpack handle modules for UMD build
                                    // Server UMD: preserve async/callback handling for timeout scenarios
                                    ...(buildTarget === 'server' && !minimize && {
                                        exclude: [
                                            'transform-async-to-generator',
                                            'transform-regenerator'
                                        ]
                                    })
                                }]
                            ],
                            // Preserve function context for timeout callbacks (non-minified server builds)
                            plugins: [],
                            // Browser builds: preserve function names in output
                            ...(buildTarget === 'browser' && {
                                compact: false,
                                minified: false,
                            })
                        },
                    },
                },
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

            // Only add optimizations for minified builds
            ...(minimize && {
                minimizer: [
                    new TerserPlugin({
                        terserOptions: {
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
                        },
                        extractComments: false
                    })
                ]
            })
        }
    };
};

export default createUMDBase;