import { api } from '../../../config/api';
import { Message } from '../types/messaging';
import { supabase } from '../../../config/supabase';

// =============================================================================
// NOTE: Some functions still use direct Supabase access for features not yet
// implemented in the backend (blocking). These will be migrated in Phase 2.
// =============================================================================

/**
 * Remove a friendship (unfriend action).
 * Both parties can delete friendships.
 */
export const removeFriend = async (friendshipId: string): Promise<void> => {
    await api.delete(`/api/friendships/${friendshipId}`);
};

/**
 * Find friendship between two users.
 */
export const findFriendship = async (userId1: string, _userId2: string): Promise<{ id: string } | null> => {
    const result = await api.get<{ friendshipId: string | null; status: string | null }>(`/api/friendships/status/${userId1}`);
    if (result.friendshipId && result.status === 'accepted') {
        return { id: result.friendshipId };
    }
    return null;
};

/**
 * Block a user. This will also auto-unfriend via database trigger.
 * TODO: Implement blocking endpoint in backend
 */
export const blockUser = async (blockerId: string, blockedId: string): Promise<void> => {
    // Temporarily use direct Supabase until blocking endpoint is implemented
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
 * TODO: Implement blocking endpoint in backend
 */
export const unblockUser = async (blockerId: string, blockedId: string): Promise<void> => {
    // Temporarily use direct Supabase until blocking endpoint is implemented
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
 * TODO: Implement blocking endpoint in backend
 */
export const isUserBlocked = async (blockerId: string, blockedId: string): Promise<boolean> => {
    // Temporarily use direct Supabase until blocking endpoint is implemented
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
 * TODO: Implement blocking endpoint in backend
 */
export const isBlockedByUser = async (currentUserId: string, otherUserId: string): Promise<boolean> => {
    // Temporarily use direct Supabase until blocking endpoint is implemented
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
    const messages = await api.get<Array<{
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        attachmentUrl?: string;
        attachmentType?: string;
        isRead: boolean;
        createdAt: string;
        sender?: { id: string; full_name: string; avatar_url?: string };
    }>>(`/api/messages/${conversationId}`);

    // Get last N and reverse to chronological order
    const lastN = messages.slice(-count).reverse();

    return lastN.map(m => ({
        id: m.id,
        conversation_id: m.conversationId,
        sender_id: m.senderId,
        content: m.content,
        attachment_url: m.attachmentUrl,
        attachment_type: m.attachmentType as 'image' | 'document' | undefined,
        is_read: m.isRead,
        created_at: m.createdAt,
        sender: m.sender ? {
            id: m.sender.id,
            full_name: m.sender.full_name,
            avatar_url: m.sender.avatar_url ?? null,
        } : undefined,
    }));
};

/**
 * Report a user.
 * TODO: Implement reporting endpoint in backend
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

    // Temporarily use direct Supabase until reporting endpoint is implemented
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
