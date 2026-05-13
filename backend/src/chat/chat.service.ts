import { Injectable, Logger } from '@nestjs/common';
import { ChatResponseDto } from './dto/chat.dto';
import { CommunityDataService } from './communityData.service';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);
    private conversationHistory: Map<string, ChatMessage[]> = new Map();
    private readonly baseSystemPrompt: string;
    private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    private readonly isProduction = process.env.NODE_ENV === 'production';
    private communityDataService: CommunityDataService;

    constructor() {
        this.communityDataService = new CommunityDataService();

        // Base system prompt for the EcoConnect assistant
        this.baseSystemPrompt = `You are EcoMind, the friendly AI assistant for EcoConnect - a circular economy platform.

Your role is to help users with:
- Finding recycled materials and sustainable resources
- Connecting with local community gardens and eco-projects
- Sharing repair skills and borrowing tools
- Learning about circular economy practices
- Discovering local sustainability initiatives

Be helpful, warm, and encouraging. Keep responses concise but informative.
When users ask about resources or communities, refer to the REAL data provided below.
Use emojis sparingly to be friendly but professional.`;
    }

    private async buildSystemPrompt(): Promise<string> {
        try {
            const contextData = await this.communityDataService.buildContextString();
            return this.baseSystemPrompt + contextData;
        } catch (err) {
            this.logger.warn('Failed to build chat context. Using base prompt.');
            this.logDebug('Chat context build error details', {
                error: err instanceof Error ? err.message : 'Unknown error',
            });
            return this.baseSystemPrompt;
        }
    }

    async chat(message: string, sessionId?: string): Promise<ChatResponseDto> {
        // Generate session ID if not provided
        const currentSessionId = sessionId || this.generateSessionId();

        // Get or create conversation history for this session
        if (!this.conversationHistory.has(currentSessionId)) {
            this.conversationHistory.set(currentSessionId, []);
        }
        const history = this.conversationHistory.get(currentSessionId)!;

        // Add user message to history
        history.push({ role: 'user', content: message });

        try {
            // Build dynamic system prompt with real community data
            const systemPrompt = await this.buildSystemPrompt();

            // Build messages array for the API
            // Note: Gemma 3 doesn't support 'system' role, so we prepend instructions to the first user message
            const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [];

            for (let i = 0; i < history.length; i++) {
                const msg = history[i];
                if (i === 0 && msg.role === 'user') {
                    // Prepend system instructions to the first user message
                    apiMessages.push({
                        role: 'user',
                        content: `[Instructions: ${systemPrompt}]\n\n${msg.content}`
                    });
                } else if (msg.role === 'user' || msg.role === 'assistant') {
                    apiMessages.push({ role: msg.role, content: msg.content });
                }
            }

            this.logDebug('Dispatching OpenRouter chat request', {
                model: 'google/gemma-3-12b-it:free',
                sessionId: currentSessionId,
                messageCount: apiMessages.length,
            });

            // Make direct API call to OpenRouter
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
                    'X-Title': 'EcoConnect'
                },
                body: JSON.stringify({
                    model: 'google/gemma-3-12b-it:free',
                    messages: apiMessages,
                    temperature: 0.7
                })
            });

            this.logDebug('OpenRouter response received', {
                sessionId: currentSessionId,
                status: response.status,
                statusText: response.statusText,
            });

            if (!response.ok) {
                this.logger.error('OpenRouter returned a non-success status', JSON.stringify({
                    sessionId: currentSessionId,
                    status: response.status,
                    statusText: response.statusText,
                }));
                throw new Error('OpenRouter API request failed');
            }

            const data = await response.json();
            this.logDebug('OpenRouter response parsed successfully', {
                sessionId: currentSessionId,
                hasChoices: Array.isArray(data?.choices) && data.choices.length > 0,
            });

            // Extract the assistant's response
            const assistantContent = data.choices?.[0]?.message?.content || 'No response received';

            // Add AI response to history
            history.push({ role: 'assistant', content: assistantContent });

            // Keep history manageable (last 20 messages)
            if (history.length > 20) {
                history.splice(0, history.length - 20);
            }

            return {
                response: assistantContent,
                sessionId: currentSessionId,
            };
        } catch (error: unknown) {
            this.logger.error('Chat completion failed', JSON.stringify({
                sessionId: currentSessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            }));

            // Remove the failed user message from history
            history.pop();

            return {
                response: 'Service unavailable',
                sessionId: currentSessionId,
            };
        }
    }

    clearHistory(sessionId: string): void {
        this.conversationHistory.delete(sessionId);
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private logDebug(message: string, metadata?: Record<string, unknown>): void {
        if (this.isProduction) {
            return;
        }

        if (metadata) {
            this.logger.debug(`${message} ${JSON.stringify(metadata)}`);
            return;
        }

        this.logger.debug(message);
    }
}

