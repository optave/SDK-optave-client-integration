const EventEmitter = require('events');

/**
 * Utility function to emit events with a consistent structure.
 * @param {EventEmitter} emitter - The EventEmitter instance emitting the event.
 * @param {string} eventName - The name of the event.
 * @param {Object} data - Additional data to include in the event payload.
 */
function emitEvent(emitter, eventName, data = {}) {
    if (!(emitter instanceof EventEmitter)) {
        throw new Error('Emitter must be an instance of EventEmitter');
    }

    const eventObject = {
        eventName,
        timestamp: new Date().toISOString(),
        data,
    };

    emitter.emit(eventName, eventObject);
}

module.exports = {
    emitEvent,
};
