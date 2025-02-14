# Optave Client SDK Documentation

Welcome to the Optave Client SDK documentation. This guide provides an overview of the SDK, instructions on how to set it up, and examples to help you integrate it seamlessly into your JavaScript projects.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Authentication](#authentication)
5. [Establishing a WebSocket Connection](#establishing-a-websocket-connection)
6. [Event Handling](#event-handling)
7. [Sending Messages](#sending-messages)
8. [Payload Structure](#payload-structure)
9. [Example Usage](#example-usage)
10. [API Reference](#api-reference)
11. [Error Handling](#error-handling)

## Introduction

The **Optave Client SDK** is a JavaScript library designed to facilitate seamless communication between your application and the Optave backend services via WebSockets and RESTful APIs. It provides a structured way to authenticate, manage sessions, handle user interactions, and send various types of messages with ease.

Key Features:

- **Event-Driven Architecture**: Leveraging Node.js's `EventEmitter` to handle asynchronous events.
- **Authentication Support**: Securely authenticate using client credentials.
- **WebSocket Management**: Easily establish and manage WebSocket connections.
- **Structured Payloads**: Automatically merges user-provided data with default payload structures.
- **Extensible Methods**: Predefined methods for common actions like adjusting settings, elevating issues, summarizing interactions, and more.

## Installation

To install the Optave Client SDK, use npm or yarn:

```bash
npm install @optave/client-sdk
```

or

```bash
yarn add @optave/client-sdk
```

## Configuration

Before using the SDK, you need to configure it with the necessary parameters. The primary configuration options include:

- **websocketUrl**: The URL for the WebSocket connection.
- **authenticationUrl**: (Optional) The URL for authentication, if you intend to use the `authenticate` method.
- **clientId**: (Optional) Your client ID for authentication, if you intend to use the `authenticate` method.
- **clientSecret**: (Optional) Your client secret for authentication, if you intend to use the `authenticate` method.

### Example Configuration

```javascript
import OptaveJavaScriptSDK from '@optave/client-sdk';

const optaveClient = new OptaveJavaScriptSDK({
    websocketUrl: process.env.OPTAVE__WEBSOCKET_URL,
    authenticationUrl: process.env.OPTAVE__AUTHENTICATION_URL,
    clientId: process.env.OPTAVE__CLIENT_ID,
    clientSecret: process.env.OPTAVE__CLIENT_SECRET,
});
```

## Authentication

If your setup requires authentication, the SDK provides an `authenticate` method to obtain an access token using client credentials.

### Usage

```javascript
async function authenticateClient() {
    try {
        const token = await optaveClient.authenticate();
        console.log('Authentication successful. Token:', token);
    } catch (error) {
        console.error('Authentication failed:', error);
    }
}
```

**Note**: Ensure that `authenticationUrl`, `clientId`, and `clientSecret` are correctly set in the configuration.

## Establishing a WebSocket Connection

After authentication (if required), you can establish a WebSocket connection using the obtained token.

### Usage

```javascript
async function connectWebSocket() {
    const token = await optaveClient.authenticate();
    optaveClient.openConnection(token);
}
```

## Event Handling

The SDK emits several events to handle various states and messages. You can listen to these events to manage your application's behavior accordingly.

### Available Events

- **open**: Emitted when the WebSocket connection is successfully opened.
- **message**: Emitted when a message is received from the server.
- **error**: Emitted when an error occurs.
- **close**: Emitted when the WebSocket connection is closed.

### Listening to Events

```javascript
optaveClient.on('open', () => {
    console.log('WebSocket connection opened.');
});

optaveClient.on('message', (payload) => {
    const message = JSON.parse(payload);
    console.log('Received message:', message);
});

optaveClient.on('error', (error) => {
    console.error('An error occurred:', error);
});

optaveClient.on('close', () => {
    console.log('WebSocket connection closed.');
});
```

## Sending Messages

The SDK provides several methods to send different types of messages through the WebSocket connection. Each method corresponds to a specific action type.

### Available Methods

- **adjust(params)**: Sends an adjust message.
- **elevate(params)**: Sends an elevate message.
- **customerInteraction(params)**: Sends a customer interaction message.
- **summarize(params)**: Sends a summarize message.
- **translate(params)**: Sends a translate message.
- **recommend(params)**: Sends a recommend message.
- **insights(params)**: Sends an insights message.

### Example: Sending a Customer Interaction Message

```javascript
const customerInteractionParams = {
    user: {
        user_name: 'testUser',
    },
    agent: {
        agent_name: 'testAgent',
    },
    session: {
        user_perspective: [
            {
                role: 'EndUser',
                content: 'I need help with my order.',
                name: 'initial-query',
            }
        ]
    },
    request: {
        output_language: 'en-US',
        interface_language: 'en-US',
        settings: {
            disable_stream: false,
        },
        content: 'I need help with my order.',
        medium: 'voice',
    },
};

optaveClient.customerInteraction(customerInteractionParams);
```

## Payload Structure

The SDK manages a default payload structure that encapsulates session information, user details, agent information, requests, and more. When sending a message, you provide a `params` object that is merged with the default payload to form the final payload sent over the WebSocket.

### Default Payload Overview

- **session**: Contains session-related data like SDK version, session IDs, user perspective, interactions, feedbacks, etc.
- **request**: Details about the request such as type, action, status, content, medium, and settings.
- **client**: Information about the client organization.
- **agent**: Details about the agent handling the session.
- **user**: Information about the user, including preferences and behavioral data.

### Merging Strategy

The SDK performs a **selective deep merge** where the user-provided `params` are merged "on top" of the default payload. Arrays in the payload are replaced entirely by the arrays provided in `params`.

## Example Usage

Below is a comprehensive example demonstrating how to initialize the SDK, authenticate, establish a connection, handle events, and send a customer interaction message.

### Sample Module Using the SDK

```javascript
import OptaveJavaScriptSDK from '@optave/client-sdk';

const optaveClient = new OptaveJavaScriptSDK({
    websocketUrl: process.env.OPTAVE__WEBSOCKET_URL,

    // These parameters are only required when using the authenticate() function.
    // In some cases, the authentication token can be obtained manually or through
    // another process, which makes the authenticate() call unnecessary. In this
    // case, only the openConnection function has to be called, passing the existing token value
    authenticationUrl: process.env.OPTAVE__AUTHENTICATION_URL,
    clientId: process.env.OPTAVE__CLIENT_ID,
    clientSecret: process.env.OPTAVE__CLIENT_SECRET,
});

async function run() {
    // Listen for messages from the WebSocket
    optaveClient.on('message', payload => {
        const message = JSON.parse(payload);
        const { actionType, state, action } = message;
    
        console.log(`Action: ${action} / State: ${state} / Action Type: ${actionType}`);
    });
    
    // Handle errors
    optaveClient.on('error', error => {
        if (typeof error === 'string') {
            console.error(error);
        } else {
            console.error('Error:', error);
        }
    });
    
    // When the connection is opened, send a customer interaction message
    optaveClient.on('open', () => {
        const customerInteractionParams = {
            user: {
                user_name: 'testUser',
            },
            agent: {
                agent_name: 'testAgent',
            },
            session: {
                user_perspective: [
                    {
                        role: 'EndUser',
                        content: 'I need help with my order.',
                        name: 'initial-query',
                    }
                ]
            },
            request: {
                output_language: 'en-US',
                interface_language: 'en-US',
                settings: {
                    disable_stream: false,
                },
                content: 'I need help with my order.',
                medium: 'voice',
            },
        };
    
        optaveClient.customerInteraction(customerInteractionParams);
    });

    // Authenticate and open the WebSocket connection
    try {
        const token = await optaveClient.authenticate();
        optaveClient.openConnection(token);
    } catch (error) {
        console.error('Failed to authenticate and connect:', error);
    }
}

run();
```

## API Reference

### `OptaveJavaScriptSDK(options)`

Creates a new instance of the OptaveJavaScriptSDK.

- **Parameters**:
  - `options` *(Object)*: Configuration options.
    - `websocketUrl` *(string)*: The WebSocket URL.
    - `authenticationUrl` *(string, optional)*: The authentication URL.
    - `clientId` *(string, optional)*: The client ID for authentication.
    - `clientSecret` *(string, optional)*: The client secret for authentication.

### `authenticate()`

Authenticates the client using the provided credentials and retrieves an access token.

- **Returns**: *(Promise<string>)* The access token.

### `openConnection(bearerToken)`

Establishes a WebSocket connection using the provided bearer token.

- **Parameters**:
  - `bearerToken` *(string)*: The authentication token.

### `closeConnection()`

Closes the active WebSocket connection.

### `send(requestType, action, params, version)`

Sends a message through the WebSocket connection.

- **Parameters**:
  - `requestType` *(string)*: The type of the request.
  - `action` *(string)*: The specific action to perform.
  - `params` *(Object)*: The parameters for the request.
  - `version` *(number, optional)*: The payload version (default is `2`).

### Predefined Methods

These methods are shortcuts for sending specific types of messages.

- **adjust(params)**: Sends an `adjust` message.
- **elevate(params)**: Sends an `elevate` message.
- **customerInteraction(params)**: Sends a `customerinteraction` message.
- **summarize(params)**: Sends a `summarize` message.
- **translate(params)**: Sends a `translate` message.
- **recommend(params)**: Sends a `recommend` message.
- **insights(params)**: Sends an `insights` message.

### EventEmitter Methods

Since `OptaveJavaScriptSDK` extends `EventEmitter`, you can use all standard `EventEmitter` methods such as `on`, `once`, `emit`, etc.

## Error Handling

The SDK includes robust error handling to ensure that issues are communicated effectively.

### Emitting Errors

Errors are emitted via the `error` event. You can listen to this event to handle errors gracefully.

```javascript
optaveClient.on('error', (error) => {
    console.error('An error occurred:', error);
});
```

### Common Error Scenarios

- **Missing Configuration**: Errors will be emitted if required configuration options like `websocketUrl` or `authenticationUrl` are missing.
- **Authentication Failure**: If authentication fails, an error with the corresponding message will be emitted.
- **WebSocket Issues**: Errors related to WebSocket connections, such as connection failures or unexpected closures, will be emitted.

### Error Object Structure

When an error is emitted, it follows the following structure:

```javascript
{
    category: 'WEBSOCKET', // Error category (available types: AUTHENTICATION, OCO, VALIDATION, WEBSOCKET)
    code: 'INVALID_WEBSOCKET_URL', // Error code that identifies which error just happened
    message: 'Empty or invalid Websocket URL', // Error message explaining the problem
    details: null // Error details which may or not bring additional information
    suggestions: [] // List of suggestions on how to fix the error
}
