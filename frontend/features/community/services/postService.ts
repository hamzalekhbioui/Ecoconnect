import { supabase } from '../../../config/supabase';
import { Post, PostRow, PostComment, PostCommentRow } from '../../../types';

// Extended row type with aggregated counts
interface PostRowWithCounts extends PostRow {
    post_likes: { count: number }[];
    post_comments: { count: number }[];
}

/**
 * Transform database row to frontend type
 */
const transformPostRow = (
    row: PostRowWithCounts,
    currentUserId?: string,
    likedPostIds?: Set<string>
): Post => {
    // Extract counts from aggregated data (Supabase returns array with count object)
    const likeCount = row.post_likes?.[0]?.count ?? row.like_count ?? 0;
    const commentCount = row.post_comments?.[0]?.count ?? row.comment_count ?? 0;

    return {
        id: row.id,
        content: row.content,
        mediaUrl: row.media_url,
        mediaType: row.media_type,
        authorId: row.author_id,
        communityId: row.community_id,
        likeCount,
        commentCount,
        createdAt: row.created_at,
        author: row.profiles ? {
            id: row.profiles.id,
            fullName: row.profiles.full_name,
            avatarUrl: row.profiles.avatar_url,
        } : undefined,
        isLiked: likedPostIds ? likedPostIds.has(row.id) : false,
    };
};

const transformCommentRow = (row: PostCommentRow): PostComment => ({
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    author: row.profiles ? {
        id: row.profiles.id,
        fullName: row.profiles.full_name,
        avatarUrl: row.profiles.avatar_url,
    } : undefined,
});

/**
 * Fetch posts for a specific community (paginated, newest first)
 * Uses COUNT aggregation on post_likes and post_comments for accurate counts
 */
export const fetchCommunityPosts = async (
    communityId: string,
    currentUserId?: string,
    limit: number = 20,
    offset: number = 0
): Promise<Post[]> => {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:author_id(id, full_name, avatar_url),
            post_likes(count),
            post_comments(count)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('[postService] Error fetching community posts:', error);
        throw error;
    }

    // Fetch which posts the current user has liked
    let likedPostIds = new Set<string>();
    if (currentUserId && data && data.length > 0) {
        const postIds = data.map(p => p.id);
        const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', currentUserId)
            .in('post_id', postIds);

        if (likes) {
            likedPostIds = new Set(likes.map(l => l.post_id));
        }
    }

    return (data as PostRowWithCounts[]).map(row => transformPostRow(row, currentUserId, likedPostIds));
};

/**
 * Create a new post
 */
export interface CreatePostInput {
    communityId: string;
    content: string;
    mediaFile?: File;
}

export const createPost = async (
    input: CreatePostInput,
    authorId: string
): Promise<Post> => {
    let mediaUrl: string | undefined;

    // Upload media if provided
    if (input.mediaFile) {
        const fileExt = input.mediaFile.name.split('.').pop();
        const fileName = `${authorId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(fileName, input.mediaFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('[postService] Error uploading media:', uploadError);
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from('post-media')
            .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
    }

    // Insert the post
    const { data, error } = await supabase
        .from('posts')
        .insert({
            community_id: input.communityId,
            author_id: authorId,
            content: input.content,
            media_url: mediaUrl,
            media_type: mediaUrl ? 'image' : null,
        })
        .select(`
            *,
            profiles:author_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) {
        console.error('[postService] Error creating post:', error);
        throw error;
    }

    // For newly created posts, likes and comments are 0
    const postWithCounts: PostRowWithCounts = {
        ...(data as PostRow),
        post_likes: [{ count: 0 }],
        post_comments: [{ count: 0 }],
    };
    return transformPostRow(postWithCounts, authorId, new Set());
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error('[postService] Error deleting post:', error);
        throw error;
    }
};

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 */
export const toggleLike = async (postId: string, userId: string): Promise<boolean> => {
    // Check if already liked
    const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) {
            console.error('[postService] Error unliking post:', error);
            throw error;
        }
        return false; // Now not liked
    } else {
        // Like
        const { error } = await supabase
            .from('post_likes')
            .insert({
                post_id: postId,
                user_id: userId,
            });

        if (error) {
            console.error('[postService] Error liking post:', error);
            throw error;
        }
        return true; // Now liked
    }
};

/**
 * Fetch comments for a post
 */
export const fetchPostComments = async (postId: string): Promise<PostComment[]> => {
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            *,
            profiles:author_id(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[postService] Error fetching comments:', error);
        throw error;
    }

    return (data as PostCommentRow[]).map(transformCommentRow);
};

/**
 * Add a comment to a post
 */
export const addComment = async (
    postId: string,
    authorId: string,
    content: string
): Promise<PostComment> => {
    const { data, error } = await supabase
        .from('post_comments')
        .insert({
            post_id: postId,
            author_id: authorId,
            content,
        })
        .select(`
            *,
            profiles:author_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) {
        console.error('[postService] Error adding comment:', error);
        throw error;
    }

    return transformCommentRow(data as PostCommentRow);
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
    const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        console.error('[postService] Error deleting comment:', error);
        throw error;
    }
};
