// errors.js

class OptaveError extends Error {
  /**
   * @param {Object} params
   * @param {'AUTHENTICATION'|'ORCHESTRATOR'|'VALIDATION'|'WEBSOCKET'|'UNKNOWN'} params.category
   * @param {string} params.code
   * @param {string} params.message
   * @param {any} [params.details]
   */
  constructor({ category, code, message, details }) {
    super(message);
    this.name = 'OptaveError';
    this.category = category || 'UNKNOWN';
    this.code = code || 'UNKNOWN';
    if (details !== undefined) this.details = details;
  }
}

/**
 * Normalize various raw error inputs to OptaveError
 * @param {any} raw
 * @returns {OptaveError}
 */
function makeStructuredError(raw) {
  // Heuristics: map from raw shapes to categories/codes you already use internally.
  if (raw && raw.category && raw.code && raw.message) {
    return new OptaveError(raw);
  }
  if (typeof raw === 'string') {
    return new OptaveError({ category: 'UNKNOWN', code: 'STRING_ERROR', message: raw });
  }
  if (raw && raw.name === 'AjvValidationError') {
    return new OptaveError({ category: 'VALIDATION', code: 'SCHEMA_VALIDATION', message: raw.message, details: raw.errors });
  }
  if (raw && raw.isAuthError) {
    return new OptaveError({ category: 'AUTHENTICATION', code: raw.code || 'AUTH_ERROR', message: raw.message || 'Authentication error', details: raw });
  }
  if (raw && raw.isWsError) {
    return new OptaveError({ category: 'WEBSOCKET', code: raw.code || 'WS_ERROR', message: raw.message || 'WebSocket error', details: raw });
  }
  // Default
  return new OptaveError({ category: 'UNKNOWN', code: 'UNCLASSIFIED', message: (raw && raw.message) || String(raw !== null && raw !== undefined ? raw : 'Unknown error'), details: raw });
}

export { OptaveError, makeStructuredError };