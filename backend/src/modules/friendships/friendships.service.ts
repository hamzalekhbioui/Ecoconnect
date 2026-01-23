import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class FriendshipsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Check if two users share at least one community.
     */
    async checkSharedCommunity(userId1: string, userId2: string): Promise<boolean> {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase.rpc('check_shared_community', {
            user_a: userId1,
            user_b: userId2,
        });

        if (error) {
            console.error('Error checking shared community:', error);
            return false;
        }

        return data === true;
    }

    /**
     * Get friendship status between current user and another user.
     */
    async getFriendshipStatus(currentUserId: string, otherUserId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase.rpc('get_friendship_status', {
            user_a: currentUserId,
            user_b: otherUserId,
        });

        if (error) {
            console.error('Error getting friendship status:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        return {
            friendshipId: data[0].friendship_id,
            status: data[0].status,
            isRequester: data[0].is_requester,
            createdAt: data[0].created_at,
        };
    }

    /**
     * Send a friend request.
     */
    async sendFriendRequest(requesterId: string, receiverId: string) {
        const supabase = this.supabaseService.getAdminClient();

        if (requesterId === receiverId) {
            throw new BadRequestException('Cannot send friend request to yourself');
        }

        // Check if they share a community
        const sharesCommunity = await this.checkSharedCommunity(requesterId, receiverId);
        if (!sharesCommunity) {
            throw new BadRequestException('You must share a community with this user to send a friend request');
        }

        // Check if friendship already exists
        const existingStatus = await this.getFriendshipStatus(requesterId, receiverId);
        if (existingStatus) {
            if (existingStatus.status === 'accepted') {
                throw new ConflictException('You are already friends with this user');
            }
            if (existingStatus.status === 'pending') {
                throw new ConflictException('A friend request already exists');
            }
        }

        const { data, error } = await supabase
            .from('friendships')
            .insert({
                requester_id: requesterId,
                receiver_id: receiverId,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ConflictException('Friend request already exists');
            }
            throw error;
        }

        return data;
    }

    /**
     * Accept a friend request.
     */
    async acceptFriendRequest(friendshipId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify user is the receiver
        const { data: friendship } = await supabase
            .from('friendships')
            .select('receiver_id')
            .eq('id', friendshipId)
            .single();

        if (!friendship) {
            throw new NotFoundException('Friend request not found');
        }

        if (friendship.receiver_id !== userId) {
            throw new BadRequestException('Only the receiver can accept this request');
        }

        const { data, error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Reject a friend request.
     */
    async rejectFriendRequest(friendshipId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify user is the receiver
        const { data: friendship } = await supabase
            .from('friendships')
            .select('receiver_id')
            .eq('id', friendshipId)
            .single();

        if (!friendship) {
            throw new NotFoundException('Friend request not found');
        }

        if (friendship.receiver_id !== userId) {
            throw new BadRequestException('Only the receiver can reject this request');
        }

        const { data, error } = await supabase
            .from('friendships')
            .update({ status: 'rejected' })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Cancel a friend request (by requester) or unfriend.
     */
    async cancelOrUnfriend(friendshipId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify user is part of the friendship
        const { data: friendship } = await supabase
            .from('friendships')
            .select('requester_id, receiver_id')
            .eq('id', friendshipId)
            .single();

        if (!friendship) {
            throw new NotFoundException('Friendship not found');
        }

        if (friendship.requester_id !== userId && friendship.receiver_id !== userId) {
            throw new BadRequestException('You are not part of this friendship');
        }

        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);

        if (error) throw error;
    }

    /**
     * Get pending friend requests received by the user.
     */
    async getPendingRequests(userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('friendships')
            .select(`
                *,
                requester:profiles!friendships_requester_id_profiles_fkey(
                    id, full_name, avatar_url
                )
            `)
            .eq('receiver_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data?.map(f => ({
            id: f.id,
            requesterId: f.requester_id,
            receiverId: f.receiver_id,
            status: f.status,
            createdAt: f.created_at,
            requester: Array.isArray(f.requester) ? f.requester[0] : f.requester,
        }));
    }

    /**
     * Get all accepted friends.
     */
    async getFriends(userId: string) {
        const supabase = this.supabaseService.getAdminClient();

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
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return data?.map(f => {
            const requester = Array.isArray(f.requester) ? f.requester[0] : f.requester;
            const receiver = Array.isArray(f.receiver) ? f.receiver[0] : f.receiver;
            const friend = f.requester_id === userId ? receiver : requester;

            return {
                id: f.id,
                friendId: friend?.id,
                friendName: friend?.full_name,
                friendAvatar: friend?.avatar_url,
                since: f.updated_at,
            };
        });
    }

    /**
     * Check if two users are friends.
     */
    async areFriends(userId1: string, userId2: string): Promise<boolean> {
        const status = await this.getFriendshipStatus(userId1, userId2);
        return status?.status === 'accepted';
    }
}
