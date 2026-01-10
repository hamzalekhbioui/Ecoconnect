import { supabase } from '../../../config/supabase';

// Friendship status type
export interface FriendshipStatus {
    friendship_id: string | null;
    status: 'pending' | 'accepted' | 'rejected' | null;
    is_requester: boolean;
    created_at: string | null;
}

export interface Friendship {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
    requester?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    receiver?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

/**
 * Check if two users share at least one community
 */
export const checkSharedCommunity = async (userId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('check_shared_community', {
        user_a: user.id,
        user_b: userId,
    });

    if (error) {
        console.error('Error checking shared community:', error);
        return false;
    }

    return data === true;
};

/**
 * Get friendship status between current user and another user
 */
export const getFriendshipStatus = async (userId: string): Promise<FriendshipStatus | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_friendship_status', {
        user_a: user.id,
        user_b: userId,
    });

    if (error) {
        console.error('Error getting friendship status:', error);
        return null;
    }

    if (!data || data.length === 0) {
        return null;
    }

    return {
        friendship_id: data[0].friendship_id,
        status: data[0].status,
        is_requester: data[0].is_requester,
        created_at: data[0].created_at,
    };
};

/**
 * Send a friend request to a user
 */
export const sendFriendRequest = async (receiverId: string): Promise<{ success: boolean; error?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
        .from('friendships')
        .insert({
            requester_id: user.id,
            receiver_id: receiverId,
            status: 'pending',
        });

    if (error) {
        console.error('Error sending friend request:', error);
        if (error.code === '23505') {
            return { success: false, error: 'Friend request already exists' };
        }
        if (error.message.includes('check_shared_community')) {
            return { success: false, error: 'You must share a community with this user' };
        }
        return { success: false, error: error.message };
    }

    return { success: true };
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

    if (error) {
        console.error('Error accepting friend request:', error);
        return false;
    }

    return true;
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', friendshipId);

    if (error) {
        console.error('Error rejecting friend request:', error);
        return false;
    }

    return true;
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

    if (error) {
        console.error('Error canceling friend request:', error);
        return false;
    }

    return true;
};

/**
 * Get pending friend requests received by current user
 */
export const getPendingRequests = async (): Promise<Friendship[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('friendships')
        .select(`
            *,
            requester:profiles!friendships_requester_id_profiles_fkey(
                id, full_name, avatar_url
            )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending requests:', error);
        return [];
    }

    return (data || []).map((f: any) => ({
        ...f,
        requester: Array.isArray(f.requester) ? f.requester[0] : f.requester,
    }));
};

/**
 * Get all accepted friends
 */
export const getFriends = async (): Promise<Friendship[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('friendships')
        .select(`
            *,
            requester:profiles!friendships_requester_id_profiles_fkey(
                id, full_name, avatar_url
            ),
            receiver:profiles!friendships_receiver_id_profiles_fkey(
                id, full_name, avatar_url
            )
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching friends:', error);
        return [];
    }

    return (data || []).map((f: any) => ({
        ...f,
        requester: Array.isArray(f.requester) ? f.requester[0] : f.requester,
        receiver: Array.isArray(f.receiver) ? f.receiver[0] : f.receiver,
    }));
};

/**
 * Check if current user is friends with another user (accepted status)
 */
export const areFriends = async (userId: string): Promise<boolean> => {
    const status = await getFriendshipStatus(userId);
    return status?.status === 'accepted';
};
