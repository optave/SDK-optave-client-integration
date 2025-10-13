#!/usr/bin/env node

/**
 * Security Scanner
 *
 * Scans codebase for hardcoded sensitive information including:
 * - WebSocket URLs (wss:// endpoints)
 * - API keys and secrets
 * - Authentication tokens
 * - Database credentials
 * - Private keys
 *
 * Usage: node scripts/dev/validation/security-scanner.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const ROOT_DIR = join(__dirname, '../../..');
const SCAN_DIRS = [
  'integration',
  'runtime',
  'generated',
  'scripts',
  'tests',
];

// Patterns to detect sensitive information
const SECURITY_PATTERNS = [
  {
    name: 'Hardcoded WebSocket URLs',
    pattern: /(?:['"`])wss:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s'"`]*(?:['"`])/g,
    severity: 'HIGH',
    description: 'WebSocket URLs should not be hardcoded. Use environment variables instead.',
    exemptions: [
      // Allow placeholder URLs in documentation
      /wss:\/\/your-websocket-url/,
      /wss:\/\/example\.com/,
      /wss:\/\/your-domain\.com/,
      /wss:\/\/your-optave-websocket-url/,
      // Allow Salesforce example URLs
      /wss:\/\/[^/]+\.force\.com/,
      /wss:\/\/[^/]+\.salesforce\.com/,
      /wss:\/\/[^/]+\.lightning\.force\.com/,
      // Allow default/fallback URLs in core code (should be overridden by config)
      /wss:\/\/default\.oco\.optave\.tech/,
      // Allow test/example URLs
      /wss:\/\/test\.example\.com/,
    ]
  },
  {
    name: 'Hardcoded HTTP URLs (production domains)',
    pattern: /(?:['"`])https?:\/\/(?!localhost|127\.0\.0\.1|example\.com|your-)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s'"`]*(?:['"`])/g,
    severity: 'MEDIUM',
    description: 'Production URLs should use environment variables.',
    exemptions: [
      // Allow documentation URLs
      /https:\/\/github\.com/,
      /https:\/\/docs\./,
      /https:\/\/www\./,
      // Allow default/fallback URLs in core code
      /https:\/\/default\.oco\.optave\.tech/,
      // Allow Stripe example URLs (test mode)
      /https:\/\/checkout\.stripe\.com\/pay\/cs_test/,
      // Allow test/local URLs
      /https:\/\/csp-test-harness\.local/,
    ]
  },
  {
    name: 'API Keys',
    pattern: /(?:api[_-]?key|apikey)[\s]*[:=][\s]*['"`][a-zA-Z0-9_-]{20,}['"`]/gi,
    severity: 'CRITICAL',
    description: 'API keys must never be hardcoded. Use environment variables.',
    exemptions: []
  },
  {
    name: 'Client Secrets',
    pattern: /(?:client[_-]?secret|clientsecret)[\s]*[:=][\s]*['"`][a-zA-Z0-9_-]{20,}['"`]/gi,
    severity: 'CRITICAL',
    description: 'Client secrets must never be hardcoded. Use environment variables.',
    exemptions: []
  },
  {
    name: 'Access Tokens',
    pattern: /(?:access[_-]?token|accesstoken|bearer)[\s]*[:=][\s]*['"`][a-zA-Z0-9_-]{20,}['"`]/gi,
    severity: 'CRITICAL',
    description: 'Access tokens must never be hardcoded. Use environment variables.',
    exemptions: []
  },
  {
    name: 'Database Connection Strings',
    pattern: /(?:mongodb|mysql|postgres|postgresql):\/\/[^\s'"`]+:[^\s'"`]+@/gi,
    severity: 'CRITICAL',
    description: 'Database credentials must never be hardcoded.',
    exemptions: []
  },
  {
    name: 'Private Keys',
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/gi,
    severity: 'CRITICAL',
    description: 'Private keys must never be committed to the repository.',
    exemptions: []
  },
  {
    name: 'AWS Credentials',
    pattern: /(?:AKIA|A3T|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'CRITICAL',
    description: 'AWS credentials must never be hardcoded.',
    exemptions: []
  },
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /coverage/,
  /\.map$/,
  /package-lock\.json$/,
  /\.min\.js$/,
  /\.bundle\.js$/,
  /security-scanner\.js$/, // Don't scan ourselves
  /tests\//, // Exclude test files (they contain test data)
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.json', '.yml', '.yaml', '.env', '.md'];

class SecurityScanner {
  constructor() {
    this.findings = [];
    this.filesScanned = 0;
  }

  /**
   * Check if a file should be excluded from scanning
   */
  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if a file extension should be scanned
   */
  shouldScanFile(filePath) {
    return SCAN_EXTENSIONS.some(ext => filePath.endsWith(ext));
  }

  /**
   * Check if a match should be exempted
   */
  isExempted(match, exemptions) {
    return exemptions.some(exemption => exemption.test(match));
  }

  /**
   * Recursively scan directory
   */
  scanDirectory(dirPath) {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(ROOT_DIR, fullPath);

      if (this.shouldExclude(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && this.shouldScanFile(fullPath)) {
        this.scanFile(fullPath, relativePath);
      }
    }
  }

  /**
   * Scan a single file for security issues
   */
  scanFile(filePath, relativePath) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      this.filesScanned++;

      const lines = content.split('\n');

      for (const pattern of SECURITY_PATTERNS) {
        const matches = content.matchAll(pattern.pattern);

        for (const match of matches) {
          // Skip if exempted
          if (this.isExempted(match[0], pattern.exemptions)) {
            continue;
          }

          // Find line number
          const matchIndex = match.index;
          let lineNumber = 1;
          let charCount = 0;

          for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
            if (charCount > matchIndex) {
              lineNumber = i + 1;
              break;
            }
          }

          this.findings.push({
            file: relativePath,
            line: lineNumber,
            pattern: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
            match: match[0].substring(0, 100), // Truncate long matches
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan file ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Run the security scan
   */
  scan() {
    console.log('🔍 Running security scan...\n');

    for (const dir of SCAN_DIRS) {
      const fullPath = join(ROOT_DIR, dir);
      try {
        if (statSync(fullPath).isDirectory()) {
          this.scanDirectory(fullPath);
        }
      } catch (error) {
        console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
      }
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log(`\n📊 Scan Results:`);
    console.log(`Files scanned: ${this.filesScanned}`);
    console.log(`Issues found: ${this.findings.length}\n`);

    if (this.findings.length === 0) {
      console.log('✅ No security issues detected!\n');
      return 0;
    }

    // Group findings by severity
    const bySeverity = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };

    for (const finding of this.findings) {
      bySeverity[finding.severity].push(finding);
    }

    // Report findings
    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      const findings = bySeverity[severity];
      if (findings.length === 0) continue;

      console.log(`\n${this.getSeverityEmoji(severity)} ${severity} (${findings.length} issue${findings.length > 1 ? 's' : ''}):`);
      console.log('─'.repeat(80));

      for (const finding of findings) {
        console.log(`\n📁 File: ${finding.file}:${finding.line}`);
        console.log(`🔍 Pattern: ${finding.pattern}`);
        console.log(`📝 Description: ${finding.description}`);
        console.log(`💡 Found: ${finding.match}`);
      }
    }

    console.log('\n');

    // Exit with error if critical or high severity issues found
    const criticalCount = bySeverity.CRITICAL.length;
    const highCount = bySeverity.HIGH.length;

    if (criticalCount > 0 || highCount > 0) {
      console.error(`❌ Security scan failed: ${criticalCount} CRITICAL and ${highCount} HIGH severity issues found.`);
      console.error('   Please remove hardcoded sensitive information before committing.\n');
      return 1;
    }

    console.log('⚠️  Security scan completed with warnings.\n');
    return 0;
  }

  /**
   * Get emoji for severity level
   */
  getSeverityEmoji(severity) {
    const emojis = {
      CRITICAL: '🚨',
      HIGH: '⚠️',
      MEDIUM: '⚡',
      LOW: 'ℹ️'
    };
    return emojis[severity] || '•';
  }
}

// Run the scanner
const scanner = new SecurityScanner();
scanner.scan();
const exitCode = scanner.generateReport();
process.exit(exitCode);
