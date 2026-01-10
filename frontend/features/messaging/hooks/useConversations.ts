import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types/messaging';
import { fetchConversations } from '../services/conversationService';
import { supabase } from '../../../config/supabase';

interface UseConversationsResult {
    conversations: Conversation[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage conversations list with real-time updates.
 */
export const useConversations = (userId: string | null | undefined): UseConversationsResult => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadConversations = useCallback(async () => {
        if (!userId) {
            setConversations([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await fetchConversations(userId);
            setConversations(data);
            setError(null);
        } catch (err) {
            console.error('Error loading conversations:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Real-time subscription for conversation updates
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('conversations-list')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                },
                (payload) => {
                    // Check if this conversation involves the current user
                    const conv = payload.new as { participant_1?: string; participant_2?: string };
                    if (conv?.participant_1 === userId || conv?.participant_2 === userId) {
                        // Refresh the list when a conversation is updated
                        loadConversations();
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    // Refresh when new messages arrive (updates last_message preview)
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, loadConversations]);

    return {
        conversations,
        isLoading,
        error,
        refresh: loadConversations,
    };
};
