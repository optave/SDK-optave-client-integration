import path from 'path';
import webpack from 'webpack';
import { readFileSync } from 'fs';
import { BUILD_TARGETS } from './runtime/core/build-targets.js';
import { browserAliases, fallbackBrowser } from './scripts/build/webpack/aliases.js';

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8'));

// Environment variable controls minification vs full builds
const shouldMinify = process.env.FULL !== '1';
const filename = shouldMinify ? 'browser.mjs' : 'browser.full.mjs';

export default {
    entry: './runtime/core/main.js',
    target: 'web',
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
    resolve: {
        alias: browserAliases,
        fallback: fallbackBrowser
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
                                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
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
            __WEBPACK_BUILD_TARGET__: JSON.stringify(BUILD_TARGETS.BROWSER_ESM),
            'process.versions.node': 'undefined',
            __INCLUDE_WS_REQUIRE__: false,
            __SDK_VERSION__: JSON.stringify(packageJson.version),
        }),
        // Replace AJV with CSP-safe validators for browser builds
        new webpack.NormalModuleReplacementPlugin(/ajv/, path.resolve('./runtime/platform/browser/ajv-stub.js')),
    ],
    externals: {
        // Don't bundle Node.js specific packages for browser
    },
    optimization: {
        minimize: shouldMinify,
        splitChunks: false, // Disable chunk splitting for single bundle file
        runtimeChunk: false, // Disable runtime chunk
        usedExports: true, // Mark used/unused exports for tree-shaking
        sideEffects: false, // Let package.json sideEffects field control tree-shaking
        providedExports: true, // Determine exports for each module
    }
};