/**
 * Build Target Validation
 *
 * Checks for webpack build target tokens that help identify the build environment.
 * This is informational validation that warns when build identification is missing.
 */

const path = require('path');
const { BundleAssertionError } = require('../registry');

/**
 * Assert webpack build target tokens are present
 */
async function assertWebpackBuildTarget(content, filePath) {
  // Check for presence of webpack build target token
  const buildTargetPattern = /__WEBPACK_BUILD_TARGET__/g;
  const matches = [...content.matchAll(buildTargetPattern)];

  if (matches.length === 0) {
    // This is a warning rather than an error
    const warning = new BundleAssertionError(
      `Missing __WEBPACK_BUILD_TARGET__ token in ${path.basename(filePath)}. Consider adding DefinePlugin to webpack config for build target identification`,
      filePath,
      null,
      'low'
    );
    warning.severity = 'warning';
    throw warning;
  }

  // Extract the build target value for informational purposes
  const contextPattern = /__WEBPACK_BUILD_TARGET__\s*[:=]\s*["']([^"']+)["']/g;
  const contextMatches = [...content.matchAll(contextPattern)];
  const buildTargets = contextMatches.length > 0
    ? [...new Set(contextMatches.map(m => m[1]))]
    : [];

  return {
    matches: matches.length,
    buildTargets,
    message: `Webpack build target token found in ${path.basename(filePath)} (${matches.length} occurrences)${buildTargets.length > 0 ? `: ${buildTargets.join(', ')}` : ''}`
  };
}

module.exports = {
  name: 'build-target-validation',
  description: 'Webpack build target token validation',
  severity: 'low',
  appliesTo: ['*'],
  run: assertWebpackBuildTarget
};