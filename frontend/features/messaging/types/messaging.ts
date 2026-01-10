// TypeScript interfaces for Messaging Module

export interface UserProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: UserProfile;
    attachment_url?: string | null;
    attachment_type?: 'image' | 'document' | null;
}

export interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message_at: string;
    created_at: string;
    otherUser: UserProfile;
    lastMessage: Message | null;
    unreadCount: number;
}

// Raw database types (before transformation)
export interface ConversationRow {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message_at: string;
    created_at: string;
    participant_1_profile: UserProfile;
    participant_2_profile: UserProfile;
    latest_message: Message[] | null;
}
