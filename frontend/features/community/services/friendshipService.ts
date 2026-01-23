import { api } from '../../../config/api';

// =============================================================================
// TYPES
// =============================================================================

export interface FriendshipStatus {
    friendshipId: string | null;
    status: 'pending' | 'accepted' | 'rejected' | null;
    isRequester: boolean;
    createdAt: string | null;
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

interface ApiFriendship {
    id: string;
    requesterId: string;
    receiverId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    requester?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

interface ApiFriend {
    id: string;
    friendId: string;
    friendName: string;
    friendAvatar: string | null;
    since: string;
}

// =============================================================================
// FRIENDSHIP FUNCTIONS
// =============================================================================

/**
 * Check if two users share at least one community
 */
export const checkSharedCommunity = async (_userId: string): Promise<boolean> => {
    // This check is now done server-side when sending friend request
    // We can always return true since the server will validate
    return true;
};

/**
 * Get friendship status between current user and another user
 */
export const getFriendshipStatus = async (userId: string): Promise<FriendshipStatus | null> => {
    try {
        const result = await api.get<FriendshipStatus | { status: null }>(`/api/friendships/status/${userId}`);
        if (result.status === null) {
            return null;
        }
        return result as FriendshipStatus;
    } catch (error) {
        console.error('Error getting friendship status:', error);
        return null;
    }
};

/**
 * Send a friend request to a user
 */
export const sendFriendRequest = async (receiverId: string): Promise<{ success: boolean; error?: string }> => {
    try {
        await api.post(`/api/friendships/request/${receiverId}`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send friend request';
        return { success: false, error: message };
    }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
    try {
        await api.patch(`/api/friendships/${friendshipId}/accept`);
        return true;
    } catch (error) {
        console.error('Error accepting friend request:', error);
        return false;
    }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (friendshipId: string): Promise<boolean> => {
    try {
        await api.patch(`/api/friendships/${friendshipId}/reject`);
        return true;
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        return false;
    }
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (friendshipId: string): Promise<boolean> => {
    try {
        await api.delete(`/api/friendships/${friendshipId}`);
        return true;
    } catch (error) {
        console.error('Error canceling friend request:', error);
        return false;
    }
};

/**
 * Get pending friend requests received by current user
 */
export const getPendingRequests = async (): Promise<Friendship[]> => {
    try {
        const requests = await api.get<ApiFriendship[]>('/api/friendships/pending');
        return requests.map(r => ({
            id: r.id,
            requester_id: r.requesterId,
            receiver_id: r.receiverId,
            status: r.status,
            created_at: r.createdAt,
            updated_at: r.createdAt,
            requester: r.requester,
        }));
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return [];
    }
};

/**
 * Get all accepted friends
 */
export const getFriends = async (): Promise<Friendship[]> => {
    try {
        const friends = await api.get<ApiFriend[]>('/api/friendships');
        // Transform to match existing interface
        return friends.map(f => ({
            id: f.id,
            requester_id: f.friendId,
            receiver_id: f.friendId,
            status: 'accepted' as const,
            created_at: f.since,
            updated_at: f.since,
            requester: {
                id: f.friendId,
                full_name: f.friendName,
                avatar_url: f.friendAvatar,
            },
            receiver: {
                id: f.friendId,
                full_name: f.friendName,
                avatar_url: f.friendAvatar,
            },
        }));
    } catch (error) {
        console.error('Error fetching friends:', error);
        return [];
    }
};

/**
 * Check if current user is friends with another user (accepted status)
 */
export const areFriends = async (userId: string): Promise<boolean> => {
    try {
        const result = await api.get<{ areFriends: boolean }>(`/api/friendships/check/${userId}`);
        return result.areFriends;
    } catch (error) {
        console.error('Error checking friendship:', error);
        return false;
    }
};
