// Node.js WebSocket loader - uses static import for UMD builds
import ws from 'ws';

export async function loadNodeWebSocket() {
    // Complete early exit for any browser-like environment
    if (typeof window !== 'undefined' || typeof document !== 'undefined' ||
        typeof navigator !== 'undefined' || typeof location !== 'undefined') {
        return null;
    }

    // Additional check for Node.js-specific globals
    if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        return null;
    }

    // Return statically imported ws module for UMD builds
    return ws;
}