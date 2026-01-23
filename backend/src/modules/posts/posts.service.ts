import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreatePostDto, CreateCommentDto, PostQueryDto } from './dto';

@Injectable()
export class PostsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Fetch posts with pagination and filters.
     */
    async findAll(query: PostQueryDto, currentUserId?: string) {
        const supabase = this.supabaseService.getAdminClient();
        const { communityId, authorId, limit = 20, offset = 0 } = query;

        let queryBuilder = supabase
            .from('posts')
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, full_name, avatar_url),
                community:communities!posts_community_id_fkey(id, name, slug),
                post_likes(count),
                post_comments(count)
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (communityId) {
            queryBuilder = queryBuilder.eq('community_id', communityId);
        }

        if (authorId) {
            queryBuilder = queryBuilder.eq('author_id', authorId);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        // Get liked post IDs for current user
        let likedPostIds = new Set<string>();
        if (currentUserId && data && data.length > 0) {
            const postIds = data.map(p => p.id);
            const { data: likes } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', currentUserId)
                .in('post_id', postIds);

            likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        }

        return data?.map(post => ({
            id: post.id,
            communityId: post.community_id,
            authorId: post.author_id,
            content: post.content,
            mediaUrl: post.media_url,
            mediaType: post.media_type,
            status: post.status,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            author: post.author,
            community: post.community,
            likeCount: post.post_likes?.[0]?.count || 0,
            commentCount: post.post_comments?.[0]?.count || 0,
            isLiked: likedPostIds.has(post.id),
        }));
    }

    /**
     * Get a single post by ID.
     */
    async findById(id: string, currentUserId?: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, full_name, avatar_url),
                community:communities!posts_community_id_fkey(id, name, slug),
                post_likes(count),
                post_comments(count)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Post not found');
            }
            throw error;
        }

        // Check if user liked this post
        let isLiked = false;
        if (currentUserId) {
            const { data: like } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', id)
                .eq('user_id', currentUserId)
                .maybeSingle();
            isLiked = !!like;
        }

        return {
            id: data.id,
            communityId: data.community_id,
            authorId: data.author_id,
            content: data.content,
            mediaUrl: data.media_url,
            mediaType: data.media_type,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            author: data.author,
            community: data.community,
            likeCount: data.post_likes?.[0]?.count || 0,
            commentCount: data.post_comments?.[0]?.count || 0,
            isLiked,
        };
    }

    /**
     * Create a new post.
     */
    async create(dto: CreatePostDto, authorId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check if community requires post approval
        const { data: community } = await supabase
            .from('communities')
            .select('requires_post_approval, created_by')
            .eq('id', dto.communityId)
            .single();

        if (!community) {
            throw new NotFoundException('Community not found');
        }

        // Auto-approve if user is community creator or no approval required
        const status = (!community.requires_post_approval || community.created_by === authorId)
            ? 'published'
            : 'pending';

        const { data, error } = await supabase
            .from('posts')
            .insert({
                community_id: dto.communityId,
                author_id: authorId,
                content: dto.content,
                media_url: dto.mediaUrl,
                media_type: dto.mediaType,
                status,
            })
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, full_name, avatar_url),
                community:communities!posts_community_id_fkey(id, name, slug)
            `)
            .single();

        if (error) throw error;

        return {
            ...data,
            likeCount: 0,
            commentCount: 0,
            isLiked: false,
            isPending: status === 'pending',
        };
    }

    /**
     * Delete a post.
     */
    async delete(id: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Get post to check ownership
        const { data: post } = await supabase
            .from('posts')
            .select('author_id, community:communities(created_by)')
            .eq('id', id)
            .single();

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Allow deletion by author or community creator
        const communityCreator = (post.community as any)?.created_by;
        if (post.author_id !== userId && communityCreator !== userId) {
            throw new ForbiddenException('Not authorized to delete this post');
        }

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Toggle like on a post.
     */
    async toggleLike(postId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check if already liked
        const { data: existing } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            // Unlike
            await supabase
                .from('post_likes')
                .delete()
                .eq('id', existing.id);

            return { liked: false };
        } else {
            // Like
            await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: userId });

            return { liked: true };
        }
    }

    /**
     * Get comments for a post.
     */
    async getComments(postId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('post_comments')
            .select(`
                *,
                author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data?.map(comment => ({
            id: comment.id,
            postId: comment.post_id,
            authorId: comment.author_id,
            content: comment.content,
            parentId: comment.parent_id,
            createdAt: comment.created_at,
            author: comment.author,
        }));
    }

    /**
     * Add a comment to a post.
     */
    async addComment(postId: string, dto: CreateCommentDto, authorId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                author_id: authorId,
                content: dto.content,
                parent_id: dto.parentId,
            })
            .select(`
                *,
                author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            postId: data.post_id,
            authorId: data.author_id,
            content: data.content,
            parentId: data.parent_id,
            createdAt: data.created_at,
            author: data.author,
        };
    }

    /**
     * Delete a comment.
     */
    async deleteComment(commentId: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const { data: comment } = await supabase
            .from('post_comments')
            .select('author_id')
            .eq('id', commentId)
            .single();

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.author_id !== userId) {
            throw new ForbiddenException('Not authorized to delete this comment');
        }

        const { error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
    }

    /**
     * Get pending posts for a community (moderation).
     */
    async getPendingPosts(communityId: string, adminUserId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify user is community admin
        const { data: community } = await supabase
            .from('communities')
            .select('created_by')
            .eq('id', communityId)
            .single();

        if (!community || community.created_by !== adminUserId) {
            throw new ForbiddenException('Not authorized to moderate this community');
        }

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, full_name, avatar_url)
            `)
            .eq('community_id', communityId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data;
    }

    /**
     * Get count of pending posts for a community.
     */
    async getPendingPostsCount(communityId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { count, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', communityId)
            .eq('status', 'pending');

        if (error) throw error;

        return { count: count || 0 };
    }

    /**
     * Approve a pending post.
     */
    async approvePost(postId: string, adminUserId: string) {
        return this.moderatePost(postId, 'published', adminUserId);
    }

    /**
     * Reject a pending post.
     */
    async rejectPost(postId: string, adminUserId: string) {
        return this.moderatePost(postId, 'rejected', adminUserId);
    }

    private async moderatePost(postId: string, status: 'published' | 'rejected', adminUserId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Get post and verify admin
        const { data: post } = await supabase
            .from('posts')
            .select('community_id, community:communities(created_by)')
            .eq('id', postId)
            .single();

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const communityCreator = (post.community as any)?.created_by;
        if (communityCreator !== adminUserId) {
            throw new ForbiddenException('Not authorized to moderate this post');
        }

        const { data, error } = await supabase
            .from('posts')
            .update({ status })
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Get posts by a specific user.
     */
    async getUserPosts(userId: string, limit: number = 10) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                community:communities!posts_community_id_fkey(id, name, slug, cover_image),
                post_likes(count),
                post_comments(count)
            `)
            .eq('author_id', userId)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data?.map(post => ({
            id: post.id,
            communityId: post.community_id,
            content: post.content,
            mediaUrl: post.media_url,
            createdAt: post.created_at,
            community: post.community,
            likeCount: post.post_likes?.[0]?.count || 0,
            commentCount: post.post_comments?.[0]?.count || 0,
        }));
    }
}
