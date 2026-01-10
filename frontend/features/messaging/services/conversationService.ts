import { supabase } from '../../../config/supabase';
import { Conversation, ConversationRow } from '../types/messaging';

/**
 * Check if two users are friends (accepted friendship).
 */
const checkFriendship = async (userId1: string, userId2: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('get_friendship_status', {
        user_a: userId1,
        user_b: userId2,
    });

    if (error || !data || data.length === 0) {
        return false;
    }

    return data[0].status === 'accepted';
};

/**
 * Find an existing conversation or create a new one between two users.
 * Uses normalized ordering to prevent duplicate conversations.
 * IMPORTANT: Only allows conversations between accepted friends.
 */
export const findOrCreateConversation = async (
    currentUserId: string,
    otherUserId: string
): Promise<{ id: string; isNew: boolean; error?: string }> => {
    // Normalize order to prevent duplicates (lower UUID first)
    const [p1, p2] = [currentUserId, otherUserId].sort();

    // Try to find existing conversation first
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${p1},participant_2.eq.${p2}),and(participant_1.eq.${p2},participant_2.eq.${p1})`)
        .maybeSingle();

    if (existing) {
        // Existing conversation - allow access (they've chatted before)
        return { id: existing.id, isNew: false };
    }

    // For new conversations, check if they are friends
    const areFriends = await checkFriendship(currentUserId, otherUserId);
    if (!areFriends) {
        return { id: '', isNew: false, error: 'You can only message users who are your friends.' };
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ participant_1: p1, participant_2: p2 })
        .select('id')
        .single();

    if (error) throw error;
    return { id: newConv.id, isNew: true };
};

/**
 * Fetch all conversations for a user with participant profiles and last message.
 */
export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
            *,
            participant_1_profile:profiles!conversations_participant_1_fkey(id, full_name, avatar_url),
            participant_2_profile:profiles!conversations_participant_2_fkey(id, full_name, avatar_url),
            latest_message:messages(id, content, created_at, sender_id, is_read)
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Transform to get "other user" easily and calculate unread count
    return (data as ConversationRow[]).map((conv) => {
        const otherUser = conv.participant_1 === userId
            ? conv.participant_2_profile
            : conv.participant_1_profile;

        const messages = conv.latest_message || [];
        const lastMessage = messages.length > 0
            ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            : null;

        // Count unread messages (not sent by current user and not read)
        const unreadCount = messages.filter(
            m => m.sender_id !== userId && !m.is_read
        ).length;

        return {
            id: conv.id,
            participant_1: conv.participant_1,
            participant_2: conv.participant_2,
            last_message_at: conv.last_message_at,
            created_at: conv.created_at,
            otherUser,
            lastMessage,
            unreadCount,
        };
    });
};

/**
 * Get a single conversation by ID.
 */
export const getConversation = async (conversationId: string, userId: string): Promise<Conversation | null> => {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
            *,
            participant_1_profile:profiles!conversations_participant_1_fkey(id, full_name, avatar_url),
            participant_2_profile:profiles!conversations_participant_2_fkey(id, full_name, avatar_url)
        `)
        .eq('id', conversationId)
        .single();

    if (error || !data) return null;

    const conv = data as ConversationRow;
    const otherUser = conv.participant_1 === userId
        ? conv.participant_2_profile
        : conv.participant_1_profile;

    return {
        id: conv.id,
        participant_1: conv.participant_1,
        participant_2: conv.participant_2,
        last_message_at: conv.last_message_at,
        created_at: conv.created_at,
        otherUser,
        lastMessage: null,
        unreadCount: 0,
    };
};
