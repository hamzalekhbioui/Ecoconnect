import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
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
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('friendships')
@Controller('api/friendships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FriendshipsController {
    constructor(private readonly friendshipsService: FriendshipsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all friends of the current user' })
    @ApiResponse({ status: 200, description: 'Returns list of friends' })
    async getFriends(@CurrentUser() user: AuthenticatedUser) {
        return this.friendshipsService.getFriends(user.id);
    }

    @Get('pending')
    @ApiOperation({ summary: 'Get pending friend requests' })
    @ApiResponse({ status: 200, description: 'Returns pending requests' })
    async getPendingRequests(@CurrentUser() user: AuthenticatedUser) {
        return this.friendshipsService.getPendingRequests(user.id);
    }

    @Get('status/:userId')
    @ApiOperation({ summary: 'Get friendship status with a user' })
    @ApiParam({ name: 'userId', description: 'User ID to check status with' })
    @ApiResponse({ status: 200, description: 'Returns friendship status' })
    async getFriendshipStatus(
        @Param('userId') otherUserId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const status = await this.friendshipsService.getFriendshipStatus(user.id, otherUserId);
        return status || { status: null };
    }

    @Get('check/:userId')
    @ApiOperation({ summary: 'Check if current user is friends with another user' })
    @ApiParam({ name: 'userId', description: 'User ID to check' })
    @ApiResponse({ status: 200, description: 'Returns boolean indicating friendship' })
    async areFriends(
        @Param('userId') otherUserId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const areFriends = await this.friendshipsService.areFriends(user.id, otherUserId);
        return { areFriends };
    }

    @Post('request/:userId')
    @ApiOperation({ summary: 'Send a friend request' })
    @ApiParam({ name: 'userId', description: 'User ID to send request to' })
    @ApiResponse({ status: 201, description: 'Friend request sent' })
    @ApiResponse({ status: 400, description: 'Cannot send request (no shared community, etc.)' })
    @ApiResponse({ status: 409, description: 'Request already exists' })
    async sendFriendRequest(
        @Param('userId') receiverId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.friendshipsService.sendFriendRequest(user.id, receiverId);
    }

    @Patch(':id/accept')
    @ApiOperation({ summary: 'Accept a friend request' })
    @ApiParam({ name: 'id', description: 'Friendship ID' })
    @ApiResponse({ status: 200, description: 'Friend request accepted' })
    @ApiResponse({ status: 400, description: 'Only the receiver can accept' })
    @ApiResponse({ status: 404, description: 'Friend request not found' })
    async acceptFriendRequest(
        @Param('id') friendshipId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.friendshipsService.acceptFriendRequest(friendshipId, user.id);
    }

    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject a friend request' })
    @ApiParam({ name: 'id', description: 'Friendship ID' })
    @ApiResponse({ status: 200, description: 'Friend request rejected' })
    @ApiResponse({ status: 400, description: 'Only the receiver can reject' })
    @ApiResponse({ status: 404, description: 'Friend request not found' })
    async rejectFriendRequest(
        @Param('id') friendshipId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.friendshipsService.rejectFriendRequest(friendshipId, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancel a friend request or unfriend' })
    @ApiParam({ name: 'id', description: 'Friendship ID' })
    @ApiResponse({ status: 200, description: 'Friendship removed' })
    @ApiResponse({ status: 404, description: 'Friendship not found' })
    async cancelOrUnfriend(
        @Param('id') friendshipId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.friendshipsService.cancelOrUnfriend(friendshipId, user.id);
        return { message: 'Friendship removed successfully' };
    }
}
