import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
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
import { PostsService } from './posts.service';
import { CreatePostDto, CreateCommentDto, PostQueryDto } from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('posts')
@Controller('api/posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Get()
    @ApiOperation({ summary: 'Get posts with optional filters' })
    @ApiResponse({ status: 200, description: 'Returns list of posts' })
    async findAll(@Query() query: PostQueryDto) {
        return this.postsService.findAll(query);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get posts by a specific user' })
    @ApiParam({ name: 'userId', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'Returns user posts' })
    async getUserPosts(
        @Param('userId') userId: string,
        @Query('limit') limit?: number,
    ) {
        return this.postsService.getUserPosts(userId, limit || 10);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a post by ID' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 200, description: 'Returns the post' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async findById(@Param('id') id: string) {
        return this.postsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create a new post' })
    @ApiResponse({ status: 201, description: 'Post created successfully' })
    async create(
        @Body() dto: CreatePostDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.postsService.create(dto, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete a post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 200, description: 'Post deleted successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to delete this post' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.postsService.delete(id, user.id);
        return { message: 'Post deleted successfully' };
    }

    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Toggle like on a post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 200, description: 'Like toggled' })
    async toggleLike(
        @Param('id') postId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.postsService.toggleLike(postId, user.id);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get comments for a post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 200, description: 'Returns list of comments' })
    async getComments(@Param('id') postId: string) {
        return this.postsService.getComments(postId);
    }

    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Add a comment to a post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 201, description: 'Comment added' })
    async addComment(
        @Param('id') postId: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.postsService.addComment(postId, dto, user.id);
    }

    @Delete('comments/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete a comment' })
    @ApiParam({ name: 'id', description: 'Comment ID' })
    @ApiResponse({ status: 200, description: 'Comment deleted' })
    @ApiResponse({ status: 403, description: 'Not authorized to delete this comment' })
    async deleteComment(
        @Param('id') commentId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.postsService.deleteComment(commentId, user.id);
        return { message: 'Comment deleted successfully' };
    }

    @Get('pending/:communityId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get pending posts for moderation' })
    @ApiParam({ name: 'communityId', description: 'Community ID' })
    @ApiResponse({ status: 200, description: 'Returns pending posts' })
    @ApiResponse({ status: 403, description: 'Not authorized to moderate this community' })
    async getPendingPosts(
        @Param('communityId') communityId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.postsService.getPendingPosts(communityId, user.id);
    }

    @Get('pending/:communityId/count')
    @ApiOperation({ summary: 'Get count of pending posts' })
    @ApiParam({ name: 'communityId', description: 'Community ID' })
    @ApiResponse({ status: 200, description: 'Returns pending posts count' })
    async getPendingPostsCount(@Param('communityId') communityId: string) {
        return this.postsService.getPendingPostsCount(communityId);
    }

    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Approve a pending post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 200, description: 'Post approved' })
    @ApiResponse({ status: 403, description: 'Not authorized to moderate this post' })
    async approvePost(
        @Param('id') postId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.postsService.approvePost(postId, user.id);
    }

    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Reject a pending post' })
    @ApiParam({ name: 'id', description: 'Post ID' })
    @ApiResponse({ status: 200, description: 'Post rejected' })
    @ApiResponse({ status: 403, description: 'Not authorized to moderate this post' })
    async rejectPost(
        @Param('id') postId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.postsService.rejectPost(postId, user.id);
    }
}
