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
    ApiQuery,
} from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import {
    CreateCommunityDto,
    UpdateCommunityDto,
    JoinCommunityDto,
    UpdateMemberStatusDto,
    CommunityQueryDto,
} from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('communities')
@Controller('api/communities')
export class CommunitiesController {
    constructor(private readonly communitiesService: CommunitiesService) { }

    @Get()
    @ApiOperation({ summary: 'List all communities' })
    @ApiResponse({ status: 200, description: 'Returns list of communities' })
    async findAll(@Query() query: CommunityQueryDto) {
        return this.communitiesService.findAll(query);
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get communities the current user is a member of' })
    @ApiResponse({ status: 200, description: 'Returns user communities' })
    async getUserCommunities(@CurrentUser() user: AuthenticatedUser) {
        return this.communitiesService.getUserCommunities(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a community by ID' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiResponse({ status: 200, description: 'Returns the community' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    async findById(@Param('id') id: string) {
        return this.communitiesService.findById(id);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get a community by slug' })
    @ApiParam({ name: 'slug', description: 'Community slug' })
    @ApiResponse({ status: 200, description: 'Returns the community' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    async findBySlug(@Param('slug') slug: string) {
        return this.communitiesService.findBySlug(slug);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new community' })
    @ApiResponse({ status: 201, description: 'Community created successfully' })
    @ApiResponse({ status: 409, description: 'Community with this name already exists' })
    async create(
        @Body() dto: CreateCommunityDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.communitiesService.create(dto, user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update a community' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiResponse({ status: 200, description: 'Community updated successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to update this community' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCommunityDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.communitiesService.update(id, dto, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete a community' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiResponse({ status: 200, description: 'Community deleted successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to delete this community' })
    @ApiResponse({ status: 404, description: 'Community not found' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.communitiesService.delete(id, user.id);
        return { message: 'Community deleted successfully' };
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Get members of a community' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by status (pending, approved, rejected)' })
    @ApiResponse({ status: 200, description: 'Returns list of members' })
    async getMembers(
        @Param('id') id: string,
        @Query('status') status?: string,
    ) {
        return this.communitiesService.getMembers(id, status);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Request to join a community' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiResponse({ status: 201, description: 'Join request submitted' })
    @ApiResponse({ status: 409, description: 'Already a member or pending request exists' })
    async join(
        @Param('id') id: string,
        @Body() dto: JoinCommunityDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.communitiesService.requestJoin(id, user.id, dto.message);
    }

    @Patch(':id/members/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update member status (approve/reject)' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiParam({ name: 'userId', description: 'User ID of the member' })
    @ApiResponse({ status: 200, description: 'Member status updated' })
    @ApiResponse({ status: 403, description: 'Not authorized to manage members' })
    async updateMemberStatus(
        @Param('id') communityId: string,
        @Param('userId') memberId: string,
        @Body() dto: UpdateMemberStatusDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.communitiesService.updateMemberStatus(communityId, memberId, dto.status, user.id);
    }

    @Delete(':id/members/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Remove a member from a community' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiParam({ name: 'userId', description: 'User ID of the member' })
    @ApiResponse({ status: 200, description: 'Member removed successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to remove this member' })
    async removeMember(
        @Param('id') communityId: string,
        @Param('userId') memberId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.communitiesService.removeMember(communityId, memberId, user.id);
        return { message: 'Member removed successfully' };
    }

    @Get(':id/membership')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Check if current user is a member of a community' })
    @ApiParam({ name: 'id', description: 'Community ID' })
    @ApiResponse({ status: 200, description: 'Returns membership status' })
    async checkMembership(
        @Param('id') communityId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const isMember = await this.communitiesService.isMember(communityId, user.id);
        return { isMember };
    }
}
