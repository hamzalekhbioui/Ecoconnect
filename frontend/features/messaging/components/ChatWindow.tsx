import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message, Conversation } from '../types/messaging';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { UserActionsDropdown } from './UserActionsDropdown';
import { BlockUserModal } from './BlockUserModal';
import { ReportUserModal } from './ReportUserModal';
import { ArrowLeft, User, Loader2, Ban } from 'lucide-react';
import { AttachmentType } from '../services/attachmentService';
import {
    blockUser,
    unblockUser,
    reportUser,
    getLastMessages,
    isUserBlocked,
    isBlockedByUser,
    ReportReason
} from '../services/userManagementService';
import { supabase } from '../../../config/supabase';

interface ChatWindowProps {
    conversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    currentUserId: string;
    onBack: () => void;
    onSendMessage: (content: string, file?: File, fileType?: AttachmentType) => Promise<void>;
    onFriendshipChange?: () => void; // Callback when friendship status changes
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversation,
    messages,
    isLoading,
    currentUserId,
    onBack,
    onSendMessage,
    onFriendshipChange,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Blocked state - when true (I blocked them), prevents sending messages
    const [isBlocked, setIsBlocked] = useState(false);
    // Blocked BY them state - when true (they blocked me), prevents sending messages
    const [isBlockedByThem, setIsBlockedByThem] = useState(false);
    // Loading state for unblock action
    const [isUnblocking, setIsUnblocking] = useState(false);

    // Debug logging for messages
    useEffect(() => {
        console.log('[ChatWindow] Messages updated:', messages.length, 'currentUserId:', currentUserId);
        messages.forEach((m, i) => {
            console.log(`[ChatWindow] Message ${i}: id=${m.id}, sender_id=${m.sender_id}, isOwn=${m.sender_id === currentUserId}`);
        });
    }, [messages, currentUserId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check block status when conversation changes (persists across sessions)
    // Checks BOTH directions: "I blocked them" AND "they blocked me"
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (!conversation?.otherUser?.id || !currentUserId) {
                setIsBlocked(false);
                setIsBlockedByThem(false);
                return;
            }

            try {
                // Check if I blocked them
                const iBlocked = await isUserBlocked(currentUserId, conversation.otherUser.id);
                // Check if they blocked me
                const theyBlockedMe = await isBlockedByUser(currentUserId, conversation.otherUser.id);

                console.log('[ChatWindow] Block status check:', {
                    currentUserId,
                    otherUserId: conversation.otherUser.id,
                    iBlockedThem: iBlocked,
                    theyBlockedMe: theyBlockedMe
                });

                setIsBlocked(iBlocked);
                setIsBlockedByThem(theyBlockedMe);
            } catch (error) {
                console.error('[ChatWindow] Error checking block status:', error);
                setIsBlocked(false);
                setIsBlockedByThem(false);
            }
        };

        checkBlockStatus();
    }, [conversation?.id, conversation?.otherUser?.id, currentUserId]);

    // Handle Block User action
    const handleBlockUser = useCallback(async () => {
        if (!conversation?.otherUser?.id || !currentUserId) return;

        await blockUser(currentUserId, conversation.otherUser.id);
        setIsBlocked(true);
        onFriendshipChange?.();
    }, [conversation?.otherUser?.id, currentUserId, onFriendshipChange]);

    // Handle Unblock User action
    const handleUnblockUser = useCallback(async () => {
        if (!conversation?.otherUser?.id || !currentUserId) return;

        setIsUnblocking(true);
        try {
            await unblockUser(currentUserId, conversation.otherUser.id);
            setIsBlocked(false);
            console.log('[ChatWindow] User unblocked successfully');
        } catch (error) {
            console.error('[ChatWindow] Error unblocking user:', error);
        } finally {
            setIsUnblocking(false);
        }
    }, [conversation?.otherUser?.id, currentUserId]);

    // Realtime subscription for block status changes
    // This allows the other user's chat to update when they get unblocked
    useEffect(() => {
        if (!conversation?.otherUser?.id || !currentUserId) return;

        const channel = supabase
            .channel(`blocks:${currentUserId}:${conversation.otherUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT and DELETE
                    schema: 'public',
                    table: 'blocked_users',
                    filter: `blocked_id=eq.${currentUserId}`,
                },
                async (payload) => {
                    console.log('[ChatWindow] Block status changed (realtime):', payload);
                    // Re-check block status when changes occur
                    const theyBlockedMe = await isBlockedByUser(currentUserId, conversation.otherUser.id);
                    setIsBlockedByThem(theyBlockedMe);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation?.otherUser?.id, currentUserId]);

    // Handle Report User action
    const handleReportUser = useCallback(async (
        reason: ReportReason,
        description: string,
        alsoBlock: boolean
    ) => {
        if (!conversation?.otherUser?.id || !currentUserId || !conversation?.id) return;

        // Get last 5 messages for context
        const contextMessages = await getLastMessages(conversation.id, 5);

        await reportUser(
            currentUserId,
            conversation.otherUser.id,
            reason,
            description,
            contextMessages
        );

        // If "also block" was checked, block the user
        if (alsoBlock) {
            await blockUser(currentUserId, conversation.otherUser.id);
            setIsBlocked(true);
            onFriendshipChange?.();
        }
    }, [conversation?.otherUser?.id, conversation?.id, currentUserId, onFriendshipChange]);

    // No conversation selected - show placeholder with disabled input
    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col h-full min-h-0 bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Empty state content */}
                <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-10 h-10 text-emerald-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Select a conversation</h3>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Choose a conversation from the list to start chatting with community members
                        </p>
                    </div>
                </div>
                {/* Always show MessageInput, but disabled when no conversation */}
                <div className="flex-shrink-0 sticky bottom-0 z-10 bg-white">
                    <MessageInput
                        onSend={async (content) => onSendMessage(content)}
                        disabled={true}
                        placeholder="Select a conversation to start messaging..."
                    />
                </div>
            </div>
        );
    }

    const { otherUser } = conversation;

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white shadow-sm">
                {/* Back button (mobile only) */}
                <button
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* User avatar */}
                <div className="relative">
                    {otherUser?.avatar_url ? (
                        <img
                            src={otherUser.avatar_url}
                            alt={otherUser.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    )}
                    {!isBlocked && !isBlockedByThem && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {otherUser?.full_name || 'Unknown User'}
                    </h3>
                    <p className={`text-xs ${isBlocked ? 'text-red-500' : isBlockedByThem ? 'text-gray-500' : 'text-emerald-600'}`}>
                        {isBlocked ? 'Blocked' : isBlockedByThem ? 'Unavailable' : 'Online'}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <UserActionsDropdown
                        otherUser={otherUser}
                        onBlockUser={() => setShowBlockModal(true)}
                        onReportUser={() => setShowReportModal(true)}
                    />
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👋</span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Start the conversation with {otherUser?.full_name || 'this user'}!
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwnMessage={message.sender_id === currentUserId}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Blocked banner with Unblock button */}
            {isBlocked && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">
                            You have blocked this user.
                        </span>
                    </div>
                    <button
                        onClick={handleUnblockUser}
                        disabled={isUnblocking}
                        className="px-4 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isUnblocking ? 'Unblocking...' : 'Unblock'}
                    </button>
                </div>
            )}

            {/* Blocked BY them banner - they blocked the current user */}
            {isBlockedByThem && !isBlocked && (
                <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">
                        You cannot reply to this conversation.
                    </span>
                </div>
            )}

            {/* Message input - always visible, sticky to bottom with solid background */}
            <div className="flex-shrink-0 sticky bottom-0 z-10 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <MessageInput
                    onSend={async (content) => onSendMessage(content)}
                    onFileSelect={(file, type) => onSendMessage('', file, type)}
                    disabled={isLoading || isBlocked || isBlockedByThem}
                    placeholder={
                        isBlocked
                            ? "You cannot message this user"
                            : isBlockedByThem
                                ? "User is unavailable"
                                : isLoading
                                    ? "Loading messages..."
                                    : "Type a message..."
                    }
                />
            </div>

            {/* Modals */}
            <BlockUserModal
                isOpen={showBlockModal}
                userName={otherUser?.full_name || 'this user'}
                onClose={() => setShowBlockModal(false)}
                onConfirm={handleBlockUser}
            />

            <ReportUserModal
                isOpen={showReportModal}
                userName={otherUser?.full_name || 'this user'}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportUser}
            />
        </div>
    );
};
