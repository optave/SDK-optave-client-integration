import OptaveJavaScriptSDK from '../src/main.js';

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
    
    // When the connection is opened, send an adjust message
    optaveClient.once('open', () => {
        optaveClient.adjust({
            user: {
                user_name: 'test',
            },
            agent: {
                agent_name: 'test',
            },
            request: {
                output_language: 'en-US',
                interface_language: 'en-US',
                settings: {
                    disable_stream: true,
                },
                content: 'How are you today?',
                instruction: 'Make it very friendly and funny',
            },
        });
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
