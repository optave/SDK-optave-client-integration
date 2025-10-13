import path from 'path';
import webpack from 'webpack';
import { readFileSync } from 'fs';
import TerserPlugin from 'terser-webpack-plugin';
import { BUILD_TARGETS } from './runtime/core/build-targets.js';

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));

// Environment variable controls minification vs full builds
const shouldMinify = process.env.FULL !== '1';
const filename = shouldMinify ? 'server.mjs' : 'server.full.mjs';

export default {
    entry: './runtime/core/main.js',
    target: 'node',
    output: {
        filename,
        path: path.resolve('dist'),
        library: {
            type: 'module',
            export: 'default',
        },
        environment: {
            module: true,
        },
        chunkFormat: 'module',
        publicPath: '',
    },
    experiments: {
        outputModule: true,
    },
    mode: 'production',
    devtool: false, // ESM builds don't generate source maps by default (only UMD builds need source maps for CSP compliance)
    externals: {
        // Keep Node.js modules as externals
        'ws': 'ws',
        'events': 'events',
        'crypto': 'crypto',
        'fs': 'fs',
        'path': 'path',
        'util': 'util',
        'buffer': 'buffer',
        'stream': 'stream',
        // Bundle AJV and related packages in server builds for full validation capabilities
        // This ensures server.mjs includes AJV validation and is larger than CSP-compliant builds
    },
    module: {
        rules: [
            // No transpilation needed - Node.js 18.17+ supports ES6+ natively
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            __WEBPACK_BUILD_TARGET__: JSON.stringify(BUILD_TARGETS.SERVER_ESM),
            __INCLUDE_WS_REQUIRE__: true,
            __SDK_VERSION__: JSON.stringify(packageJson.version),
        }),
    ],
    optimization: {
        minimize: shouldMinify,
        splitChunks: false, // Disable chunk splitting for single bundle file
        runtimeChunk: false, // Disable runtime chunk
        usedExports: true, // Mark used/unused exports for tree-shaking
        sideEffects: false, // Let package.json sideEffects field control tree-shaking
        providedExports: true, // Determine exports for each module

        // ALWAYS configure TerserPlugin for license extraction (even in non-minified builds)
        // This ensures legal compliance regardless of build type
        minimizer: [
            new TerserPlugin({
                minify: shouldMinify ? TerserPlugin.terserMinify : undefined,
                terserOptions: shouldMinify ? {
                    format: {
                        // Preserve important comments (comments starting with !)
                        comments: /^!/
                    }
                } : {},
                // CRITICAL: Extract licenses in ALL builds (minified and full)
                // This will automatically catch and extract licenses from bundled dependencies
                extractComments: true
            })
        ]
    }
};