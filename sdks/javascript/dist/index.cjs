"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// runtime/core/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_CONFIG: () => DEFAULT_CONFIG2,
  OAUTH2_TOKEN_URL: () => OAUTH2_TOKEN_URL,
  SERVER_ENVIRONMENTS: () => SERVER_ENVIRONMENTS,
  buildAuthUrl: () => buildAuthUrl,
  buildWebSocketUrl: () => buildWebSocketUrl,
  createDefaultConfig: () => createDefaultConfig
});
module.exports = __toCommonJS(index_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_CONFIG,
  OAUTH2_TOKEN_URL,
  SERVER_ENVIRONMENTS,
  buildAuthUrl,
  buildWebSocketUrl,
  createDefaultConfig
});
