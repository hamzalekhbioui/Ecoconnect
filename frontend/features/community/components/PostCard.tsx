import React, { useState, useEffect } from 'react';
import { Post } from '../../../types';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../config/supabase';

interface PostCardProps {
    post: Post;
    onLike?: (postId: string) => Promise<void>;
    onComment?: (postId: string) => void;
    onDelete?: (postId: string) => Promise<void>;
    currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    onLike,
    onComment,
    onDelete,
    currentUserId,
}) => {
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [isLiking, setIsLiking] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isAuthor = currentUserId === post.authorId;

    // Sync local state with prop changes (when posts are refreshed)
    useEffect(() => {
        setLikeCount(post.likeCount);
        setIsLiked(post.isLiked || false);
    }, [post.likeCount, post.isLiked]);

    // Realtime subscription for like count updates
    useEffect(() => {
        // Subscribe to post_likes changes for this specific post
        const channel = supabase
            .channel(`post-likes-${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'post_likes',
                    filter: `post_id=eq.${post.id}`,
                },
                (payload) => {
                    console.log('[PostCard] Like added:', payload);
                    setLikeCount(prev => prev + 1);
                    // If current user liked, update isLiked
                    if (payload.new && (payload.new as { user_id: string }).user_id === currentUserId) {
                        setIsLiked(true);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'post_likes',
                    filter: `post_id=eq.${post.id}`,
                },
                (payload) => {
                    console.log('[PostCard] Like removed:', payload);
                    setLikeCount(prev => Math.max(0, prev - 1));
                    // If current user unliked, update isLiked
                    if (payload.old && (payload.old as { user_id: string }).user_id === currentUserId) {
                        setIsLiked(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post.id, currentUserId]);

    const handleLike = async () => {
        if (!onLike || isLiking) return;

        // Store previous state for rollback
        const wasLiked = isLiked;
        const previousCount = likeCount;

        // Optimistic update
        setIsLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        setIsLiking(true);

        try {
            await onLike(post.id);
        } catch (error) {
            // Rollback on error
            console.error('[PostCard] Error toggling like:', error);
            setIsLiked(wasLiked);
            setLikeCount(previousCount);
        } finally {
            setIsLiking(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        try {
            await onDelete(post.id);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
        setShowDeleteConfirm(false);
    };

    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {post.author?.avatarUrl ? (
                        <img
                            src={post.author.avatarUrl}
                            alt={post.author.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600">person</span>
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-gray-900">
                            {post.author?.fullName || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-500">{getRelativeTime(post.createdAt)}</p>
                    </div>
                </div>

                {/* Delete Button (Author only) */}
                {isAuthor && onDelete && (
                    <div className="relative">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDelete}
                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Body: Content */}
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

            {/* Body: Image */}
            {post.mediaUrl && (
                <div className="mb-4 -mx-5">
                    <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full max-h-[500px] object-cover"
                        loading="lazy"
                    />
                </div>
            )}

            {/* Footer: Engagement */}
            <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                {/* Like Button */}
                <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 transition-colors ${isLiked
                        ? 'text-red-500'
                        : 'text-gray-500 hover:text-red-500'
                        } disabled:opacity-50`}
                >
                    <span className={`material-symbols-outlined text-[20px] ${isLiked ? 'fill' : ''}`}>
                        {isLiked ? 'favorite' : 'favorite_border'}
                    </span>
                    <span className="text-sm font-medium">{likeCount}</span>
                </button>

                {/* Comment Button */}
                <button
                    onClick={() => onComment?.(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                    <span className="text-sm font-medium">{post.commentCount}</span>
                </button>


            </div>
        </div>
    );
};
