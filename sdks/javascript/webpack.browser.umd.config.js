import { createUMDBase } from './webpack.shared.umd.base.js';

// Environment variable controls minification vs full builds
const shouldMinify = process.env.FULL !== '1';
const filename = shouldMinify ? 'browser.umd.js' : 'browser.umd.full.js';

export default createUMDBase({
    buildTarget: 'browser',
    filename,
    minimize: shouldMinify,
    salesforceBuild: false
});