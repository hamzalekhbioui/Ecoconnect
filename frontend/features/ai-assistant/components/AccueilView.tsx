import React from 'react';
import { Sparkles, Bot, User } from 'lucide-react';

// Static demo messages for the design showcase
const DEMO_MESSAGES = [
    {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your EcoConnect Concierge. Tell me about your project or what you're looking for, and I'll match you with the right resources in our community.",
    },
    {
        id: '2',
        role: 'user',
        content: "I'm looking to start a community garden in my neighborhood.",
    },
    {
        id: '3',
        role: 'assistant',
        content: "That's a wonderful initiative! I found several resources that could help:\n\n• **Urban Farming Collective** - They offer free consultations\n• **Seed Library Network** - Free heirloom seeds available\n• **Garden Tools Co-op** - Borrow equipment at no cost\n\nWould you like me to connect you with any of these?",
    },
];

export const AccueilView: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Accueil - EcoConnect Assistant</h3>
                    <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">Demo Preview</span>
                </div>

                {/* Messages Area - Static Display */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {DEMO_MESSAGES.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                <div className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user'
                                    ? 'bg-green-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area - Display Only (Disabled) */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            disabled
                            placeholder="Describe your project..."
                            className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        />
                        <button
                            disabled
                            className="bg-gray-300 text-gray-500 rounded-lg px-4 py-2 flex items-center justify-center cursor-not-allowed"
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        This is a design preview. Visit AI Concierge for the full experience.
                    </p>
                </div>
            </div>
        </div>
    );
};
