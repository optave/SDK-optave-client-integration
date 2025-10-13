# Bundle Assertions - Modular UMD Validation System

This directory contains the modular bundle assertion system that refactors the original monolithic `assert-umd-bundles.cjs` into a registry-based architecture with individual assertion modules.

## Architecture Overview

The system consists of:

- **Registry System** (`registry.js`) - Core orchestration with parallel execution support
- **Individual Task Modules** (`tasks/`) - Separate modules for each validation concern
- **Shared Utilities** (`utils/`) - Common functionality like comment stripping
- **Main Script** (`../assert-umd-bundles-modular.cjs`) - CLI interface and configuration

## Key Benefits

### 1. **Separation of Concerns**
Each validation concern is isolated in its own module:
- `global-sdk-presence.js` - UMD global exposure validation
- `eval-security.js` - CSP-compliant eval/Function detection
- `ajv-exclusion.js` - Browser build AJV import exclusion
- `build-target-validation.js` - Webpack build target token validation
- `websocket-scheme-validation.js` - Salesforce Lightning WebSocket scheme validation

### 2. **Configurable Execution**
- **Parallel Execution**: Tasks can run concurrently for better performance
- **Severity Filtering**: Include/exclude tasks based on severity levels
- **File Pattern Matching**: Tasks apply only to relevant bundle types

### 3. **Multiple Output Formats**
- **Human-readable**: Pretty-printed console output with colors and timestamps
- **Machine-readable JSON**: Structured output for CI dashboards and automation

### 4. **Robust Error Handling**
- Detailed error context with file paths and line numbers
- Severity-based classification (high/medium/low/warning)
- Safe pattern whitelisting to prevent false positives

## Usage Examples

### Basic Usage
```bash
# Run with default settings (human output, parallel execution)
node scripts/assert-umd-bundles-modular.cjs

# Verbose logging for debugging
node scripts/assert-umd-bundles-modular.cjs --log-level verbose

# Sequential execution for deterministic output
node scripts/assert-umd-bundles-modular.cjs --no-parallel
```

### JSON Output for CI/CD
```bash
# Machine-readable JSON output
node scripts/assert-umd-bundles-modular.cjs --json

# JSON with error-only logging
node scripts/assert-umd-bundles-modular.cjs --json --log-level error
```

### Severity Filtering
```bash
# Only critical security checks
node scripts/assert-umd-bundles-modular.cjs --severity high

# Skip low-priority warnings
node scripts/assert-umd-bundles-modular.cjs --severity high,medium

# Include all levels (default)
node scripts/assert-umd-bundles-modular.cjs --severity high,medium,low
```

### Advanced Configuration
```bash
# Custom worker count and directory
node scripts/assert-umd-bundles-modular.cjs \
  --max-workers 2 \
  --dist-dir custom/dist \
  --log-level verbose
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output results in JSON format | `human` |
| `--no-parallel` | Disable parallel execution | `parallel=true` |
| `--max-workers N` | Maximum worker threads | `4` |
| `--log-level LEVEL` | Logging level: `silent\|error\|warn\|info\|verbose` | `info` |
| `--severity LIST` | Comma-separated severity levels to include | `high,medium,low` |
| `--dist-dir DIR` | Distribution directory path | `../dist` |
| `--help, -h` | Show help message | - |

## Task Configuration

Each task module exports a configuration object:

```javascript
module.exports = {
  name: 'task-identifier',
  description: 'Human-readable description',
  severity: 'high|medium|low',
  appliesTo: ['*.umd.js', '*browser*'], // File patterns
  run: async (content, filePath) => {
    // Validation logic
    // Throw BundleAssertionError on failure
    // Return success context for reporting
  }
};
```

## JSON Output Schema

```json
{
  "summary": {
    "passed": 8,
    "failed": 0,
    "warnings": 3,
    "total": 11,
    "success": true
  },
  "metadata": {
    "parallel": true,
    "workers": 4,
    "timestamp": "2025-09-23T06:50:37.174Z"
  },
  "tasks": [
    // Array of task results per bundle file
    [
      {
        "task": "eval-security",
        "status": "passed|failed|warning",
        "severity": "high",
        "executionTime": 15,
        "message": "Task result message",
        "file": "/path/to/bundle.js",
        "line": 123
      }
    ]
  ],
  "errors": [
    // Detailed error information
  ],
  "executionTime": 51,
  "timestamp": "2025-09-23T06:50:37.225Z"
}
```

## Adding New Assertions

To add a new validation task:

1. **Create Task Module** (`tasks/new-validation.js`):
```javascript
const { BundleAssertionError } = require('../registry');

async function assertNewValidation(content, filePath) {
  // Validation logic here
  if (violationFound) {
    throw new BundleAssertionError('Validation failed', filePath, lineNumber, 'high');
  }
  return { message: 'Validation passed' };
}

module.exports = {
  name: 'new-validation',
  description: 'Description of what this validates',
  severity: 'high',
  appliesTo: ['*.umd.js'],
  run: assertNewValidation
};
```

2. **Register in Main Script** (`../assert-umd-bundles-modular.cjs`):
```javascript
const newValidation = require('./bundle-assertions/tasks/new-validation');

// In registerTasks() method:
const tasks = [
  // ... existing tasks
  newValidation
];
```

## Performance Considerations

- **Parallel Execution**: Tasks run concurrently across multiple bundles for better performance
- **Comment Stripping**: Shared utility prevents duplicate parsing overhead
- **Pattern Matching**: File-specific tasks only run on applicable bundles
- **Worker Threads**: Currently disabled but architecture supports future parallelization

## Migration from Monolithic Script

The original `assert-umd-bundles.cjs` script has been preserved for backward compatibility. The modular system provides:

- **Same validation coverage** with improved organization
- **Enhanced reporting** with structured output options
- **Better maintainability** through separation of concerns
- **Future extensibility** through registry-based architecture

## Dependencies

- **Node.js built-ins**: `worker_threads`, `os`, `path`, `fs`
- **No external dependencies** - uses only Node.js standard library

## Contributing

When modifying assertion tasks:

1. **Follow existing patterns** in task modules
2. **Include comprehensive tests** for new patterns
3. **Update documentation** for new CLI options
4. **Test both human and JSON output** formats
5. **Verify parallel execution** doesn't affect results