# Token Detection Enhancements

## Overview

Enhanced the AJV and eval token detection system in `assert-umd-bundles.cjs` to prevent false positives from commented or string-literal occurrences while maintaining accurate detection of actual security violations.

## Key Improvements

### 1. Robust Comment Stripping (`stripComments()`)

**Previous Implementation:**
- Basic regex-based comment removal
- Prone to false positives from commented code
- Could incorrectly strip strings containing comment-like patterns

**Enhanced Implementation:**
- Line-by-line processing with state tracking
- Proper handling of multi-line comments spanning multiple lines
- String literal preservation to avoid stripping legitimate content
- Nested comment structure handling

```javascript
// Before: Simple regex replacement
stripped = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

// After: Stateful parsing with context awareness
const lines = content.split('\n');
let inMultiLineComment = false;
// ... sophisticated parsing logic
```

### 2. Enhanced Eval Token Detection

**Key Improvements:**
- **Word Boundaries**: Use `\b` patterns to avoid matching substrings like "evaluation"
- **Severity Levels**: High/medium severity classification for better error reporting
- **Context Checking**: Examine surrounding code context before flagging violations
- **Comprehensive Whitelist**: Expanded safe patterns for documentation, error messages, and build configs

**Detection Patterns:**
```javascript
// Enhanced patterns with severity levels
const dangerousPatterns = [
  {
    pattern: /\beval\s*\(/g,
    description: 'Direct eval() call',
    severity: 'high'
  },
  {
    pattern: /window\[[\s"']*eval[\s"']*\]/g,
    description: 'Window eval access',
    severity: 'high'
  }
  // ... more patterns
];
```

**Safe Pattern Whitelist:**
- SDK-specific patterns (`availableValidators`, `OptaveJavaScriptSDK`)
- Babel/build tool patterns (`babel-helper`, `webpack-helper`)
- String literal contexts (`"eval not allowed"`, `'cannot use eval'`)
- Documentation patterns (`description: "eval usage forbidden"`)
- Error message patterns (`error: "eval not available"`)

### 3. Enhanced AJV Detection

**Improvements:**
- **Module-specific patterns**: Detect actual imports/requires vs mentions
- **Context awareness**: Check surrounding 400 characters for safe context
- **Comprehensive safe patterns**: Documentation, comparisons, configuration references
- **Browser-only checking**: Only applies to browser builds where AJV should be excluded

**Detection Patterns:**
```javascript
const ajvPatterns = [
  {
    pattern: /\brequire\s*\(\s*["']ajv["']\s*\)/g,
    description: 'CommonJS require of AJV module',
    severity: 'high'
  },
  {
    pattern: /\bajv\.(?:compile|validate|addSchema)\b/g,
    description: 'AJV instance method call',
    severity: 'high'
  }
  // ... more patterns
];
```

**Expanded Safe Patterns:**
- Documentation: `"without AJV"`, `"alternative to AJV"`
- Configuration: `"externals: ajv"`, `"exclude AJV"`
- Comparisons: `"similar to AJV"`, `"versus AJV"`
- Error messages: `"AJV not available"`, `"cannot load AJV"`

## Test Results

The enhanced detection system demonstrates significant accuracy improvements:

```
🚀 Detection Accuracy Improvements:

COMMENTED_CODE:
  Naive detection:     eval=3, ajv=1
  Enhanced detection:  eval=0, ajv=0  ✨ More accurate!

STRING_LITERALS:
  Naive detection:     eval=1, ajv=3
  Enhanced detection:  eval=0, ajv=0  ✨ More accurate!

EDGE_CASES:
  Naive detection:     eval=2, ajv=2
  Enhanced detection:  eval=1, ajv=0  ✨ More accurate!
```

## Usage

### Running Tests
```bash
# Test the enhanced detection system
node scripts/testing/test-token-detection.cjs

# Run bundle assertions (includes enhanced detection)
node scripts/validation/assert-umd-bundles.cjs
```

### Test Cases
Comprehensive test fixtures are available in:
- `tests/fixtures/token-detection-test-cases.js` - ES module test cases
- `scripts/testing/test-token-detection.cjs` - CommonJS test runner

## Benefits

1. **Reduced False Positives**: Comments and documentation no longer trigger violations
2. **Maintained Security**: Actual dangerous patterns are still detected accurately
3. **Better Error Reporting**: Severity levels and detailed context in error messages
4. **Comprehensive Coverage**: Extensive safe pattern whitelist covers legitimate use cases
5. **Future-Proof**: Extensible pattern system for adding new detection rules

## Implementation Details

### Comment Stripping Algorithm
- **State Tracking**: Maintains `inMultiLineComment` state across lines
- **String Awareness**: Checks quote balance before treating `//` as comment start
- **Nested Handling**: Properly processes `/* nested /* comments */ */` structures
- **Performance**: Single-pass algorithm with O(n) complexity

### Context-Aware Detection
- **Line Context**: Examines the line containing the match
- **Broader Context**: Checks ±200 characters around the match
- **Multiple Safe Patterns**: Uses both line-level and context-level safe pattern matching
- **Case Insensitive**: Applies `.toLowerCase()` for robust matching

### Error Reporting
- **Severity Classification**: High/medium levels for prioritizing fixes
- **Detailed Context**: Shows match location, pattern, and surrounding code
- **Actionable Messages**: Clear descriptions of what was detected and why it's problematic

This enhancement significantly improves the reliability of security scanning while maintaining comprehensive coverage of actual threats.