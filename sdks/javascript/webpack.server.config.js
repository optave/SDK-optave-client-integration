import path from 'path';
import webpack from 'webpack';
import { readFileSync } from 'fs';
import { BUILD_TARGETS } from './runtime/core/build-targets.js';

// Read package.json to get version and extract Node.js target
const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));

// Extract minimum Node.js version from engines field (e.g., ">=18.17" -> "18")
const nodeTarget = packageJson.engines.node.match(/\d+/)?.[0] || '18';

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
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    node: nodeTarget
                                },
                                modules: false
                            }]
                        ],
                    },
                },
            },
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
    }
};