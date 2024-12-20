const EventEmitter = require('events');
const uuid = require('uuid');
const emitEvent = require('./emitEvent');

class ErrorHandler extends EventEmitter {
	/**
	 * Handles errors and emits an "error" event through the provided emitter.
	 * @param {EventEmitter} emitter - The EventEmitter instance to emit the event.
	 * @param {string|Object} error - The error message or object.
	 * @param {string} action - The action being performed when the error occurred.
	 * @param {string} actionType - The type of action.
	 */
	handleError(emitter, error, action = '', actionType = '') {
		const errorMessage =
			typeof error === 'string' ? error : error.message || 'Unknown error';

		const errorObject = {
			action,
			actionType,
			state: 'error',
			messageID: uuid.v4(),
			message: errorMessage,
			timestamp: new Date().toISOString(),
		};

		// Emit the error through the provided emitter
		emitEvent(emitter, 'error', errorObject);
	}

    /**
	 * Specialized handler for WebSocket errors.
	 */
	handleWebSocketError(
		emitter,
		event,
		action = 'websocket',
		actionType = 'error'
	) {
		this.handleError(
			emitter,
			{
				message: 'WebSocket error occurred.',
				details: event,
				code: 'websocket_error',
			},
			action,
			actionType
		);
	}

	/**
	 * Handles timeouts or other specific error types.
	 */
	handleTimeoutError(emitter, message, action = '', actionType = '') {
		this.handleError(
			emitter,
			{
				message,
				code: 'timeout_error',
			},
			action,
			actionType
		);
	}

	/**
	 * Validates user input and emits validation errors if invalid.
	 */
	validateInputs(emitter, inputs, action = '', actionType = '', schema = {}) {
		const errors = [];

        for (const [key, rules] of Object.entries(schema)) {
            const value = inputs.payload[key];
    
            if (typeof rules.type === 'object' && rules.type !== null) {
                // Recursive validation for nested objects or arrays
                const nestedErrors = this.validateInputs(emitter, { payload: value || {} }, action, actionType, rules.type).errors;
                errors.push(...nestedErrors.map(err => ({ ...err, field: `${key}.${err.field}` })));
            } else {
                if (rules.required && (value === undefined || value === null)) {
                    errors.push({ field: key, message: `${key} is required`, action, actionType });
                } else if (value !== undefined && typeof value !== rules.type) {
                    errors.push({ field: key, message: `${key} must be a ${rules.type}`, action, actionType });
                }
            }
        }

		if (!inputs.action) {
			errors.push({
				code: 'missing_field',
				field: 'action',
				message: 'Action is required',
			});
		}

		if (!inputs.payload || typeof inputs.payload !== 'object') {
			errors.push({
				code: 'invalid_type',
				field: 'payload',
				message: 'Payload must be an object',
			});
		}

		if (errors.length > 0) {
			this.handleError(
				emitter,
				{
					message: 'Input validation errors',
					details: errors,
				},
				action,
				actionType
			);
			return { valid: false, errors };
		}

        return { valid: true };
	}

    /**
	 * Handles OCO-specific errors and normalizes them before emitting.
	 */
	handleOCOErrors(emitter, ocoError, action = '', actionType = '') {
		const normalizedErrors = Array.isArray(ocoError.errors)
			? ocoError.errors.map((err) => ({
					code: err.code || 'unknown_error',
					message: err.message || 'No message provided',
			  }))
			: [];

		this.handleError(
			emitter,
			{
				message: 'OCO Error',
				details: normalizedErrors,
			},
			action,
			actionType
		);
	}
}

module.exports = new ErrorHandler();
