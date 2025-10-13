#!/usr/bin/env node

/**
 * Test script for enhanced AJV & eval token detection
 *
 * This script demonstrates the improvements made to token detection
 * by running test cases and comparing enhanced vs naive detection.
 */

const { UMDBundleAssertor } = require('./assert-umd-bundles.cjs');

// Import optimized test cases using dynamic import for ES modules
const runTestSuite = async () => {
  try {
    // Import the programmatically generated test cases
    const { TEST_CASES } = await import('../tests/fixtures/token-detection-test-cases.js');
    const testCases = TEST_CASES;

    console.log('🧪 Enhanced Token Detection Test Suite');
    console.log('=====================================\n');

    const assertor = new UMDBundleAssertor();
    let totalPassed = 0;
    let totalFailed = 0;
    const improvements = [];

    for (const [testName, testCase] of Object.entries(testCases)) {
      try {
        console.log(`🔍 Testing: ${testCase.description}`);

        // Test enhanced detection
        const enhancedResults = runEnhancedDetection(assertor, testCase.content);

        // Test naive detection for comparison
        const naiveResults = runNaiveDetection(testCase.content);

        // Verify expectations
        const evalMatch = enhancedResults.eval === testCase.expectedViolations.eval;
        const ajvMatch = enhancedResults.ajv === testCase.expectedViolations.ajv;

        if (evalMatch && ajvMatch) {
          console.log(`  ✅ Enhanced detection: eval=${enhancedResults.eval}, ajv=${enhancedResults.ajv}`);
          totalPassed++;

          // Show improvement over naive detection
          if (naiveResults.eval !== enhancedResults.eval || naiveResults.ajv !== enhancedResults.ajv) {
            console.log(`  📈 Improvement over naive: eval=${naiveResults.eval}→${enhancedResults.eval}, ajv=${naiveResults.ajv}→${enhancedResults.ajv}`);
            improvements.push({
              test: testName,
              naive: naiveResults,
              enhanced: enhancedResults,
              expected: testCase.expectedViolations
            });
          }
        } else {
          console.log(`  ❌ Expected eval=${testCase.expectedViolations.eval}, ajv=${testCase.expectedViolations.ajv}`);
          console.log(`     Got eval=${enhancedResults.eval}, ajv=${enhancedResults.ajv}`);
          totalFailed++;
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Test failed: ${testName}`, error.message);
        totalFailed++;
      }
    }

    // Generate final report
    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Improvements over naive detection: ${improvements.length}`);

    if (improvements.length > 0) {
      console.log('\n🚀 Detection Accuracy Improvements:');
      improvements.forEach(({ test, naive, enhanced, expected }) => {
        console.log(`\n  ${test}:`);
        console.log(`    Naive detection:     eval=${naive.eval}, ajv=${naive.ajv}`);
        console.log(`    Enhanced detection:  eval=${enhanced.eval}, ajv=${enhanced.ajv}`);
        console.log(`    Expected (correct):  eval=${expected.eval}, ajv=${expected.ajv}`);

        const evalAccuracy = enhanced.eval === expected.eval;
        const ajvAccuracy = enhanced.ajv === expected.ajv;
        const naiveEvalAccuracy = naive.eval === expected.eval;
        const naiveAjvAccuracy = naive.ajv === expected.ajv;

        if ((evalAccuracy && !naiveEvalAccuracy) || (ajvAccuracy && !naiveAjvAccuracy)) {
          console.log(`    ✨ Enhanced detection is more accurate!`);
        }
      });
    }

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Enhanced token detection is working correctly.');
      process.exit(0);
    } else {
      console.log(`\n💥 ${totalFailed} tests failed. Check the implementation.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
};

/**
 * Run enhanced detection using the improved assertor methods
 */
function runEnhancedDetection(assertor, content) {
  const strippedContent = assertor.stripComments(content);

  // Count eval violations using enhanced patterns with context checking
  let evalCount = 0;
  const evalPatterns = [
    /\beval\s*\(/g,
    /\bnew\s+Function\s*\(/g,
    /window\[[\s"']*eval[\s"']*\]/g,
    /globalThis\[[\s"']*eval[\s"']*\]/g
  ];

  const safeEvalPatterns = [
    /"[^"]*eval[^"]*"/,
    /'[^']*eval[^']*'/,
    /`[^`]*eval[^`]*`/,
    /error.*message.*eval/i,
    /cannot.*use.*eval/i,
    /eval.*not.*allowed/i,
    /disable.*eval/i
  ];

  for (const pattern of evalPatterns) {
    const matches = [...strippedContent.matchAll(pattern)];
    for (const match of matches) {
      const matchStart = match.index;
      const lineStart = content.lastIndexOf('\n', matchStart);
      const lineEnd = content.indexOf('\n', matchStart);
      const line = content.slice(lineStart + 1, lineEnd === -1 ? undefined : lineEnd);

      const isSafe = safeEvalPatterns.some(safePattern => safePattern.test(line));
      if (!isSafe) {
        evalCount++;
      }
    }
  }

  // Count AJV violations using enhanced patterns with context checking
  let ajvCount = 0;
  const ajvPatterns = [
    /\brequire\s*\(\s*["']ajv["']\s*\)/g,
    /\bimport\b.*\bfrom\s*["']ajv["']/g,
    /\bnew\s+Ajv\b\s*\(/g
  ];

  const safeAjvPatterns = [
    /without[\s_-]*AJV/i,
    /no[\s_-]*AJV/i,
    /exclude[\s_-]*AJV/i,
    /alternative.*to.*ajv/i,
    /compared.*to.*ajv/i,
    /"[^"]*ajv[^"]*"/i,
    /'[^']*ajv[^']*'/i
  ];

  for (const pattern of ajvPatterns) {
    const matches = [...strippedContent.matchAll(pattern)];
    for (const match of matches) {
      const matchStart = match.index;
      const lineStart = content.lastIndexOf('\n', matchStart);
      const lineEnd = content.indexOf('\n', matchStart);
      const line = content.slice(lineStart + 1, lineEnd === -1 ? undefined : lineEnd);

      const isSafe = safeAjvPatterns.some(safePattern => safePattern.test(line));
      if (!isSafe) {
        ajvCount++;
      }
    }
  }

  return { eval: evalCount, ajv: ajvCount };
}

/**
 * Run naive detection (simple regex without preprocessing)
 */
function runNaiveDetection(content) {
  // Simple regex patterns that would match comments and strings
  const evalMatches = content.match(/eval\s*\(/g) || [];
  const functionMatches = content.match(/new\s+Function\s*\(/g) || [];
  const ajvMatches = content.match(/ajv/gi) || [];

  return {
    eval: evalMatches.length + functionMatches.length,
    ajv: ajvMatches.length
  };
}

// Run the test suite
if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };