import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('events')
@Controller('api/events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    @ApiOperation({ summary: 'Get events with optional filters' })
    @ApiResponse({ status: 200, description: 'Returns list of events' })
    async findAll(@Query() query: EventQueryDto) {
        return this.eventsService.findAll(query);
    }

    @Get('upcoming/user')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get upcoming events for the current user' })
    @ApiResponse({ status: 200, description: 'Returns upcoming events from user communities' })
    async getUserUpcomingEvents(
        @CurrentUser() user: AuthenticatedUser,
        @Query('limit') limit?: number,
    ) {
        return this.eventsService.getUserUpcomingEvents(user.id, limit || 5);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an event by ID' })
    @ApiParam({ name: 'id', description: 'Event ID' })
    @ApiResponse({ status: 200, description: 'Returns the event' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    async findById(@Param('id') id: string) {
        return this.eventsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'Event created successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to create events in this community' })
    async create(
        @Body() dto: CreateEventDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.eventsService.create(dto, user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update an event' })
    @ApiParam({ name: 'id', description: 'Event ID' })
    @ApiResponse({ status: 200, description: 'Event updated successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to update this event' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEventDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.eventsService.update(id, dto, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete an event' })
    @ApiParam({ name: 'id', description: 'Event ID' })
    @ApiResponse({ status: 200, description: 'Event deleted successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to delete this event' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.eventsService.delete(id, user.id);
        return { message: 'Event deleted successfully' };
    }
}
