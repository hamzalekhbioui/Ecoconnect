import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('messages')
@Controller('api/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get(':conversationId')
    @ApiOperation({ summary: 'Get messages in a conversation' })
    @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
    @ApiResponse({ status: 200, description: 'Returns list of messages' })
    @ApiResponse({ status: 403, description: 'Not a participant in this conversation' })
    async findByConversation(
        @Param('conversationId') conversationId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.messagesService.findByConversation(conversationId, user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Send a message' })
    @ApiResponse({ status: 201, description: 'Message sent' })
    @ApiResponse({ status: 403, description: 'Not a participant in this conversation' })
    async sendMessage(
        @Body() dto: SendMessageDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.messagesService.sendMessage(dto, user.id);
    }

    @Patch('read/:conversationId')
    @ApiOperation({ summary: 'Mark messages as read in a conversation' })
    @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
    @ApiResponse({ status: 200, description: 'Messages marked as read' })
    async markAsRead(
        @Param('conversationId') conversationId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.messagesService.markAsRead(conversationId, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a message' })
    @ApiParam({ name: 'id', description: 'Message ID' })
    @ApiResponse({ status: 200, description: 'Message deleted' })
    @ApiResponse({ status: 403, description: 'Can only delete your own messages' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.messagesService.delete(id, user.id);
        return { message: 'Message deleted successfully' };
    }
}
