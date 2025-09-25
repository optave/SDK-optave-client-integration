// Browser WebSocket loader - always returns null since browsers use native WebSocket
export async function loadNodeWebSocket() {
    // Always return null in browser environments
    return null;
}