/**
 * Salesforce Lightning Integration Example
 *
 * This example demonstrates how to use the Optave SDK in Salesforce Lightning
 * environments including Lightning Components, Lightning Web Components (LWC),
 * and Lightning Locker Service.
 *
 * IMPORTANT: Use the Browser UMD build (browser.umd.js) for Salesforce compatibility
 */

// For Salesforce Lightning - the SDK is loaded via static resource
// Include browser.umd.js as a static resource in your Salesforce org

/**
 * Lightning Component (Aura) Integration
 *
 * In your Lightning Component:
 * 1. Add browser.umd.js as a static resource
 * 2. Include it in your component using ltng:require
 * 3. Access the SDK via the global OptaveJavaScriptSDK
 */

// Example Lightning Component Controller (.js)
({
    doInit: function(component, event, helper) {
        console.log('🚀 Initializing Optave SDK in Lightning Component...');

        // Access SDK from global scope (loaded via static resource)
        // UMD build exports directly to globalThis for Lightning Locker compatibility
        const OptaveSDK = globalThis.OptaveJavaScriptSDK;

        if (!OptaveSDK) {
            console.error('❌ Optave SDK not found. Ensure browser.umd.js is loaded as static resource.');
            return;
        }

        // Initialize SDK with Salesforce-compatible configuration
        const sdk = new OptaveSDK({
            websocketUrl: 'wss://optave-api.force.com/socket', // Use Salesforce-compatible WSS URL
            authTransport: 'subprotocol', // Required for Lightning Locker security

            // Token provider - get token from Salesforce backend
            tokenProvider: async () => {
                try {
                    // Call Salesforce Apex method to get Optave token
                    const action = component.get("c.getOptaveToken");

                    return new Promise((resolve, reject) => {
                        action.setCallback(this, function(response) {
                            if (response.getState() === "SUCCESS") {
                                resolve(response.getReturnValue());
                            } else {
                                reject(new Error(response.getError()[0].message));
                            }
                        });
                        $A.enqueueAction(action);
                    });
                } catch (error) {
                    console.error('Token provider failed:', error);
                    throw error;
                }
            },

            strictValidation: false // Use browser-safe validation for CSP compliance
        });

        // Store SDK instance on component for later use
        component.set("v.optaveSdk", sdk);

        // Set up event handlers
        helper.setupOptaveEvents(component, sdk);

        console.log('✅ Optave SDK initialized in Lightning Component');
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
            console.log('✅ Lightning: WebSocket connected');
            component.set("v.connectionStatus", "Connected");
        });

        sdk.on('message', function(payload) {
            try {
                const message = JSON.parse(payload);
                console.log('📨 Lightning: Received message:', message.headers?.action);

                // Update component UI with response
                this.handleOptaveResponse(component, message);
            } catch (error) {
                console.error('Lightning: Failed to parse message:', error);
            }
        }.bind(this));

        sdk.on('error', function(error) {
            console.error('❌ Lightning: SDK error:', error.category, error.message);
            component.set("v.connectionStatus", "Error: " + error.message);
        });

        sdk.on('close', function(event) {
            console.log('🔌 Lightning: Connection closed');
            component.set("v.connectionStatus", "Disconnected");
        });
    },

    sendOptaveMessage: function(sdk, messageText) {
        try {
            // Send customer interaction to Optave
            sdk.interaction({
                request: {
                    connections: {
                        threadId: "salesforce-thread-" + Date.now()
                    },
                    context: {
                        organizationId: $A.get("$Organization.Id") // Use Salesforce Org ID
                    },
                    scope: {
                        conversations: [{
                            conversationId: "conv_" + Date.now(),
                            participants: [{
                                participantId: $A.get("$User.Id"),
                                role: "user",
                                displayName: $A.get("$User.FirstName") + " " + $A.get("$User.LastName")
                            }],
                            messages: [{
                                participantId: $A.get("$User.Id"),
                                content: messageText,
                                timestamp: new Date().toISOString()
                            }],
                            metadata: {}
                        }]
                    }
                }
            });

            console.log('✅ Lightning: Message sent to Optave');
        } catch (error) {
            console.error('❌ Lightning: Failed to send message:', error);
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
 * Lightning Web Component (LWC) Integration
 *
 * For LWC, you need to:
 * 1. Import the SDK as a static resource
 * 2. Load it dynamically in your component
 * 3. Use proper LWC patterns for event handling
 */

// Example LWC JavaScript (.js)
/*
import { LightningElement, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import OPTAVE_SDK from '@salesforce/resourceUrl/OptaveSDK'; // Static resource

export default class OptaveChatComponent extends LightningElement {
    @track connectionStatus = 'Disconnected';
    @track messages = [];
    @api recordId; // Current record context

    sdk;

    async connectedCallback() {
        try {
            // Load Optave SDK from static resource
            await loadScript(this, OPTAVE_SDK);

            // Initialize SDK
            await this.initializeOptaveSDK();

        } catch (error) {
            console.error('Failed to load Optave SDK:', error);
            this.connectionStatus = 'Failed to load';
        }
    }

    async initializeOptaveSDK() {
        // Access SDK from global scope - Lightning Locker uses globalThis
        const OptaveSDK = globalThis.OptaveJavaScriptSDK || window.OptaveJavaScriptSDK;

        if (!OptaveSDK) {
            throw new Error('Optave SDK not found in global scope');
        }

        // Initialize with LWC-specific configuration
        this.sdk = new OptaveSDK({
            websocketUrl: 'wss://optave-api.my.salesforce.com/socket',
            authTransport: 'subprotocol',

            tokenProvider: async () => {
                // Call Apex method via imperative call
                const result = await getOptaveToken(); // Import this method
                return result;
            },

            strictValidation: false
        });

        // Set up event handlers
        this.setupEventHandlers();

        console.log('✅ LWC: Optave SDK initialized');
    }

    setupEventHandlers() {
        this.sdk.on('open', () => {
            this.connectionStatus = 'Connected';
            console.log('✅ LWC: WebSocket connected');
        });

        this.sdk.on('message', (payload) => {
            this.handleMessage(JSON.parse(payload));
        });

        this.sdk.on('error', (error) => {
            console.error('❌ LWC: SDK error:', error);
            this.connectionStatus = `Error: ${error.message}`;
        });

        this.sdk.on('close', () => {
            this.connectionStatus = 'Disconnected';
            console.log('🔌 LWC: Connection closed');
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
                        threadId: `lwc-${this.recordId}-${Date.now()}`
                    },
                    scope: {
                        conversations: [{
                            conversationId: "conv_" + Date.now(),
                            participants: [{
                                participantId: "salesforce_user_" + Date.now(),
                                role: "user",
                                displayName: "Salesforce User"
                            }],
                            messages: [{
                                participantId: "salesforce_user_" + Date.now(),
                                content: messageText,
                                timestamp: new Date().toISOString()
                            }],
                            metadata: {}
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
 * Salesforce-Specific Configuration Notes
 */

// 1. Static Resource Setup
// Upload browser.umd.js as a static resource named "OptaveSDK"

// 2. Required Apex Controller for Token Management
/*
public with sharing class OptaveController {
    @AuraEnabled(cacheable=false)
    public static String getOptaveToken() {
        try {
            // Make HTTP callout to your backend to get Optave token
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://your-backend.com/api/optave/token');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Authorization', 'Bearer ' + getYourBackendToken());

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                return (String) result.get('token');
            } else {
                throw new AuraHandledException('Failed to get Optave token: ' + res.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Token retrieval error: ' + e.getMessage());
        }
    }

    private static String getYourBackendToken() {
        // Implement your backend authentication logic
        return 'your-backend-auth-token';
    }
}
*/

// 3. Lightning Component Markup (.cmp)
/*
<aura:component implements="lightning:availableForFlowScreens,force:appHostable">
    <ltng:require scripts="{!$Resource.OptaveSDK}" afterScriptsLoaded="{!c.doInit}"/>

    <aura:attribute name="optaveSdk" type="Object"/>
    <aura:attribute name="connectionStatus" type="String" default="Connecting..."/>
    <aura:attribute name="messageText" type="String"/>
    <aura:attribute name="chatResponses" type="List"/>

    <div class="slds-card">
        <div class="slds-card__header">
            <h2>Optave AI Assistant</h2>
            <div class="slds-badge">{!v.connectionStatus}</div>
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
 * Security Considerations for Salesforce
 */

// ✅ LIGHTNING LOCKER COMPLIANCE:
// - Uses browser.umd.js (CSP-compliant, no eval)
// - Accesses SDK via globalThis.OptaveJavaScriptSDK (consistent export pattern)
// - Uses subprotocol auth transport for security
// - No direct WebSocket creation (uses SDK wrapper)

// ✅ WEBSOCKET SECURITY REQUIREMENTS:
// - MUST use wss:// (secure WebSocket) protocol
// - Lightning Locker blocks all ws:// connections
// - No exceptions for .force.com domains
// - SSL/TLS encryption required for all WebSocket traffic
// - Connection fails at runtime if non-SSL URL provided

// ✅ SALESFORCE SECURITY:
// - Tokens fetched via Apex (server-side)
// - No client-side secrets
// - Uses named credentials for external callouts
// - Follows Salesforce security best practices

// ✅ DATA GOVERNANCE:
// - All data flows through Salesforce-controlled backend
// - Audit trail via Salesforce logs
// - User permissions handled by Salesforce
// - Organization isolation maintained

console.log('📚 Salesforce Lightning Integration Guide Loaded');
console.log('   Use server.umd.js as static resource (optimized for Salesforce)');
console.log('   Access via: globalThis.OptaveJavaScriptSDK');
console.log('   Implement token provider with Apex controller');