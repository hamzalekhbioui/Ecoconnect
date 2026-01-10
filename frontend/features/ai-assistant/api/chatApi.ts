// Use relative path so requests go through Vite proxy
// This enables the app to work via Ngrok or any other forwarding URL
const API_BASE_URL = '/api';

export interface ChatResponse {
    response: string;
    sessionId: string;
}

/**
 * Send a chat message to the LangChain backend
 */
export const sendChatMessage = async (
    message: string,
    sessionId?: string
): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
    }

    return response.json();
};

/**
 * Clear conversation history for a session
 */
export const clearChatHistory = async (sessionId: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/chat/clear`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
    });
};
