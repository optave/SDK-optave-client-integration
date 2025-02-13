import OptaveJavascriptSDK from '../src/main.js';

const optaveClient = new OptaveJavascriptSDK({
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
    
    // When the connection is opened, send a summarize message
    optaveClient.once('open', () => {
        optaveClient.summarize({
            user: {
                user_name: 'test',
            },
            agent: {
                agent_name: 'test',
            },
            request: {
                output_language: 'pt-BR',
                interface_language: 'en-US',
                settings: {
                    disable_stream: true,
                },
                content: 'In the grand tapestry of daily existence, individuals often find themselves navigating a myriad of experiences that collectively contribute to the intricate mosaic of life. From the moment the sun gracefully ascends the horizon, casting its warm, golden hues upon the world, to the serene twilight that gently ushers in the calm of the evening, each passing moment is imbued with opportunities for growth, reflection, and connection. The interplay of diverse thoughts, emotions, and actions weaves a complex narrative, one that is both uniquely personal and universally relatable. As people engage with their surroundings, whether through meaningful conversations, creative endeavors, or simple acts of kindness, they participate in the ongoing dance of human interaction that shapes not only their own destinies but also the broader collective experience. This continuous flow of events and interactions underscores the profound significance of embracing each day with mindfulness and intention, recognizing that every small step contributes to the larger journey of life itself.',
                instruction: '',
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
