import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types/messaging';
import { fetchMessages, markMessagesAsRead, sendMessage as sendMessageService } from '../services/messageService';
import { uploadAttachment, AttachmentType } from '../services/attachmentService';
import { supabase } from '../../../config/supabase';

interface UseMessagesResult {
    messages: Message[];
    isLoading: boolean;
    error: Error | null;
    sendMessage: (content: string, file?: File, fileType?: AttachmentType) => Promise<void>;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage messages for a specific conversation with real-time updates.
 */
export const useMessages = (
    conversationId: string | null,
    currentUserId: string | null | undefined
): UseMessagesResult => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadMessages = useCallback(async () => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        try {
            setIsLoading(true);
            const data = await fetchMessages(conversationId);
            setMessages(data);
            setError(null);

            // Mark messages as read when loading
            if (currentUserId) {
                await markMessagesAsRead(conversationId, currentUserId);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, currentUserId]);

    // Initial load
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Real-time subscription for new messages
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    const newMessage = payload.new as Message;
                    console.log('[useMessages] Realtime INSERT received:', newMessage.id, 'sender:', newMessage.sender_id);

                    // Check if message already exists (from optimistic update)
                    setMessages((prev) => {
                        const exists = prev.some(m => m.id === newMessage.id);
                        if (exists) {
                            console.log('[useMessages] Message already exists, skipping duplicate');
                            return prev;
                        }

                        // Fetch the sender profile for the new message
                        return prev; // Will be updated after profile fetch
                    });

                    // Fetch the sender profile for the new message
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    const messageWithSender: Message = {
                        ...newMessage,
                        sender: senderData || undefined,
                    };

                    setMessages((prev) => {
                        const exists = prev.some(m => m.id === newMessage.id);
                        if (exists) return prev;
                        return [...prev, messageWithSender];
                    });

                    // Mark as read if it's from the other user
                    if (currentUserId && newMessage.sender_id !== currentUserId) {
                        await markMessagesAsRead(conversationId, currentUserId);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUserId]);

    // Send a new message (optionally with an attachment)
    const sendMessage = useCallback(async (
        content: string,
        file?: File,
        fileType?: AttachmentType
    ) => {
        // Allow sending if there's content OR a file
        if (!conversationId || !currentUserId || (!content.trim() && !file)) {
            console.log('[useMessages] sendMessage aborted - missing:', {
                conversationId,
                currentUserId,
                content: content?.trim(),
                hasFile: !!file
            });
            return;
        }

        console.log('[useMessages] Sending message:', {
            conversationId,
            currentUserId,
            content: content.trim(),
            hasAttachment: !!file
        });

        try {
            let attachment: { url: string; type: AttachmentType } | undefined;

            // Upload attachment first if provided
            if (file && fileType) {
                console.log('[useMessages] Uploading attachment...');
                attachment = await uploadAttachment(file, conversationId);
                console.log('[useMessages] Attachment uploaded:', attachment.url);
            }

            // Send the message with optional attachment
            const messageContent = content.trim() || (file ? `Sent a ${fileType}` : '');
            const sentMessage = await sendMessageService(
                conversationId,
                currentUserId,
                messageContent,
                attachment
            );
            console.log('[useMessages] Message sent successfully:', sentMessage);

            // Optimistically add the message to state with current user as sender
            setMessages((prev) => {
                const exists = prev.some(m => m.id === sentMessage.id);
                if (exists) {
                    console.log('[useMessages] Message already in state, skipping');
                    return prev;
                }

                const newMessages = [...prev, {
                    ...sentMessage,
                    sender: undefined, // Own messages don't need sender profile display
                }];
                console.log('[useMessages] Messages updated, new count:', newMessages.length);
                return newMessages;
            });
        } catch (err) {
            console.error('[useMessages] Error sending message:', err);
            throw err;
        }
    }, [conversationId, currentUserId]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        refresh: loadMessages,
    };
};
