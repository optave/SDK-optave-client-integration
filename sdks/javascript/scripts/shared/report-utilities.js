/**
 * Shared Reporting Utilities
 *
 * Common reporting functions used across governance scripts.
 * Provides consistent formatting, status indicators, and report generation.
 *
 * @fileoverview Shared reporting utilities for build validation scripts
 */

/**
 * Status reporting with consistent icons and colors
 */
export class StatusReporter {
  static icons = {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    CRITICAL: '🚨',
    INFO: '📊',
    INCREASE: '📈',
    DECREASE: '📉',
    NEUTRAL: '➖'
  };

  /**
   * Get status icon based on condition
   * @param {string} status - Status level: 'success', 'error', 'warning', 'info'
   * @param {boolean} hasChange - Whether there's a change to indicate
   * @param {number} changeValue - Positive/negative change value
   * @returns {string} Appropriate icon
   */
  static getIcon(status, hasChange = false, changeValue = 0) {
    switch (status) {
      case 'error':
      case 'critical':
        return this.icons.CRITICAL;
      case 'warning':
        return this.icons.WARNING;
      case 'success':
      case 'ok':
        if (hasChange && changeValue !== 0) {
          return changeValue > 0 ? this.icons.INCREASE : this.icons.DECREASE;
        }
        return this.icons.SUCCESS;
      case 'info':
      case 'unknown':
      default:
        return this.icons.INFO;
    }
  }

  /**
   * Format status message with icon
   * @param {string} status - Status level
   * @param {string} message - Status message
   * @param {boolean} hasChange - Whether there's a change
   * @param {number} changeValue - Change value
   * @returns {string} Formatted status message
   */
  static formatStatus(status, message, hasChange = false, changeValue = 0) {
    const icon = this.getIcon(status, hasChange, changeValue);
    return `${icon} ${message}`;
  }
}

/**
 * Console output formatting utilities
 */
export class ConsoleFormatter {
  /**
   * Print a header with decorative borders
   * @param {string} title - Header title
   * @param {number} width - Total width (default: 80)
   * @param {string} char - Border character (default: '=')
   */
  static header(title, width = 80, char = '=') {
    const border = char.repeat(width);
    console.log(border);
    console.log(title);
    console.log(border);
  }

  /**
   * Print a section separator
   * @param {string} title - Section title
   * @param {number} width - Separator width (default: 50)
   * @param {string} char - Separator character (default: '=')
   */
  static section(title, width = 50, char = '=') {
    console.log(`\n${title}`);
    console.log(char.repeat(width));
  }

  /**
   * Print a subsection with lighter separator
   * @param {string} title - Subsection title
   * @param {number} width - Separator width (default: 30)
   */
  static subsection(title, width = 30) {
    console.log(`\n${title}`);
    console.log('-'.repeat(width));
  }

  /**
   * Create a table row with consistent spacing
   * @param {Array} columns - Column values
   * @param {Array} widths - Column widths
   * @returns {string} Formatted table row
   */
  static tableRow(columns, widths) {
    return columns.map((col, i) => {
      const width = widths[i] || 15;
      return String(col).padEnd(width);
    }).join(' ');
  }

  /**
   * Print table with headers and rows
   * @param {Array} headers - Table headers
   * @param {Array} rows - Table rows (array of arrays)
   * @param {Array} widths - Column widths
   */
  static table(headers, rows, widths) {
    // Calculate default widths if not provided
    if (!widths) {
      widths = headers.map((header, i) => {
        const maxContentLength = Math.max(
          header.length,
          ...rows.map(row => String(row[i] || '').length)
        );
        return Math.max(maxContentLength + 2, 10);
      });
    }

    // Print headers
    console.log(this.tableRow(headers, widths));
    console.log(this.tableRow(headers.map(() => '-'), widths).replace(/ /g, '-'));

    // Print rows
    rows.forEach(row => {
      console.log(this.tableRow(row, widths));
    });
  }
}

/**
 * Markdown report generator
 */
export class MarkdownReporter {
  /**
   * Generate markdown table
   * @param {Array} headers - Table headers
   * @param {Array} rows - Table rows
   * @returns {string} Markdown table
   */
  static table(headers, rows) {
    let markdown = `| ${headers.join(' | ')} |\n`;
    markdown += `|${headers.map(() => '--------').join('|')}|\n`;

    rows.forEach(row => {
      markdown += `| ${row.join(' | ')} |\n`;
    });

    return markdown;
  }

  /**
   * Generate markdown section with header
   * @param {string} title - Section title
   * @param {number} level - Header level (1-6)
   * @returns {string} Markdown header
   */
  static section(title, level = 2) {
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    return `${hashes} ${title}\n\n`;
  }

  /**
   * Generate collapsible details section
   * @param {string} summary - Summary text
   * @param {string} content - Detailed content
   * @returns {string} Markdown details block
   */
  static details(summary, content) {
    return `<details>\n<summary>${summary}</summary>\n\n${content}\n\n</details>\n`;
  }

  /**
   * Generate code block
   * @param {string} content - Code content
   * @param {string} language - Language identifier
   * @returns {string} Markdown code block
   */
  static codeBlock(content, language = '') {
    return `\`\`\`${language}\n${content}\n\`\`\`\n`;
  }
}

/**
 * Unified report generator that handles both console and markdown outputs
 */
export class UnifiedReporter {
  constructor(options = {}) {
    this.format = options.format || 'console'; // 'console', 'markdown', 'json'
    this.verbose = options.verbose || false;
    this.output = [];
  }

  /**
   * Add a header to the report
   * @param {string} title - Header title
   * @param {number} level - Header level (markdown only)
   */
  header(title, level = 1) {
    if (this.format === 'console') {
      ConsoleFormatter.header(title);
    } else if (this.format === 'markdown') {
      this.output.push(MarkdownReporter.section(title, level));
    }
  }

  /**
   * Add a section to the report
   * @param {string} title - Section title
   * @param {number} level - Header level
   */
  section(title, level = 2) {
    if (this.format === 'console') {
      ConsoleFormatter.section(title);
    } else if (this.format === 'markdown') {
      this.output.push(MarkdownReporter.section(title, level));
    }
  }

  /**
   * Add a table to the report
   * @param {Array} headers - Table headers
   * @param {Array} rows - Table rows
   * @param {Array} widths - Column widths (console only)
   */
  table(headers, rows, widths = null) {
    if (this.format === 'console') {
      ConsoleFormatter.table(headers, rows, widths);
    } else if (this.format === 'markdown') {
      this.output.push(MarkdownReporter.table(headers, rows));
    }
  }

  /**
   * Add a status message
   * @param {string} status - Status level
   * @param {string} message - Message text
   * @param {boolean} hasChange - Whether there's a change
   * @param {number} changeValue - Change value
   */
  status(status, message, hasChange = false, changeValue = 0) {
    const formatted = StatusReporter.formatStatus(status, message, hasChange, changeValue);

    if (this.format === 'console') {
      console.log(formatted);
    } else if (this.format === 'markdown') {
      this.output.push(formatted + '\n');
    }
  }

  /**
   * Add raw text
   * @param {string} text - Text to add
   */
  text(text) {
    if (this.format === 'console') {
      console.log(text);
    } else if (this.format === 'markdown') {
      this.output.push(text + '\n');
    }
  }

  /**
   * Add a code block (markdown only)
   * @param {string} content - Code content
   * @param {string} language - Language identifier
   */
  code(content, language = '') {
    if (this.format === 'markdown') {
      this.output.push(MarkdownReporter.codeBlock(content, language));
    } else if (this.format === 'console') {
      console.log(content);
    }
  }

  /**
   * Generate the final report
   * @returns {string} Generated report (for non-console formats)
   */
  generate() {
    if (this.format === 'markdown') {
      return this.output.join('\n');
    } else if (this.format === 'json') {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        content: this.output
      }, null, 2);
    }
    return '';
  }

  /**
   * Clear the report buffer
   */
  clear() {
    this.output = [];
  }
}