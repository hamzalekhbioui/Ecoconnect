import { api } from '../../../config/api';
import { Conversation } from '../types/messaging';

// =============================================================================
// TYPES
// =============================================================================

interface ApiConversation {
    id: string;
    participant1: string;
    participant2: string;
    lastMessageAt: string;
    createdAt: string;
    otherUser: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    lastMessage?: {
        id: string;
        content: string;
        created_at: string;
        sender_id: string;
        is_read: boolean;
    };
    unreadCount: number;
}

// =============================================================================
// TRANSFORMERS
// =============================================================================

const transformApiConversation = (apiConv: ApiConversation): Conversation => ({
    id: apiConv.id,
    participant_1: apiConv.participant1,
    participant_2: apiConv.participant2,
    last_message_at: apiConv.lastMessageAt,
    created_at: apiConv.createdAt,
    otherUser: {
        id: apiConv.otherUser.id,
        full_name: apiConv.otherUser.full_name,
        avatar_url: apiConv.otherUser.avatar_url ?? null,
    },
    lastMessage: apiConv.lastMessage ? {
        id: apiConv.lastMessage.id,
        conversation_id: apiConv.id,
        sender_id: apiConv.lastMessage.sender_id,
        content: apiConv.lastMessage.content,
        is_read: apiConv.lastMessage.is_read,
        created_at: apiConv.lastMessage.created_at,
    } : null,
    unreadCount: apiConv.unreadCount,
});

// =============================================================================
// CONVERSATION FUNCTIONS
// =============================================================================

/**
 * Find an existing conversation or create a new one between two users.
 * Uses normalized ordering to prevent duplicate conversations.
 * IMPORTANT: Only allows conversations between accepted friends.
 */
export const findOrCreateConversation = async (
    _currentUserId: string,
    otherUserId: string
): Promise<{ id: string; isNew: boolean; error?: string }> => {
    try {
        const result = await api.post<{ id: string; isNew: boolean }>('/api/conversations', {
            userId: otherUserId,
        });
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create conversation';
        return { id: '', isNew: false, error: message };
    }
};

/**
 * Fetch all conversations for a user with participant profiles and last message.
 */
export const fetchConversations = async (_userId: string): Promise<Conversation[]> => {
    const conversations = await api.get<ApiConversation[]>('/api/conversations');
    return conversations.map(transformApiConversation);
};

/**
 * Get a single conversation by ID.
 */
export const getConversation = async (conversationId: string, _userId: string): Promise<Conversation | null> => {
    try {
        const conversation = await api.get<ApiConversation>(`/api/conversations/${conversationId}`);
        return transformApiConversation(conversation);
    } catch (error) {
        console.error('[conversationService] Error getting conversation:', error);
        return null;
    }
};
