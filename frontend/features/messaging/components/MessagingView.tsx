import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { MessageCircle, Send, Search, ArrowLeft, User } from 'lucide-react';

// Mock conversations for UI demonstration
const MOCK_CONVERSATIONS = [
    {
        id: '1',
        user: { name: 'Sarah Chen', avatar: null },
        lastMessage: 'Thanks for sharing that resource!',
        timestamp: '2 min ago',
        unread: true,
    },
    {
        id: '2',
        user: { name: 'Marcus Johnson', avatar: null },
        lastMessage: 'Are you joining the meetup next week?',
        timestamp: '1 hour ago',
        unread: false,
    },
    {
        id: '3',
        user: { name: 'Elena Rodriguez', avatar: null },
        lastMessage: 'I loved your project proposal!',
        timestamp: 'Yesterday',
        unread: false,
    },
];

interface Conversation {
    id: string;
    user: { name: string; avatar: string | null };
    lastMessage: string;
    timestamp: string;
    unread: boolean;
}

export const MessagingView: React.FC = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messageInput, setMessageInput] = useState('');

    const filteredConversations = MOCK_CONVERSATIONS.filter(c =>
        c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                            <p className="text-sm text-gray-500">Connect with community members</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                        Coming Soon
                    </span>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex h-[600px]">
                        {/* Conversation List */}
                        <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
                            {/* Search */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Conversations */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredConversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${selectedConversation?.id === conv.id ? 'bg-emerald-50' : ''
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`font-medium text-gray-900 ${conv.unread ? 'font-bold' : ''}`}>
                                                    {conv.user.name}
                                                </span>
                                                <span className="text-xs text-gray-400">{conv.timestamp}</span>
                                            </div>
                                            <p className={`text-sm truncate ${conv.unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {conv.unread && (
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{selectedConversation.user.name}</h3>
                                            <p className="text-xs text-emerald-600">Online</p>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 p-4 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <MessageCircle className="w-8 h-8 text-amber-600" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Real-time Messaging Coming Soon</h3>
                                            <p className="text-sm text-gray-500 max-w-sm">
                                                Full messaging functionality is under development.
                                                Soon you'll be able to chat with community members in real-time.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Type a message... (Coming Soon)"
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                disabled
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-gray-50 cursor-not-allowed"
                                            />
                                            <button
                                                disabled
                                                className="p-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <h3 className="font-semibold text-gray-900 mb-2">Select a conversation</h3>
                                        <p className="text-sm text-gray-500">Choose a conversation from the list to start chatting</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
