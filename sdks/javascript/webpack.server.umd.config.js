import { createUMDBase } from './webpack.shared.umd.base.js';

// Environment variable controls minification vs full builds
const shouldMinify = process.env.FULL !== '1';
const filename = shouldMinify ? 'server.umd.js' : 'server.umd.full.js';

// Server UMD configuration for Salesforce Lightning deployment
// - Deploy as .js static resource in Salesforce (NOT for Node.js require())
// - Access via globalThis.OptaveJavaScriptSDK or window.OptaveJavaScriptSDK
// - Test using vm.runInNewContext() or browser environment, NOT require()

// Current approach: Using webpack's standard UMD with export:'default' to avoid getter patterns.
// We also perform an explicit globalThis assignment inside umd-entry.js so that even when
// the AMD branch runs (define()), the constructor is still reachable via globalThis.OptaveJavaScriptSDK.

export default createUMDBase({
    buildTarget: 'server',
    filename,
    minimize: shouldMinify,
    salesforceBuild: true
});