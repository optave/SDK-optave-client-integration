/**
 * Lightning Web Security Strict Mode Removal Plugin
 *
 * This webpack plugin removes explicit "use strict" declarations from UMD builds
 * to comply with Salesforce Lightning Web Security requirements.
 *
 * Background: LWS implicitly enforces strict mode restrictions. Explicit "use strict"
 * declarations can cause conflicts when components use the script in LWS environments.
 *
 * Reference: https://developer.salesforce.com/docs/platform/lightning-components-security/guide/lws-js.html
 */

class LWSStrictModeRemovalPlugin {
    constructor(options = {}) {
        this.pluginName = 'LWSStrictModeRemovalPlugin';
        this.options = {
            verbose: options.verbose || false,
            ...options
        };
    }

    apply(compiler) {
        compiler.hooks.compilation.tap(this.pluginName, (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: this.pluginName,
                    stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE
                },
                (assets) => {
                    for (const filename in assets) {
                        // Only process UMD JavaScript files
                        if (filename.endsWith('.js') && filename.includes('umd')) {
                            const asset = assets[filename];
                            let source = asset.source();

                            if (typeof source === 'string') {
                                const originalSize = source.length;

                                // Remove explicit "use strict" declarations while preserving webpack structure
                                // Target the specific webpack bootstrap pattern
                                source = source.replace(/\/\*\*\*\*\*\*\/[\s]*"use strict";/g, '/******/');

                                // Also handle any other explicit strict mode declarations
                                source = source.replace(/^\s*["']use strict["'];?\s*$/gm, '');

                                // Handle strict mode in function contexts (more conservative)
                                source = source.replace(/\(function\s*\([^)]*\)\s*\{\s*["']use strict["'];/g, '(function() {');

                                const newSize = source.length;
                                const removed = originalSize !== newSize;

                                if (removed) {
                                    // Update the asset with the modified source using modern API
                                    // Create a proper RawSource object for webpack
                                    const { RawSource } = compiler.webpack.sources;
                                    compilation.updateAsset(filename, new RawSource(source));

                                    if (this.options.verbose) {
                                        console.log(`[${this.pluginName}] ✅ Removed strict mode declarations from ${filename}`);
                                        console.log(`   Size change: ${originalSize} → ${newSize} bytes (${originalSize - newSize} bytes removed)`);
                                    }
                                } else if (this.options.verbose) {
                                    console.log(`[${this.pluginName}] ℹ️  No strict mode declarations found in ${filename}`);
                                }
                            }
                        }
                    }
                }
            );
        });
    }
}

export { LWSStrictModeRemovalPlugin };