/**
 * Comment Stripper Utility
 *
 * Robust comment stripping with string literal preservation using state machine.
 * Properly handles escaped quotes, mixed quote types, template literals, and regex patterns.
 * Prevents false positives from comment-like patterns inside strings.
 */

/**
 * Strip JavaScript comments while preserving string literals
 * @param {string} content - JavaScript source code
 * @returns {string} - Code with comments removed
 */
function stripComments(content) {
  const lines = content.split('\n');
  let stripped = '';
  let inMultiLineComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let processedLine = '';
    let j = 0;

    // State machine for string/comment tracking
    let inSingleQuoteString = false;
    let inDoubleQuoteString = false;
    let inTemplateString = false;
    let inRegex = false;

    while (j < line.length) {
      const char = line[j];
      const nextChar = j < line.length - 1 ? line[j + 1] : '';
      const prevChar = j > 0 ? line[j - 1] : '';

      // Handle multi-line comments
      if (inMultiLineComment) {
        if (char === '*' && nextChar === '/') {
          inMultiLineComment = false;
          j += 2;
          continue;
        } else {
          j++;
          continue; // Skip character in comment
        }
      }

      // Skip if we're in any kind of string literal
      const inAnyString = inSingleQuoteString || inDoubleQuoteString || inTemplateString || inRegex;

      if (!inAnyString) {
        // Check for start of multi-line comment
        if (char === '/' && nextChar === '*') {
          const endIndex = line.indexOf('*/', j + 2);
          if (endIndex !== -1) {
            // Comment ends on same line, skip it entirely
            j = endIndex + 2;
            continue;
          } else {
            // Comment continues to next line
            inMultiLineComment = true;
            break; // Rest of line is in comment
          }
        }

        // Check for single-line comment
        if (char === '/' && nextChar === '/') {
          // This is a real comment, skip rest of line
          break;
        }

        // Check for regex literal start (basic heuristic: / after =, (, [, {, :, ;, !, &, |, ?, +, -, *, /, %, ^, ~, <, >, ,)
        if (char === '/' && prevChar && /[=(\[{:;!&|?+\-*/%^~<>,\s]/.test(prevChar)) {
          inRegex = true;
          processedLine += char;
          j++;
          continue;
        }
      }

      // Handle string state transitions
      if (char === "'" && !inDoubleQuoteString && !inTemplateString && !inRegex) {
        // Only toggle if not escaped (count consecutive backslashes before)
        let escapeCount = 0;
        for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
          escapeCount++;
        }
        if (escapeCount % 2 === 0) { // Even number of backslashes = not escaped
          inSingleQuoteString = !inSingleQuoteString;
        }
      } else if (char === '"' && !inSingleQuoteString && !inTemplateString && !inRegex) {
        // Only toggle if not escaped
        let escapeCount = 0;
        for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
          escapeCount++;
        }
        if (escapeCount % 2 === 0) {
          inDoubleQuoteString = !inDoubleQuoteString;
        }
      } else if (char === '`' && !inSingleQuoteString && !inDoubleQuoteString && !inRegex) {
        // Only toggle if not escaped
        let escapeCount = 0;
        for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
          escapeCount++;
        }
        if (escapeCount % 2 === 0) {
          inTemplateString = !inTemplateString;
        }
      } else if (inRegex && char === '/') {
        // End of regex literal (check if not escaped)
        let escapeCount = 0;
        for (let k = j - 1; k >= 0 && line[k] === '\\'; k--) {
          escapeCount++;
        }
        if (escapeCount % 2 === 0) {
          inRegex = false;
        }
      }

      // Add character to processed line
      processedLine += char;
      j++;
    }

    stripped += processedLine;
    // Only add newline if we're not starting a multi-line comment and it's not the last line
    if (i < lines.length - 1 && !inMultiLineComment) {
      stripped += '\n';
    } else if (i < lines.length - 1 && inMultiLineComment) {
      // Add a space instead of newline when inside multi-line comment to avoid token merging
      stripped += ' ';
    }
  }

  return stripped;
}

module.exports = {
  stripComments
};