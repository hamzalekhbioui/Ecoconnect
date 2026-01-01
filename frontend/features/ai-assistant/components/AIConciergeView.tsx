import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../../types';
import { sendChatMessage } from '../api/chatApi';
import { User, Loader2 } from 'lucide-react';

interface RecommendedCard {
    id: string;
    title: string;
    image: string;
    views: string;
    duration: string;
}

interface CommunityCard {
    id: string;
    name: string;
    tags: string[];
}

interface ProjectCard {
    id: string;
    name: string;
    tags: string[];
}

const RECOMMENDED_CARDS: RecommendedCard[] = [
    {
        id: 'r1',
        title: 'Circular Design Patterns',
        image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&q=80',
        views: '1.2k',
        duration: '4h'
    },
    {
        id: 'r2',
        title: 'Local Material Exchanges',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
        views: 'Near You',
        duration: 'High'
    },
    {
        id: 'r3',
        title: 'Regenerative Ag Basics',
        image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&q=80',
        views: 'Course',
        duration: '4h'
    }
];

const COMMUNITIES: CommunityCard[] = [
    { id: 'c1', name: 'Urban Mycology', tags: ['Fungi', 'Food Systems'] },
    { id: 'c2', name: 'Zero Waste Home', tags: ['Lifestyle', 'DIY'] }
];

const PROJECTS: ProjectCard[] = [
    { id: 'p1', name: 'Solar Kiosk V2', tags: ['Energy', 'Open Source'] },
    { id: 'p2', name: 'Compost Network', tags: ['Soil', 'Logistics'] }
];

const QUICK_ACTIONS = [
    'Show local events',
    'Find collaborators',
    'Explain circular economy',
    'My impact stats'
];

export const AIConciergeView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(undefined);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            senderId: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Call the LangChain backend API
            const result = await sendChatMessage(input, sessionId);

            // Store session ID for conversation memory
            if (!sessionId) {
                setSessionId(result.sessionId);
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                senderId: 'ai',
                content: result.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                senderId: 'ai',
                content: "Sorry, I couldn't connect to the server. Make sure the backend is running on port 3001.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action: string) => {
        setInput(action);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column - Recommended For You */}
                    <div className="lg:col-span-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Recommended For You
                        </h3>
                        <div className="space-y-4">
                            {RECOMMENDED_CARDS.map(card => (
                                <div
                                    key={card.id}
                                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img
                                            src={card.image}
                                            alt={card.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-semibold text-gray-900 text-sm">{card.title}</h4>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                            <span>{card.views}</span>
                                            <span>{card.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center Column - EcoMind Assistant Card */}
                    <div className="lg:col-span-6 flex flex-col">
                        {/* Floating Card Container */}
                        <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col min-h-[600px]">
                            {/* Card Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">EcoMind Assistant</h2>
                                    <p className="text-xs font-medium text-green-500 tracking-wide">ONLINE • SUSTAINABLE MODE</p>
                                </div>
                            </div>

                            {/* Scrollable Content Area */}
                            <div
                                ref={scrollContainerRef}
                                className="flex-1 overflow-y-auto"
                            >
                                {/* Hero Section - Show when no user messages */}
                                {messages.length <= 1 && !isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        {/* Large Tree Icon */}
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                            </svg>
                                        </div>

                                        {/* Headline */}
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Hello, Eco-Citizen.</h3>
                                        <p className="text-gray-500 text-center mb-8">How can we optimize your resources today?</p>

                                        {/* Suggested Actions Label */}
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Suggested Actions</p>

                                        {/* 2x2 Grid of Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                                            <button
                                                onClick={() => handleQuickAction('Find recycled materials')}
                                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:shadow-sm transition-all"
                                            >
                                                <span className="text-green-500">✨</span>
                                                Find recycled materials
                                            </button>
                                            <button
                                                onClick={() => handleQuickAction('Offer repair skills')}
                                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:shadow-sm transition-all"
                                            >
                                                <span className="text-green-500">🔧</span>
                                                Offer repair skills
                                            </button>
                                            <button
                                                onClick={() => handleQuickAction('Locate community garden')}
                                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:shadow-sm transition-all"
                                            >
                                                <span className="text-green-500">🌸</span>
                                                Locate community garden
                                            </button>
                                            <button
                                                onClick={() => handleQuickAction('Borrow tools')}
                                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:shadow-sm transition-all"
                                            >
                                                <span className="text-green-500">🛠️</span>
                                                Borrow tools
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Chat Messages */
                                    <div className="space-y-4 py-4">
                                        {messages.map(msg => (
                                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.role === 'assistant' ? (
                                                    <div className="flex items-start gap-3 max-w-[90%]">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 whitespace-pre-line">
                                                                {msg.content}
                                                            </div>
                                                            {/* Recommended Resources */}
                                                            {msg.recommendedResources && msg.recommendedResources.length > 0 && (
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {msg.recommendedResources.map(res => (
                                                                        <div key={res.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex gap-3 hover:shadow-md transition-shadow cursor-pointer">
                                                                            <img src={res.image} alt={res.title} className="w-12 h-12 rounded object-cover" />
                                                                            <div>
                                                                                <p className="text-xs font-bold text-gray-800">{res.title}</p>
                                                                                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${res.costType === 'free' ? 'bg-green-100 text-green-700' :
                                                                                    res.costType === 'barter' ? 'bg-purple-100 text-purple-700' :
                                                                                        'bg-blue-100 text-blue-700'
                                                                                    }`}>
                                                                                    {res.costType}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3 max-w-[90%]">
                                                        <div className="bg-green-50 border border-green-100 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-700">
                                                            {msg.content}
                                                        </div>
                                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <User size={14} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Loading indicator */}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                                        </svg>
                                                    </div>
                                                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Thinking...
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Input Bar */}
                            <div className="mt-4">
                                <div className="relative flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2">


                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask about sharing, repairing..."
                                        className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                                    />



                                    {/* Send Button */}
                                    <button
                                        onClick={handleSend}
                                        disabled={isLoading || !input.trim()}
                                        className="px-5 py-2 bg-[#a3e635] text-gray-900 font-semibold rounded-full hover:bg-[#84cc16] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Communities & Projects */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Relevant Communities */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Relevant Communities
                            </h3>
                            <div className="space-y-3">
                                {COMMUNITIES.map(community => (
                                    <div key={community.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 text-sm mb-2">{community.name}</h4>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {community.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                                Join
                                            </button>
                                            <button className="px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Active Projects */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Active Projects
                            </h3>
                            <div className="space-y-3">
                                {PROJECTS.map(project => (
                                    <div key={project.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 text-sm mb-2">{project.name}</h4>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {project.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                            Contribute
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
