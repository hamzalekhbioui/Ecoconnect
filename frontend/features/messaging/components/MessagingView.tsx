import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { MessageCircle, Search, Plus, X } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { Conversation } from '../types/messaging';

export const MessagingView: React.FC = () => {
    const { user, profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    // Fetch conversations for current user
    const { conversations, isLoading: loadingConversations, refresh: refreshConversations } = useConversations(user?.id);

    // Fetch messages for selected conversation
    const { messages, isLoading: loadingMessages, sendMessage } = useMessages(
        selectedConversationId,
        user?.id
    );

    // Get the selected conversation object
    const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

    // Filter conversations by search query
    const filteredConversations = conversations.filter(c =>
        c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle conversation selection
    const handleSelectConversation = useCallback((id: string) => {
        setSelectedConversationId(id);
        setShowChatOnMobile(true);
    }, []);

    // Handle back navigation (mobile)
    const handleBack = useCallback(() => {
        setShowChatOnMobile(false);
    }, []);

    // Handle sending a message (optionally with an attachment)
    const handleSendMessage = useCallback(async (
        content: string,
        file?: File,
        fileType?: 'image' | 'document'
    ) => {
        try {
            await sendMessage(content, file, fileType);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }, [sendMessage]);

    // Unauthenticated state
    if (!user) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view messages</h2>
                    <p className="text-gray-600">You need to be logged in to access messaging.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                            <p className="text-sm text-gray-500">Connect with community members</p>
                        </div>
                    </div>

                    {/* New conversation button (placeholder) */}
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
                        title="Start new conversation (coming soon)"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Chat</span>
                    </button>
                </div>

                {/* Main Content - Split View */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="flex h-[calc(100vh-12rem)] min-h-[500px]">
                        {/* Left Panel: Conversation List (Master) */}
                        <div
                            className={`w-full md:w-96 border-r border-gray-100 flex flex-col bg-white ${showChatOnMobile ? 'hidden md:flex' : 'flex'
                                }`}
                        >
                            {/* Search */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                            <X className="w-3 h-3 text-gray-400" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Conversation List */}
                            <ConversationList
                                conversations={filteredConversations}
                                selectedId={selectedConversationId}
                                onSelect={handleSelectConversation}
                                isLoading={loadingConversations}
                            />
                        </div>

                        {/* Right Panel: Chat Window (Detail) */}
                        <div
                            className={`flex-1 flex flex-col min-h-0 ${!showChatOnMobile ? 'hidden md:flex' : 'flex'
                                }`}
                        >
                            <ChatWindow
                                conversation={selectedConversation}
                                messages={messages}
                                isLoading={loadingMessages}
                                currentUserId={user.id}
                                onBack={handleBack}
                                onSendMessage={handleSendMessage}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
