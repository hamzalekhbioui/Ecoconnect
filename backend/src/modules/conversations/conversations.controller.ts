import {
    Controller,
    Get,
    Post,
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
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('conversations')
@Controller('api/conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all conversations for the current user' })
    @ApiResponse({ status: 200, description: 'Returns list of conversations' })
    async findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.conversationsService.findAll(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a conversation by ID' })
    @ApiParam({ name: 'id', description: 'Conversation ID' })
    @ApiResponse({ status: 200, description: 'Returns the conversation' })
    @ApiResponse({ status: 403, description: 'Not a participant in this conversation' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    async findById(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.conversationsService.findById(id, user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Find or create a conversation with another user' })
    @ApiResponse({ status: 201, description: 'Conversation found or created' })
    @ApiResponse({ status: 403, description: 'Can only message friends' })
    async findOrCreate(
        @Body() dto: CreateConversationDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.conversationsService.findOrCreate(user.id, dto.userId);
    }
}
