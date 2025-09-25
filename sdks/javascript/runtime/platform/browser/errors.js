// CSP-safe browser errors.js - no AJV references

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
 * CSP-safe version of makeStructuredError - no AJV ValidationError support
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
  // No AJV ValidationError handling in CSP-safe mode
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