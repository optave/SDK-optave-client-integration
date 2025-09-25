/**
 * URLSearchParams polyfill for browser environments that might not have it
 * Used by server UMD build (which targets Salesforce browser environments)
 */

export default class URLSearchParamsPolyfill {
    constructor(init) {
        this.params = new Map();

        if (typeof init === 'string') {
            // Parse query string
            const pairs = init.replace(/^\?/, '').split('&');
            pairs.forEach(pair => {
                if (pair) {
                    const [key, value] = pair.split('=');
                    if (key) {
                        this.params.set(
                            decodeURIComponent(key),
                            decodeURIComponent(value || '')
                        );
                    }
                }
            });
        } else if (init && typeof init === 'object') {
            // Handle object initialization
            if (init instanceof Map) {
                init.forEach((value, key) => {
                    this.params.set(key, String(value));
                });
            } else if (Array.isArray(init)) {
                // Handle array of [key, value] pairs
                init.forEach(([key, value]) => {
                    this.params.set(key, String(value));
                });
            } else {
                // Handle plain object
                Object.entries(init).forEach(([key, value]) => {
                    this.params.set(key, String(value));
                });
            }
        }
    }

    append(name, value) {
        const existing = this.params.get(name);
        if (existing !== undefined) {
            this.params.set(name, existing + ',' + String(value));
        } else {
            this.params.set(name, String(value));
        }
    }

    delete(name) {
        this.params.delete(name);
    }

    get(name) {
        return this.params.get(name) || null;
    }

    getAll(name) {
        const value = this.params.get(name);
        return value ? value.split(',') : [];
    }

    has(name) {
        return this.params.has(name);
    }

    set(name, value) {
        this.params.set(name, String(value));
    }

    toString() {
        const pairs = [];
        this.params.forEach((value, key) => {
            // Handle comma-separated values (from append)
            const values = value.split(',');
            values.forEach(val => {
                pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
            });
        });
        return pairs.join('&');
    }

    *[Symbol.iterator]() {
        for (const [key, value] of this.params) {
            // Handle comma-separated values (from append)
            const values = value.split(',');
            for (const val of values) {
                yield [key, val];
            }
        }
    }

    *keys() {
        for (const [key] of this) {
            yield key;
        }
    }

    *values() {
        for (const [, value] of this) {
            yield value;
        }
    }

    *entries() {
        yield* this;
    }

    forEach(callback, thisArg) {
        for (const [key, value] of this) {
            callback.call(thisArg, value, key, this);
        }
    }
}

// Provide a fallback that uses native URLSearchParams if available, otherwise the polyfill
export const URLSearchParams = (typeof globalThis !== 'undefined' && globalThis.URLSearchParams) ||
                               (typeof window !== 'undefined' && window.URLSearchParams) ||
                               URLSearchParamsPolyfill;