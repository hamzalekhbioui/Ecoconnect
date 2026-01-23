import { api } from '../../../config/api';
import { Message } from '../types/messaging';

// =============================================================================
// TYPES
// =============================================================================

interface ApiMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrl?: string;
    attachmentType?: 'image' | 'document';
    isRead: boolean;
    createdAt: string;
    sender?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

// =============================================================================
// TRANSFORMERS
// =============================================================================

const transformApiMessage = (apiMsg: ApiMessage): Message => ({
    id: apiMsg.id,
    conversation_id: apiMsg.conversationId,
    sender_id: apiMsg.senderId,
    content: apiMsg.content,
    attachment_url: apiMsg.attachmentUrl,
    attachment_type: apiMsg.attachmentType,
    is_read: apiMsg.isRead,
    created_at: apiMsg.createdAt,
    sender: apiMsg.sender ? {
        id: apiMsg.sender.id,
        full_name: apiMsg.sender.full_name,
        avatar_url: apiMsg.sender.avatar_url ?? null,
    } : undefined,
});

// =============================================================================
// MESSAGE FUNCTIONS
// =============================================================================

/**
 * Send a new message in a conversation.
 * Optionally includes an attachment (image or document).
 */
export const sendMessage = async (
    conversationId: string,
    _senderId: string,
    content: string,
    attachment?: { url: string; type: 'image' | 'document' }
): Promise<Message> => {
    const message = await api.post<ApiMessage>('/api/messages', {
        conversationId,
        content,
        attachmentUrl: attachment?.url,
        attachmentType: attachment?.type,
    });
    return transformApiMessage(message);
};

/**
 * Fetch all messages for a conversation.
 */
export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    const messages = await api.get<ApiMessage[]>(`/api/messages/${conversationId}`);
    return messages.map(transformApiMessage);
};

/**
 * Mark all unread messages in a conversation as read (for messages not sent by current user).
 */
export const markMessagesAsRead = async (
    conversationId: string,
    _currentUserId: string
): Promise<void> => {
    await api.patch(`/api/messages/read/${conversationId}`);
};

/**
 * Delete a message (only allowed for sender).
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
    await api.delete(`/api/messages/${messageId}`);
};
