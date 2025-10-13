// Browser crypto polyfill for UUID v7 generation
// This provides a Node.js crypto compatible interface for browser environments
// UUID v7 implementation adapted from https://github.com/LiosK/uuidv7 (Apache-2.0 License)

let cryptoImplementation;

// Initialize crypto implementation with native or fallback methods
if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    cryptoImplementation = globalThis.crypto;
} else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    cryptoImplementation = window.crypto;
} else if (typeof self !== 'undefined' && self.crypto && self.crypto.getRandomValues) {
    cryptoImplementation = self.crypto;
} else {
    // Fallback implementation using Math.random()
    cryptoImplementation = {
        getRandomValues: function(array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    };
}

// UUID v7 Generator class adapted from LiosK/uuidv7
class V7Generator {
    constructor() {
        this.timestamp = 0;
        this.counter = 0;
        this.random = this._getRandomNumberGenerator();
    }

    _getRandomNumberGenerator() {
        if (typeof cryptoImplementation !== 'undefined' && typeof cryptoImplementation.getRandomValues !== 'undefined') {
            return new BufferedCryptoRandom();
        } else {
            // Fallback using Math.random()
            return {
                nextUint32: () => Math.trunc(Math.random() * 0x10000) * 0x10000 + Math.trunc(Math.random() * 0x10000)
            };
        }
    }

    generate() {
        return this.generateOrResetCore(Date.now(), 10000);
    }

    generateOrResetCore(unixTsMs, rollbackAllowance) {
        let value = this.generateOrAbortCore(unixTsMs, rollbackAllowance);
        if (value === undefined) {
            this.timestamp = 0;
            value = this.generateOrAbortCore(unixTsMs, rollbackAllowance);
        }
        return value;
    }

    generateOrAbortCore(unixTsMs, rollbackAllowance) {
        const MAX_COUNTER = 0x3fffffff_fff;

        if (!Number.isInteger(unixTsMs) || unixTsMs < 1 || unixTsMs > 0xffffffffffff) {
            throw new RangeError('unixTsMs must be a 48-bit positive integer');
        }

        if (unixTsMs > this.timestamp) {
            this.timestamp = unixTsMs;
            this.resetCounter();
        } else if (unixTsMs + rollbackAllowance >= this.timestamp) {
            this.counter++;
            if (this.counter > MAX_COUNTER) {
                this.timestamp++;
                this.resetCounter();
            }
        } else {
            return undefined;
        }

        return this.fromFieldsV7(
            this.timestamp,
            Math.trunc(this.counter / (2 ** 30)),
            this.counter & (2 ** 30 - 1),
            this.random.nextUint32()
        );
    }

    resetCounter() {
        this.counter = this.random.nextUint32() * 0x400 + (this.random.nextUint32() & 0x3ff);
    }

    fromFieldsV7(unixTsMs, randA, randBHi, randBLo) {
        const bytes = new Uint8Array(16);
        bytes[0] = unixTsMs / (2 ** 40);
        bytes[1] = unixTsMs / (2 ** 32);
        bytes[2] = unixTsMs / (2 ** 24);
        bytes[3] = unixTsMs / (2 ** 16);
        bytes[4] = unixTsMs / (2 ** 8);
        bytes[5] = unixTsMs;
        bytes[6] = 0x70 | (randA >>> 8);
        bytes[7] = randA;
        bytes[8] = 0x80 | (randBHi >>> 24);
        bytes[9] = randBHi >>> 16;
        bytes[10] = randBHi >>> 8;
        bytes[11] = randBHi;
        bytes[12] = randBLo >>> 24;
        bytes[13] = randBLo >>> 16;
        bytes[14] = randBLo >>> 8;
        bytes[15] = randBLo;

        return this.bytesToString(bytes);
    }

    bytesToString(bytes) {
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        return [
            hex.substring(0, 8),
            hex.substring(8, 12),
            hex.substring(12, 16),
            hex.substring(16, 20),
            hex.substring(20, 32)
        ].join('-');
    }
}

// Buffered crypto random number generator
class BufferedCryptoRandom {
    constructor() {
        this.buffer = new Uint32Array(8);
        this.cursor = 0xffff;
    }

    nextUint32() {
        if (this.cursor >= this.buffer.length) {
            cryptoImplementation.getRandomValues(this.buffer);
            this.cursor = 0;
        }
        return this.buffer[this.cursor++];
    }
}

// Create default generator instance
let defaultGenerator = null;

// Override randomUUID and generateUUID to use UUID v7
cryptoImplementation.randomUUID = function() {
    if (!defaultGenerator) {
        defaultGenerator = new V7Generator();
    }
    return defaultGenerator.generate();
};

cryptoImplementation.generateUUID = function() {
    if (!defaultGenerator) {
        defaultGenerator = new V7Generator();
    }
    return defaultGenerator.generate();
};

// Generate short ID using UUID v7 for cryptographic security
// Returns first 9 characters of UUID v7 (without hyphens) for backward compatibility
cryptoImplementation.generateShortId = function() {
    return defaultGenerator.generate().replace(/-/g, '').substring(0, 9);
};

// Ensure crypto is available globally for UUID library
// Check if crypto property is configurable before attempting to set it
function setSafeCrypto(globalObj, propName) {
    if (!globalObj || globalObj.crypto) return; // Already exists

    try {
        const descriptor = Object.getOwnPropertyDescriptor(globalObj, propName);
        if (!descriptor || descriptor.configurable !== false) {
            globalObj.crypto = cryptoImplementation;
        }
    } catch (error) {
        // Ignore errors when crypto property is read-only (e.g., in JSDOM)
        console.debug('Cannot set crypto property on', globalObj.constructor.name, ':', error.message);
    }
}

if (typeof globalThis !== 'undefined') {
    setSafeCrypto(globalThis, 'crypto');
}
if (typeof window !== 'undefined') {
    setSafeCrypto(window, 'crypto');
}
if (typeof self !== 'undefined') {
    setSafeCrypto(self, 'crypto');
}

// Support both CommonJS and ES modules with environment detection
try {
    // Check if we're in a CommonJS environment where module.exports is writable
    if (typeof module !== 'undefined' && typeof module.exports === 'object' && typeof require !== 'undefined') {
        // CommonJS environment - try to assign, but catch any errors in case it's read-only
        module.exports = cryptoImplementation;
        module.exports.default = cryptoImplementation;
        module.exports.getRandomValues = cryptoImplementation.getRandomValues.bind(cryptoImplementation);
        module.exports.randomUUID = cryptoImplementation.randomUUID ? cryptoImplementation.randomUUID.bind(cryptoImplementation) : cryptoImplementation.randomUUID;
        module.exports.generateUUID = cryptoImplementation.generateUUID.bind(cryptoImplementation);
        module.exports.generateShortId = cryptoImplementation.generateShortId.bind(cryptoImplementation);
    }
} catch (e) {
    // ES module environment where module.exports is read-only - ignore the error
    // ES module exports will be used instead
}

// ES module exports for compatibility
export const getRandomValues = cryptoImplementation.getRandomValues.bind(cryptoImplementation);
export const randomUUID = cryptoImplementation.randomUUID ? cryptoImplementation.randomUUID.bind(cryptoImplementation) : cryptoImplementation.randomUUID;
export const generateUUID = cryptoImplementation.generateUUID.bind(cryptoImplementation);
export const generateShortId = cryptoImplementation.generateShortId.bind(cryptoImplementation);

// Default export for integration compatibility
export default cryptoImplementation;