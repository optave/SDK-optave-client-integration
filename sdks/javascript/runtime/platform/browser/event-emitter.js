/**
 * Browser-compatible EventEmitter implementation
 * Provides Node.js EventEmitter API using DOM EventTarget
 */
export default class EventEmitter extends EventTarget {
    constructor() {
        super();
        this._events = {};
        this._eventsCount = 0; // Node.js EventEmitter compatibility
    }

    on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
        this._eventsCount++; // Update count for Node.js compatibility

        // Wrap listener to handle CustomEvent.detail extraction
        const wrappedListener = (customEvent) => {
            if (customEvent.detail && Array.isArray(customEvent.detail)) {
                listener(...customEvent.detail);
            } else {
                listener(customEvent.detail || customEvent);
            }
        };

        // Store the wrapped listener for removal
        listener._wrapped = wrappedListener;
        this.addEventListener(event, wrappedListener);
        return this;
    }

    off(event, listener) {
        if (this._events[event]) {
            const index = this._events[event].indexOf(listener);
            if (index > -1) {
                this._events[event].splice(index, 1);
                this._eventsCount--; // Update count for Node.js compatibility

                // Clean up empty event arrays
                if (this._events[event].length === 0) {
                    delete this._events[event];
                }
            }
        }

        // Remove the wrapped listener
        if (listener._wrapped) {
            this.removeEventListener(event, listener._wrapped);
            delete listener._wrapped;
        }
        return this;
    }

    removeListener(event, listener) {
        return this.off(event, listener);
    }

    emit(event, ...args) {
        // Use only DOM EventTarget dispatch to avoid double execution
        // The wrapped listeners will handle calling the original listeners
        const customEvent = new CustomEvent(event, { detail: args });
        this.dispatchEvent(customEvent);
        return this;
    }

    once(event, listener) {
        const onceListener = (...args) => {
            this.off(event, onceListener); // This will properly update _eventsCount
            listener(...args);
        };
        return this.on(event, onceListener); // This will properly update _eventsCount
    }

    listenerCount(event) {
        return this._events[event] ? this._events[event].length : 0;
    }

    removeAllListeners(event) {
        if (event) {
            if (this._events[event]) {
                const count = this._events[event].length;
                this._events[event].forEach(listener => {
                    // Remove wrapped listeners from DOM
                    if (listener._wrapped) {
                        this.removeEventListener(event, listener._wrapped);
                        delete listener._wrapped;
                    }
                });
                delete this._events[event];
                this._eventsCount = Math.max(0, this._eventsCount - count); // Update count
            }
        } else {
            // Remove all events
            const totalCount = Object.values(this._events).reduce((sum, listeners) => sum + listeners.length, 0);
            Object.keys(this._events).forEach(e => this.removeAllListeners(e));
            this._eventsCount = 0; // Reset to 0 when all listeners removed
        }
        return this;
    }
}