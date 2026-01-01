import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto, ChatResponseDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    async chat(@Body() chatDto: ChatDto): Promise<ChatResponseDto> {
        const { message, sessionId } = chatDto;
        const response = await this.chatService.chat(message, sessionId);
        return response;
    }

    @Post('clear')
    async clearHistory(@Body() body: { sessionId: string }): Promise<{ success: boolean }> {
        this.chatService.clearHistory(body.sessionId);
        return { success: true };
    }
}
