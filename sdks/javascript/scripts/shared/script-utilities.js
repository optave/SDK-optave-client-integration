/**
 * Shared Script Utilities
 *
 * Common utilities used across governance and validation scripts.
 * Eliminates duplication of browser globals setup, console formatting,
 * and other repeated logic patterns.
 *
 * @fileoverview Shared utilities for build validation scripts
 */

import { EventEmitter } from 'events';

/**
 * Console formatting utilities with consistent styling
 */
export const Console = {
  /**
   * Generate horizontal separator line
   * @param {number} length - Length of separator (default: 80)
   * @param {string} char - Character to repeat (default: '=')
   */
  separator(length = 80, char = '=') {
    return char.repeat(length);
  },

  /**
   * Print header with separator lines
   * @param {string} title - Header title
   * @param {number} width - Width of separator (default: 80)
   */
  header(title, width = 80) {
    console.log(this.separator(width));
    console.log(title);
    console.log(this.separator(width));
  },

  /**
   * Print section with separator
   * @param {string} title - Section title
   * @param {number} width - Width of separator (default: 50)
   */
  section(title, width = 50) {
    console.log(`\n${title}`);
    console.log(this.separator(width));
  },

  /**
   * Status icons for consistent reporting
   */
  icons: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    critical: '🚨',
    info: '📊',
    increase: '📈',
    decrease: '📉'
  }
};

/**
 * Setup browser globals for Node.js environment
 * Provides consistent mocking across scripts that need browser APIs
 */
export function setupBrowserGlobals() {
  // Mock EventTarget for browser builds
  if (!global.EventTarget) {
    global.EventTarget = class EventTarget {
      constructor() {
        this._events = {};
      }

      addEventListener(event, listener) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(listener);
      }

      removeEventListener(event, listener) {
        if (this._events[event]) {
          const index = this._events[event].indexOf(listener);
          if (index > -1) this._events[event].splice(index, 1);
        }
      }

      dispatchEvent(event) {
        if (this._events[event.type]) {
          this._events[event.type].forEach(listener => listener(event));
        }
        return true;
      }
    };
  }

  // Mock Event and CustomEvent
  if (!global.Event) {
    global.Event = class Event {
      constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles || false;
        this.cancelable = options.cancelable || false;
      }
    };
  }

  if (!global.CustomEvent) {
    global.CustomEvent = class CustomEvent extends Event {
      constructor(type, options = {}) {
        super(type);
        this.detail = options.detail;
      }
    };
  }

  // Mock crypto.getRandomValues for UUID generation
  if (!global.crypto) {
    global.crypto = {};
  }
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }

  // Mock WebSocket
  if (!global.WebSocket) {
    global.WebSocket = class WebSocket extends EventEmitter {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      constructor(url, protocols) {
        super();
        this.url = url;
        this.protocols = protocols;
        this.readyState = WebSocket.CONNECTING;
        this.bufferedAmount = 0;

        // Simulate async connection
        setTimeout(() => {
          this.readyState = WebSocket.OPEN;
          if (this.onopen) this.onopen(new Event('open'));
          this.emit('open', new Event('open'));
        }, 10);
      }

      send(data) {
        if (this.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket is not open');
        }
        // Mock sending - emit message back for testing
        setTimeout(() => {
          if (this.onmessage) this.onmessage({ data });
          this.emit('message', { data });
        }, 5);
      }

      close(code = 1000, reason = '') {
        this.readyState = WebSocket.CLOSING;
        setTimeout(() => {
          this.readyState = WebSocket.CLOSED;
          if (this.onclose) this.onclose({ code, reason });
          this.emit('close', { code, reason });
        }, 5);
      }
    };
  }
}

/**
 * VM Context utilities for UMD script loading
 */
export class VMContextManager {
  constructor() {
    this.context = null;
  }

  /**
   * Create VM context with browser globals
   */
  createContext() {
    setupBrowserGlobals();

    this.context = {
      console,
      require: global.require,
      Buffer: global.Buffer,
      process: global.process,
      global: global,
      EventEmitter,
      EventTarget: global.EventTarget,
      Event: global.Event,
      CustomEvent: global.CustomEvent,
      WebSocket: global.WebSocket,
      crypto: global.crypto,
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval
    };

    return this.context;
  }

  /**
   * Execute UMD script in controlled environment
   * @param {string} script - Script content
   * @param {string} globalName - Global variable name to extract
   * @returns {*} Extracted global variable
   */
  async executeUMD(script, globalName) {
    if (!this.context) {
      this.createContext();
    }

    try {
      const vm = await import('vm');
      const contextObject = vm.createContext(this.context);

      // Execute the script
      vm.runInContext(script, contextObject);

      // Extract the global
      return contextObject[globalName];
    } catch (error) {
      console.error(`Failed to execute UMD script for ${globalName}:`, error);
      return null;
    }
  }

  /**
   * Clean up context
   */
  cleanup() {
    this.context = null;
  }
}

/**
 * File analysis utilities
 */
export class FileAnalyzer {
  /**
   * Analyze export surface of a constructor function
   * @param {Function} BuildClass - Constructor function
   * @param {string} buildName - Build name for identification
   * @returns {Object} Analysis result
   */
  static analyzeExportSurface(BuildClass, buildName) {
    if (!BuildClass || typeof BuildClass !== 'function') {
      return {
        buildName,
        error: 'Invalid or missing constructor function',
        staticProperties: [],
        staticMethods: [],
        instanceMethods: []
      };
    }

    const analysis = {
      buildName,
      error: null,
      staticProperties: [],
      staticMethods: [],
      instanceMethods: []
    };

    try {
      // Analyze static properties and methods
      const staticNames = Object.getOwnPropertyNames(BuildClass);
      staticNames.forEach(name => {
        if (name === 'prototype' || name === 'length' || name === 'name') return;

        const value = BuildClass[name];
        const descriptor = Object.getOwnPropertyDescriptor(BuildClass, name);

        if (typeof value === 'function') {
          analysis.staticMethods.push({
            name,
            enumerable: descriptor?.enumerable || false
          });
        } else {
          analysis.staticProperties.push({
            name,
            type: typeof value,
            enumerable: descriptor?.enumerable || false,
            isObject: value && typeof value === 'object'
          });
        }
      });

      // Analyze prototype methods
      if (BuildClass.prototype) {
        const protoNames = Object.getOwnPropertyNames(BuildClass.prototype);
        protoNames.forEach(name => {
          if (name === 'constructor') return;

          const value = BuildClass.prototype[name];
          const descriptor = Object.getOwnPropertyDescriptor(BuildClass.prototype, name);

          if (typeof value === 'function') {
            analysis.instanceMethods.push({
              name,
              enumerable: descriptor?.enumerable || false
            });
          }
        });
      }
    } catch (error) {
      analysis.error = error.message;
    }

    return analysis;
  }
}

/**
 * Report generation utilities
 */
export class ReportGenerator {
  /**
   * Generate comparison report between analyses
   * @param {Array} analyses - Array of analysis objects
   * @returns {Object} Comparison report
   */
  static generateComparisonReport(analyses) {
    if (!analyses.length) {
      return { consistent: false, errors: ['No analyses provided'] };
    }

    const reference = analyses[0];
    const inconsistencies = [];
    const errors = [];

    // Check for errors in any analysis
    analyses.forEach(analysis => {
      if (analysis.error) {
        errors.push(`${analysis.buildName}: ${analysis.error}`);
      }
    });

    if (errors.length > 0) {
      return { consistent: false, errors, inconsistencies: [] };
    }

    // Compare each analysis against the reference
    for (let i = 1; i < analyses.length; i++) {
      const current = analyses[i];

      // Compare static methods
      const refStaticMethods = new Set(reference.staticMethods.map(m => m.name));
      const currStaticMethods = new Set(current.staticMethods.map(m => m.name));

      const missingStatic = [...refStaticMethods].filter(name => !currStaticMethods.has(name));
      const extraStatic = [...currStaticMethods].filter(name => !refStaticMethods.has(name));

      if (missingStatic.length || extraStatic.length) {
        inconsistencies.push({
          builds: [reference.buildName, current.buildName],
          type: 'static methods',
          missing: missingStatic,
          extra: extraStatic
        });
      }

      // Compare instance methods
      const refInstanceMethods = new Set(reference.instanceMethods.map(m => m.name));
      const currInstanceMethods = new Set(current.instanceMethods.map(m => m.name));

      const missingInstance = [...refInstanceMethods].filter(name => !currInstanceMethods.has(name));
      const extraInstance = [...currInstanceMethods].filter(name => !refInstanceMethods.has(name));

      if (missingInstance.length || extraInstance.length) {
        inconsistencies.push({
          builds: [reference.buildName, current.buildName],
          type: 'instance methods',
          missing: missingInstance,
          extra: extraInstance
        });
      }
    }

    return {
      consistent: inconsistencies.length === 0 && errors.length === 0,
      errors,
      inconsistencies
    };
  }
}