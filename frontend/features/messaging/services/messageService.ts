import { supabase } from '../../../config/supabase';
import { Message } from '../types/messaging';

/**
 * Send a new message in a conversation.
 * Optionally includes an attachment (image or document).
 */
export const sendMessage = async (
    conversationId: string,
    senderId: string,
    content: string,
    attachment?: { url: string; type: 'image' | 'document' }
): Promise<Message> => {
    console.log('[sendMessage] Inserting message:', {
        conversationId,
        senderId,
        content,
        hasAttachment: !!attachment
    });

    const insertData: {
        conversation_id: string;
        sender_id: string;
        content: string;
        attachment_url?: string;
        attachment_type?: string;
    } = {
        conversation_id: conversationId,
        sender_id: senderId,
        content
    };

    // Add attachment fields if provided
    if (attachment) {
        insertData.attachment_url = attachment.url;
        insertData.attachment_type = attachment.type;
    }

    const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select('*')
        .single();

    if (error) {
        console.error('[sendMessage] Insert error:', error);
        throw error;
    }

    console.log('[sendMessage] Message inserted successfully:', data);
    return data as Message;
};

/**
 * Fetch all messages for a conversation.
 */
export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    console.log('[fetchMessages] Fetching messages for conversation:', conversationId);

    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[fetchMessages] Error:', error);
        throw error;
    }

    console.log('[fetchMessages] Fetched', data?.length || 0, 'messages');
    console.log('[fetchMessages] Message sender_ids:', data?.map(m => m.sender_id));

    return data as Message[];
};

/**
 * Mark all unread messages in a conversation as read (for messages not sent by current user).
 */
export const markMessagesAsRead = async (
    conversationId: string,
    currentUserId: string
): Promise<void> => {
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);

    if (error) throw error;
};

/**
 * Delete a message (only allowed for sender).
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

    if (error) throw error;
};
