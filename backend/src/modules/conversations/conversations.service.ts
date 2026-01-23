import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class ConversationsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Check if two users are friends.
     */
    private async checkFriendship(userId1: string, userId2: string): Promise<boolean> {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase.rpc('get_friendship_status', {
            user_a: userId1,
            user_b: userId2,
        });

        if (error || !data || data.length === 0) {
            return false;
        }

        return data[0].status === 'accepted';
    }

    /**
     * Find or create a conversation between two users.
     */
    async findOrCreate(currentUserId: string, otherUserId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Normalize order to prevent duplicates
        const [p1, p2] = [currentUserId, otherUserId].sort();

        // Try to find existing conversation
        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(participant_1.eq.${p1},participant_2.eq.${p2}),and(participant_1.eq.${p2},participant_2.eq.${p1})`)
            .maybeSingle();

        if (existing) {
            return { id: existing.id, isNew: false };
        }

        // Check friendship for new conversations
        const areFriends = await this.checkFriendship(currentUserId, otherUserId);
        if (!areFriends) {
            throw new ForbiddenException('You can only message users who are your friends');
        }

        // Create new conversation
        const { data, error } = await supabase
            .from('conversations')
            .insert({ participant_1: p1, participant_2: p2 })
            .select('id')
            .single();

        if (error) throw error;

        return { id: data.id, isNew: true };
    }

    /**
     * Fetch all conversations for a user.
     */
    async findAll(userId: string) {
        const supabase = this.supabaseService.getAdminClient();

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

        return data?.map(conv => {
            const otherUser = conv.participant_1 === userId
                ? conv.participant_2_profile
                : conv.participant_1_profile;

            const messages = conv.latest_message || [];
            const lastMessage = messages.length > 0
                ? messages.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
                : null;

            const unreadCount = messages.filter(
                (m: any) => m.sender_id !== userId && !m.is_read
            ).length;

            return {
                id: conv.id,
                participant1: conv.participant_1,
                participant2: conv.participant_2,
                lastMessageAt: conv.last_message_at,
                createdAt: conv.created_at,
                otherUser,
                lastMessage,
                unreadCount,
            };
        });
    }

    /**
     * Get a single conversation by ID.
     */
    async findById(conversationId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participant_1_profile:profiles!conversations_participant_1_fkey(id, full_name, avatar_url),
                participant_2_profile:profiles!conversations_participant_2_fkey(id, full_name, avatar_url)
            `)
            .eq('id', conversationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Conversation not found');
            }
            throw error;
        }

        // Verify user is a participant
        if (data.participant_1 !== userId && data.participant_2 !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const otherUser = data.participant_1 === userId
            ? data.participant_2_profile
            : data.participant_1_profile;

        return {
            id: data.id,
            participant1: data.participant_1,
            participant2: data.participant_2,
            lastMessageAt: data.last_message_at,
            createdAt: data.created_at,
            otherUser,
        };
    }
}
