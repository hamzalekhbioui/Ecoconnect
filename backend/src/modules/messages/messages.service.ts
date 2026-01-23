import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { SendMessageDto } from './dto';

@Injectable()
export class MessagesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Send a message in a conversation.
     */
    async sendMessage(dto: SendMessageDto, senderId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify sender is a participant
        const { data: conversation } = await supabase
            .from('conversations')
            .select('participant_1, participant_2')
            .eq('id', dto.conversationId)
            .single();

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.participant_1 !== senderId && conversation.participant_2 !== senderId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const insertData: Record<string, any> = {
            conversation_id: dto.conversationId,
            sender_id: senderId,
            content: dto.content,
        };

        if (dto.attachmentUrl) {
            insertData.attachment_url = dto.attachmentUrl;
            insertData.attachment_type = dto.attachmentType;
        }

        const { data, error } = await supabase
            .from('messages')
            .insert(insertData)
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        return this.transformMessage(data);
    }

    /**
     * Fetch messages in a conversation.
     */
    async findByConversation(conversationId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify user is a participant
        const { data: conversation } = await supabase
            .from('conversations')
            .select('participant_1, participant_2')
            .eq('id', conversationId)
            .single();

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.participant_1 !== userId && conversation.participant_2 !== userId) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data?.map(this.transformMessage);
    }

    /**
     * Mark messages as read in a conversation.
     */
    async markAsRead(conversationId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        return { success: true };
    }

    /**
     * Delete a message.
     */
    async delete(messageId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const { data: message } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('id', messageId)
            .single();

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.sender_id !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
    }

    private transformMessage(row: any) {
        return {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            content: row.content,
            attachmentUrl: row.attachment_url,
            attachmentType: row.attachment_type,
            isRead: row.is_read,
            createdAt: row.created_at,
            sender: row.sender,
        };
    }
}
