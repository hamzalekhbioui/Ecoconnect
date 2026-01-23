import { api, buildQueryString } from '../../../config/api';
import { Post, PostComment, UserPost } from '../../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface CreatePostInput {
    communityId: string;
    content: string;
    mediaFile?: File;
}

interface ApiPost {
    id: string;
    communityId: string;
    authorId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    author?: { id: string; full_name: string; avatar_url?: string };
    community?: { id: string; name: string; slug: string; cover_image?: string };
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
}

interface ApiComment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    parentId?: string;
    createdAt: string;
    author?: { id: string; full_name: string; avatar_url?: string };
}

// =============================================================================
// TRANSFORMERS
// =============================================================================

const transformApiPost = (apiPost: ApiPost): Post => ({
    id: apiPost.id,
    content: apiPost.content,
    mediaUrl: apiPost.mediaUrl,
    mediaType: apiPost.mediaType as 'image' | 'video' | undefined,
    authorId: apiPost.authorId,
    communityId: apiPost.communityId,
    status: apiPost.status as 'pending' | 'published' | 'rejected',
    likeCount: apiPost.likeCount,
    commentCount: apiPost.commentCount,
    createdAt: apiPost.createdAt,
    author: apiPost.author ? {
        id: apiPost.author.id,
        fullName: apiPost.author.full_name,
        avatarUrl: apiPost.author.avatar_url,
    } : undefined,
    isLiked: apiPost.isLiked,
});

const transformApiComment = (apiComment: ApiComment): PostComment => ({
    id: apiComment.id,
    postId: apiComment.postId,
    authorId: apiComment.authorId,
    content: apiComment.content,
    parentId: apiComment.parentId,
    createdAt: apiComment.createdAt,
    likeCount: 0,
    author: apiComment.author ? {
        id: apiComment.author.id,
        fullName: apiComment.author.full_name,
        avatarUrl: apiComment.author.avatar_url,
    } : undefined,
});

const transformApiUserPost = (apiPost: ApiPost): UserPost => ({
    ...transformApiPost(apiPost),
    community: apiPost.community ? {
        id: apiPost.community.id,
        name: apiPost.community.name,
        slug: apiPost.community.slug,
        coverImage: apiPost.community.cover_image,
    } : undefined,
});

// =============================================================================
// POST FUNCTIONS
// =============================================================================

/**
 * Fetch PUBLISHED posts for a specific community (paginated, newest first)
 */
export const fetchCommunityPosts = async (
    communityId: string,
    _currentUserId?: string,
    limit: number = 20,
    offset: number = 0
): Promise<Post[]> => {
    const query = buildQueryString({ communityId, limit, offset });
    const posts = await api.get<ApiPost[]>(`/api/posts${query}`);
    return posts.map(transformApiPost);
};

/**
 * Create a new post
 */
export const createPost = async (
    input: CreatePostInput,
    _authorId: string
): Promise<Post> => {
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    // Upload media if provided
    if (input.mediaFile) {
        const uploadResult = await api.uploadFile('/api/upload/post-media', input.mediaFile);
        mediaUrl = uploadResult.url;
        mediaType = 'image';
    }

    const post = await api.post<ApiPost>('/api/posts', {
        communityId: input.communityId,
        content: input.content,
        mediaUrl,
        mediaType,
    });

    return transformApiPost(post);
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
    await api.delete(`/api/posts/${postId}`);
};

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 */
export const toggleLike = async (postId: string, _userId: string): Promise<boolean> => {
    const result = await api.post<{ liked: boolean }>(`/api/posts/${postId}/like`);
    return result.liked;
};

/**
 * Fetch comments for a post
 */
export const fetchPostComments = async (postId: string): Promise<PostComment[]> => {
    const comments = await api.get<ApiComment[]>(`/api/posts/${postId}/comments`);
    return comments.map(transformApiComment);
};

/**
 * Add a comment to a post
 */
export const addComment = async (
    postId: string,
    _authorId: string,
    content: string,
    parentId?: string
): Promise<PostComment> => {
    const comment = await api.post<ApiComment>(`/api/posts/${postId}/comments`, {
        content,
        parentId,
    });
    return transformApiComment(comment);
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
    await api.delete(`/api/posts/comments/${commentId}`);
};

// =============================================================================
// POST MODERATION FUNCTIONS (Admin only)
// =============================================================================

/**
 * Fetch PENDING posts for a community (Admin moderation)
 */
export const fetchPendingPosts = async (communityId: string): Promise<Post[]> => {
    const posts = await api.get<ApiPost[]>(`/api/posts/pending/${communityId}`);
    return posts.map(transformApiPost);
};

/**
 * Get count of pending posts for a community (for badge)
 */
export const fetchPendingPostsCount = async (communityId: string): Promise<number> => {
    const result = await api.get<{ count: number }>(`/api/posts/pending/${communityId}/count`);
    return result.count;
};

/**
 * Approve a post (set status to 'published')
 */
export const approvePost = async (postId: string): Promise<void> => {
    await api.patch(`/api/posts/${postId}/approve`);
};

/**
 * Reject a post (set status to 'rejected')
 */
export const rejectPost = async (postId: string): Promise<void> => {
    await api.patch(`/api/posts/${postId}/reject`);
};

// =============================================================================
// USER POST HISTORY (Dashboard)
// =============================================================================

/**
 * Fetch all published posts by a specific user (for Dashboard)
 */
export const fetchUserPosts = async (
    userId: string,
    limit: number = 10
): Promise<UserPost[]> => {
    const query = buildQueryString({ limit });
    const posts = await api.get<ApiPost[]>(`/api/posts/user/${userId}${query}`);
    return posts.map(transformApiUserPost);
};
