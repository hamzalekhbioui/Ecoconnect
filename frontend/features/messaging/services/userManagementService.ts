import { supabase } from '../../../config/supabase';
import { Message } from '../types/messaging';

/**
 * Remove a friendship (unfriend action).
 * Both parties can delete friendships.
 */
export const removeFriend = async (friendshipId: string): Promise<void> => {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

    if (error) {
        console.error('[removeFriend] Error:', error);
        throw error;
    }
};

/**
 * Find friendship between two users.
 */
export const findFriendship = async (userId1: string, userId2: string): Promise<{ id: string } | null> => {
    const { data, error } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(requester_id.eq.${userId1},receiver_id.eq.${userId2}),and(requester_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .eq('status', 'accepted')
        .maybeSingle();

    if (error) {
        console.error('[findFriendship] Error:', error);
        throw error;
    }

    return data;
};

/**
 * Block a user. This will also auto-unfriend via database trigger.
 */
export const blockUser = async (blockerId: string, blockedId: string): Promise<void> => {
    const { error } = await supabase
        .from('blocked_users')
        .insert({
            blocker_id: blockerId,
            blocked_id: blockedId
        });

    if (error) {
        console.error('[blockUser] Error:', error);
        throw error;
    }
};

/**
 * Unblock a user.
 */
export const unblockUser = async (blockerId: string, blockedId: string): Promise<void> => {
    const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    if (error) {
        console.error('[unblockUser] Error:', error);
        throw error;
    }
};

/**
 * Check if a user has blocked another user.
 */
export const isUserBlocked = async (blockerId: string, blockedId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .maybeSingle();

    if (error) {
        console.error('[isUserBlocked] Error:', error);
        return false;
    }

    return !!data;
};

/**
 * Check if current user is blocked BY another user (they blocked us).
 */
export const isBlockedByUser = async (currentUserId: string, otherUserId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', otherUserId)
        .eq('blocked_id', currentUserId)
        .maybeSingle();

    if (error) {
        // May fail due to RLS if we can't see other's blocks, which is expected
        return false;
    }

    return !!data;
};

/**
 * Get the last N messages from a conversation (for report context).
 */
export const getLastMessages = async (conversationId: string, count: number = 5): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(count);

    if (error) {
        console.error('[getLastMessages] Error:', error);
        throw error;
    }

    // Reverse to get chronological order
    return (data || []).reverse() as Message[];
};

/**
 * Report a user.
 */
export const reportUser = async (
    reporterId: string,
    reportedId: string,
    reason: string,
    description: string,
    contextMessages: Message[]
): Promise<void> => {
    // Prepare context JSON (sanitize to essential fields only)
    const contextJson = contextMessages.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.full_name || 'Unknown',
        content: msg.content,
        created_at: msg.created_at
    }));

    const { error } = await supabase
        .from('reports')
        .insert({
            reporter_id: reporterId,
            reported_id: reportedId,
            reason,
            description: description || null,
            context_json: contextJson
        });

    if (error) {
        console.error('[reportUser] Error:', error);
        throw error;
    }
};

// Report reason options with labels
export const REPORT_REASONS = [
    { value: 'harassment_abusive', label: 'Harassment or abusive language' },
    { value: 'spam_solicitation', label: 'Spam or solicitation' },
    { value: 'scam_fraud', label: 'Scam or fraud' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'community_values', label: 'Violation of community values' },
    { value: 'other', label: 'Other (with explanation)' }
] as const;

export type ReportReason = typeof REPORT_REASONS[number]['value'];
