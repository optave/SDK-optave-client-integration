/**
 * Salesforce Lightning Server UMD Integration Example with Unsafe Tokens
 *
 * ⚠️ WARNING: TEMPORARY TESTING CONFIGURATION ⚠️
 * This example uses UNSAFE client credentials for temporary testing during
 * Salesforce security upgrade. This exposes credentials in browser environment.
 *
 * This example demonstrates how to use the Optave SDK Server UMD build (server.umd.js)
 * in Salesforce Lightning environments including Lightning Components, Lightning Web
 * Components (LWC), and Lightning Locker Service with UNSAFE token handling.
 *
 * IMPORTANT: Use the Server UMD build (server.umd.js) as specified for this integration
 */

// For Salesforce Lightning - the SDK is loaded via static resource
// Include server.umd.js as a static resource in your Salesforce org

/**
 * Lightning Component (Aura) Integration with Server UMD Build
 *
 * In your Lightning Component:
 * 1. Add server.umd.js as a static resource
 * 2. Include it in your component using ltng:require
 * 3. Access the SDK via the global OptaveJavaScriptSDK
 */

// Example Lightning Component Controller (.js)
({
    doInit: function(component, event, helper) {
        console.log('🚀 Initializing Optave Server UMD SDK in Lightning Component...');

        // Access SDK from global scope (loaded via static resource)
        // In Salesforce Lightning Locker, use globalThis to access the UMD export
        const OptaveSDK = globalThis.OptaveJavaScriptSDK || window.OptaveJavaScriptSDK;

        if (!OptaveSDK) {
            console.error('❌ Optave Server UMD SDK not found. Ensure server.umd.js is loaded as static resource.');
            return;
        }

        // ⚠️ UNSAFE: Initialize SDK with client credentials (TEMPORARY FOR TESTING)
        const sdk = new OptaveSDK({
            // Example URLs - replace with your actual Optave endpoints
            websocketUrl: 'wss://your-optave-websocket-url.com/',
            authenticationUrl: 'https://your-optave-auth-url.com/auth/oauth2', // SDK automatically appends /token
            authTransport: 'query', // Server UMD uses query parameter method for authentication

            // ⚠️ WARNING: UNSAFE CLIENT CREDENTIALS - FOR TESTING ONLY
            // In production, these should come from secure Salesforce backend
            clientId: component.get("v.optaveClientId"), // From component attribute
            clientSecret: component.get("v.optaveClientSecret"), // From component attribute

            strictValidation: false // Use CSP-compliant validation for Lightning Locker
        });

        // Store SDK instance on component for later use
        component.set("v.optaveSdk", sdk);

        // Set up event handlers
        helper.setupOptaveEvents(component, sdk);

        console.log('✅ Optave Server UMD SDK initialized in Lightning Component');
    },

    sendCustomerMessage: function(component, event, helper) {
        const sdk = component.get("v.optaveSdk");
        const messageText = component.get("v.messageText");

        if (sdk && messageText) {
            helper.sendOptaveMessage(sdk, messageText);
        }
    }
});

// Example Lightning Component Helper (.js)
({
    setupOptaveEvents: function(component, sdk) {
        // Set up SDK event handlers
        sdk.on('open', function() {
            console.log('✅ Lightning Server UMD: WebSocket connected');
            component.set("v.connectionStatus", "Connected");
        });

        sdk.on('message', function(payload) {
            try {
                const message = JSON.parse(payload);
                console.log('📨 Lightning Server UMD: Received message:', message.headers?.action);

                // Update component UI with response
                this.handleOptaveResponse(component, message);
            } catch (error) {
                console.error('Lightning Server UMD: Failed to parse message:', error);
            }
        }.bind(this));

        sdk.on('error', function(error) {
            console.error('❌ Lightning Server UMD: SDK error:', error.category, error.message);
            component.set("v.connectionStatus", "Error: " + error.message);
        });

        sdk.on('close', function(event) {
            console.log('🔌 Lightning Server UMD: Connection closed');
            component.set("v.connectionStatus", "Disconnected");
        });
    },

    sendOptaveMessage: function(sdk, messageText) {
        try {
            // Send customer interaction to Optave using Server UMD patterns
            sdk.interaction({
                request: {
                    connections: {
                        threadId: "salesforce-server-umd-" + Date.now()
                    },
                    context: {
                        organizationId: $A.get("$Organization.Id") // Use Salesforce Org ID
                    },
                    scope: {
                        conversations: [{
                            participants: [{
                                id: $A.get("$User.Id"),
                                role: "user",
                                displayName: $A.get("$User.FirstName") + " " + $A.get("$User.LastName")
                            }],
                            messages: [{
                                id: "msg_" + Date.now(),
                                participantId: $A.get("$User.Id"),
                                content: messageText,
                                timestamp: new Date().toISOString()
                            }]
                        }]
                    }
                }
            });

            console.log('✅ Lightning Server UMD: Message sent to Optave');
        } catch (error) {
            console.error('❌ Lightning Server UMD: Failed to send message:', error);
        }
    },

    handleOptaveResponse: function(component, message) {
        // Handle different types of Optave responses
        switch (message.headers?.action) {
            case 'interaction':
                // Update chat UI with AI response
                const responses = component.get("v.chatResponses") || [];
                responses.push({
                    id: message.headers.correlationId,
                    content: message.payload?.response?.content || 'AI response received',
                    timestamp: message.headers.timestamp,
                    type: 'ai'
                });
                component.set("v.chatResponses", responses);
                break;

            case 'elevate':
                // Handle escalation to human agent
                component.set("v.isEscalated", true);
                this.showToast('Success', 'Escalated to human agent', 'success');
                break;

            default:
                console.log('Unhandled message type:', message.headers?.action);
        }
    },

    showToast: function(title, message, type) {
        const toastEvent = $A.get("e.force:showToast");
        if (toastEvent) {
            toastEvent.setParams({
                title: title,
                message: message,
                type: type
            });
            toastEvent.fire();
        }
    }
});

/**
 * Lightning Web Component (LWC) Integration with Server UMD
 *
 * For LWC, you need to:
 * 1. Import the Server UMD SDK as a static resource
 * 2. Load it dynamically in your component
 * 3. Use proper LWC patterns for event handling
 */

// Example LWC JavaScript (.js)
/*
import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import OPTAVE_SERVER_SDK from '@salesforce/resourceUrl/OptaveServerSDK'; // Static resource

export default class OptaveServerUmdComponent extends LightningElement {
    @track connectionStatus = 'Disconnected';
    @track messages = [];
    @api recordId; // Current record context
    @api optaveClientId; // ⚠️ UNSAFE: Client ID for testing
    @api optaveClientSecret; // ⚠️ UNSAFE: Client Secret for testing

    sdk;

    async connectedCallback() {
        try {
            // Load Optave Server UMD SDK from static resource
            await loadScript(this, OPTAVE_SERVER_SDK);

            // Initialize SDK
            await this.initializeOptaveServerSDK();

        } catch (error) {
            console.error('Failed to load Optave Server UMD SDK:', error);
            this.connectionStatus = 'Failed to load';
        }
    }

    async initializeOptaveServerSDK() {
        // Access Server UMD SDK from global scope - Lightning Locker uses globalThis
        const OptaveSDK = globalThis.OptaveJavaScriptSDK;

        if (!OptaveSDK) {
            throw new Error('Optave Server UMD SDK not found in global scope');
        }

        // ⚠️ UNSAFE: Initialize with client credentials for testing
        this.sdk = new OptaveSDK({
            // Example URLs - replace with your actual Optave endpoints
            websocketUrl: 'wss://your-optave-websocket-url.com/',
            authenticationUrl: 'https://your-optave-auth-url.com/auth/oauth2', // SDK automatically appends /token
            authTransport: 'query', // Server UMD uses query parameter method for authentication

            // ⚠️ WARNING: UNSAFE CLIENT CREDENTIALS - FOR TESTING ONLY
            clientId: this.optaveClientId,
            clientSecret: this.optaveClientSecret,

            strictValidation: false // CSP-compliant for Lightning Locker
        });

        // Set up event handlers
        this.setupEventHandlers();

        console.log('✅ LWC Server UMD: Optave SDK initialized');
    }

    setupEventHandlers() {
        this.sdk.on('open', () => {
            this.connectionStatus = 'Connected';
            console.log('✅ LWC Server UMD: WebSocket connected');
        });

        this.sdk.on('message', (payload) => {
            this.handleMessage(JSON.parse(payload));
        });

        this.sdk.on('error', (error) => {
            console.error('❌ LWC Server UMD: SDK error:', error);
            this.connectionStatus = `Error: ${error.message}`;
        });

        this.sdk.on('close', () => {
            this.connectionStatus = 'Disconnected';
            console.log('🔌 LWC Server UMD: Connection closed');
        });
    }

    handleMessage(message) {
        // Update reactive properties
        this.messages = [...this.messages, {
            id: message.headers?.correlationId || Date.now(),
            content: message.payload?.content || 'Message received',
            timestamp: new Date().toLocaleTimeString(),
            type: 'ai'
        }];
    }

    handleSendMessage(event) {
        const messageText = event.target.value;
        if (this.sdk && messageText) {
            this.sdk.interaction({
                request: {
                    connections: {
                        threadId: `lwc-server-umd-${this.recordId}-${Date.now()}`
                    },
                    context: {
                        organizationId: 'your-org-id' // Should come from Salesforce context
                    },
                    scope: {
                        conversations: [{
                            participants: [{
                                role: "user",
                                displayName: "Salesforce User"
                            }],
                            messages: [{
                                content: messageText,
                                timestamp: new Date().toISOString()
                            }]
                        }]
                    }
                }
            });

            // Clear input
            event.target.value = '';
        }
    }

    disconnectedCallback() {
        // Cleanup on component destroy
        if (this.sdk) {
            this.sdk.closeConnection();
        }
    }
}
*/

/**
 * Salesforce-Specific Configuration Notes for Server UMD Build
 */

// 1. Static Resource Setup
// Upload server.umd.js as a static resource named "OptaveServerSDK"

// 2. ⚠️ UNSAFE Apex Controller for Testing (TEMPORARY)
/*
public with sharing class OptaveServerUmdController {

    // ⚠️ WARNING: This exposes credentials - FOR TESTING ONLY
    @AuraEnabled(cacheable=false)
    public static Map<String, String> getOptaveCredentials() {
        try {
            // ⚠️ UNSAFE: Return client credentials directly
            // In production, this should never expose credentials
            return new Map<String, String>{
                'clientId' => 'your-test-client-id',
                'clientSecret' => 'your-test-client-secret',
                'organizationId' => 'your-test-org-id'
            };
        } catch (Exception e) {
            throw new AuraHandledException('Failed to get credentials: ' + e.getMessage());
        }
    }

    // Future secure method placeholder
    @AuraEnabled(cacheable=false)
    public static String getOptaveSecureToken() {
        // TODO: Implement secure token retrieval
        // This will replace the unsafe credential exposure
        throw new AuraHandledException('Secure token method not yet implemented');
    }
}
*/

// 3. Lightning Component Markup (.cmp)
/*
<aura:component implements="lightning:availableForFlowScreens,force:appHostable">
    <ltng:require scripts="{!$Resource.OptaveServerSDK}" afterScriptsLoaded="{!c.doInit}"/>

    <aura:attribute name="optaveSdk" type="Object"/>
    <aura:attribute name="connectionStatus" type="String" default="Connecting..."/>
    <aura:attribute name="messageText" type="String"/>
    <aura:attribute name="chatResponses" type="List"/>

    <!-- ⚠️ UNSAFE: Client credentials as component attributes -->
    <aura:attribute name="optaveClientId" type="String" default="your-test-client-id"/>
    <aura:attribute name="optaveClientSecret" type="String" default="your-test-client-secret"/>

    <div class="slds-card">
        <div class="slds-card__header">
            <h2>Optave AI Assistant (Server UMD - UNSAFE)</h2>
            <div class="slds-badge">{!v.connectionStatus}</div>
            <div class="slds-text-color_error slds-text-body_small">
                ⚠️ WARNING: Using unsafe client credentials for testing
            </div>
        </div>
        <div class="slds-card__body">
            <!-- Chat messages -->
            <aura:iteration items="{!v.chatResponses}" var="response">
                <div class="slds-chat-message">
                    <span class="slds-text-body_small">{!response.timestamp}</span>
                    <p>{!response.content}</p>
                </div>
            </aura:iteration>
        </div>
        <div class="slds-card__footer">
            <lightning:input value="{!v.messageText}" placeholder="Type your message..."/>
            <lightning:button label="Send" onclick="{!c.sendCustomerMessage}"/>
        </div>
    </div>
</aura:component>
*/

/**
 * Security Considerations for Salesforce Lightning Server UMD
 */

// ✅ LIGHTNING LOCKER COMPLIANCE:
// - Uses server.umd.js (includes full AJV validation)
// - Accesses SDK via globalThis.OptaveJavaScriptSDK
// - Uses query parameter auth transport for server UMD compatibility
// - CSP-compliant configuration (strictValidation: false)

// 🔧 CRITICAL CONFIGURATION NOTES:
// - authenticationUrl can be base OAuth2 URL (SDK automatically appends /token)
// - authTransport MUST be 'query' for server UMD builds
// - Server UMD does not support 'subprotocol' authentication method
// - WebSocket connections use query parameter: ?Authorization=token_value

// ⚠️ WEBSOCKET SECURITY REQUIREMENTS:
// - MUST use wss:// (secure WebSocket) protocol
// - Lightning Locker blocks all ws:// connections
// - No exceptions for .force.com domains
// - SSL/TLS encryption required for all WebSocket traffic

// ⚠️ UNSAFE AUTHENTICATION (TEMPORARY):
// - Client credentials exposed in browser environment
// - Only for testing during security upgrade process
// - Clear migration path to secure token-based auth
// - All code marked with warnings

// ✅ DATA GOVERNANCE:
// - All data flows through Salesforce-controlled components
// - Audit trail via Salesforce logs
// - User permissions handled by Salesforce
// - Organization isolation maintained

// 🚨 MIGRATION TO SECURE IMPLEMENTATION:
// Replace unsafe credentials with:
// - Server-side token generation via Apex
// - Named credentials for external callouts
// - Secure token refresh mechanisms
// - No client-side credential exposure

console.log('📚 Salesforce Lightning Server UMD Integration Guide Loaded');
console.log('   ⚠️ WARNING: Using UNSAFE client credentials for testing');
console.log('   Use server.umd.js as static resource');
console.log('   Access via: globalThis.OptaveJavaScriptSDK');
console.log('   🚨 MIGRATE to secure token-based auth ASAP');

/**
 * Migration Guide: From Unsafe to Secure
 *
 * CURRENT (UNSAFE):
 * clientId: 'direct-credential',
 * clientSecret: 'direct-credential'
 *
 * SECURE TARGET:
 * tokenProvider: async () => {
 *   const result = await getOptaveSecureToken();
 *   return result;
 * }
 *
 * Steps:
 * 1. Implement secure Apex token method
 * 2. Update all components to use tokenProvider
 * 3. Remove all client credential references
 * 4. Deploy and test secure implementation
 * 5. Delete this unsafe integration file
 */