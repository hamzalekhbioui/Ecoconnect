import React from 'react';
import { Conversation } from '../types/messaging';
import { User, Loader2 } from 'lucide-react';

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onClick: () => void;
}

const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isSelected,
    onClick,
}) => {
    const { otherUser, lastMessage, unreadCount } = conversation;
    const hasUnread = unreadCount > 0;

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${isSelected ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
                }`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {otherUser?.avatar_url ? (
                    <img
                        src={otherUser.avatar_url}
                        alt={otherUser.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                    </div>
                )}
                {/* Online indicator (placeholder) */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium text-gray-900 truncate ${hasUnread ? 'font-semibold' : ''}`}>
                        {otherUser?.full_name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {lastMessage ? formatTimestamp(lastMessage.created_at) : ''}
                    </span>
                </div>
                <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {lastMessage?.content || 'No messages yet'}
                </p>
            </div>

            {/* Unread indicator */}
            {hasUnread && (
                <div className="flex-shrink-0 mt-2">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </div>
                </div>
            )}
        </button>
    );
};

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    isLoading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    selectedId,
    onSelect,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No conversations yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start chatting with community members!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
                <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedId === conv.id}
                    onClick={() => onSelect(conv.id)}
                />
            ))}
        </div>
    );
};
