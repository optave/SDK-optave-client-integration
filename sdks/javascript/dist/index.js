// generated/connection-config.ts
var DEFAULT_CONFIG = {
  websocketUrl: "wss://{wsEnv}.oco.optave.tech/",
  authUrl: "https://{authEnv}.oco.optave.tech/auth/oauth2",
  // Base URL - SDK will append /token
  supportedAuthTransports: ["subprotocol", "query", "oauth2"]
};
var OAUTH2_TOKEN_URL = DEFAULT_CONFIG.authUrl;

// runtime/core/index.ts
var createDefaultConfig = () => ({
  websocketUrl: "wss://default.oco.optave.tech/",
  authUrl: "https://default.oco.optave.tech/auth/oauth2/",
  supportedAuthTransports: ["subprotocol", "query"],
  OptaveTraceChatSessionId: void 0
});
var DEFAULT_CONFIG2 = createDefaultConfig();
var SERVER_ENVIRONMENTS = {
  websocket: {
    wsEnv: {
      default: "default",
      examples: ["default", "staging", "production"]
    }
  },
  auth: {
    authEnv: {
      default: "default",
      examples: ["default", "staging", "production"]
    }
  }
};
function buildWebSocketUrl(environment) {
  const env = environment || "default";
  return `wss://${env}.oco.optave.tech/`;
}
function buildAuthUrl(environment) {
  const env = environment || "default";
  return `https://${env}.oco.optave.tech/auth/oauth2/`;
}
export {
  DEFAULT_CONFIG2 as DEFAULT_CONFIG,
  OAUTH2_TOKEN_URL,
  SERVER_ENVIRONMENTS,
  buildAuthUrl,
  buildWebSocketUrl,
  createDefaultConfig
};
