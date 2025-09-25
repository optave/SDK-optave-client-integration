/**
 * AJV stub for browser builds to prevent CSP violations
 * This stub ensures no AJV functionality reaches the browser bundle
 */

// Throw an error if AJV is somehow accessed in CSP-safe mode
export default function AjvStub() {
    throw new Error('AJV is not available in CSP-safe browser mode. Use browser-safe validators instead.');
}

// Mock other AJV exports that might be imported
export const Ajv = AjvStub;
export const addFormats = () => {
    throw new Error('AJV formats are not available in CSP-safe browser mode.');
};