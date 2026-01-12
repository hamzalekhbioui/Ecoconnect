import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Send, ChevronDown, ChevronUp, Reply, CornerDownRight, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../config/supabase';
import { PostComment } from '../../../types';

interface CommentSectionProps {
    postId: string;
    commentCount: number;
    currentUserId?: string;
    currentUserAvatar?: string;
    currentUserName?: string;
}

// Transform database row to PostComment type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformComment = (row: any, userLikedIds?: Set<string>): PostComment => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return {
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        parentId: row.parent_id || null,
        content: row.content,
        createdAt: row.created_at,
        likeCount: row.like_count || 0,
        isLiked: userLikedIds ? userLikedIds.has(row.id) : false,
        author: profile ? {
            id: profile.id,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
        } : undefined,
        replies: [],
    };
};

// Build tree structure from flat comments list
const buildCommentTree = (comments: PostComment[]): PostComment[] => {
    const commentMap = new Map<string, PostComment>();
    const rootComments: PostComment[] = [];

    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
        const currentComment = commentMap.get(comment.id)!;
        if (comment.parentId) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
                parent.replies = parent.replies || [];
                parent.replies.push(currentComment);
            } else {
                rootComments.push(currentComment);
            }
        } else {
            rootComments.push(currentComment);
        }
    });

    return rootComments;
};

// Recursive CommentItem component
interface CommentItemProps {
    comment: PostComment;
    depth: number;
    postId: string;
    currentUserId?: string;
    currentUserAvatar?: string;
    currentUserName?: string;
    onReplyAdded: (newComment: PostComment) => void;
    onLikeToggled: (commentId: string, isLiked: boolean) => void;
    getRelativeTime: (dateString: string) => string;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    depth,
    postId,
    currentUserId,
    currentUserAvatar,
    currentUserName,
    onReplyAdded,
    onLikeToggled,
    getRelativeTime,
}) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isLiked, setIsLiked] = useState(comment.isLiked || false);
    const [likeCount, setLikeCount] = useState(comment.likeCount);
    const [isLiking, setIsLiking] = useState(false);

    // Toggle like/unlike
    const handleToggleLike = async () => {
        if (!currentUserId || isLiking) return;

        const wasLiked = isLiked;
        const previousCount = likeCount;

        // Optimistic update
        setIsLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        setIsLiking(true);

        try {
            if (wasLiked) {
                // Unlike: delete the like
                const { error } = await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('comment_id', comment.id)
                    .eq('user_id', currentUserId);

                if (error) throw error;
            } else {
                // Like: insert new like
                const { error } = await supabase
                    .from('comment_likes')
                    .insert({
                        comment_id: comment.id,
                        user_id: currentUserId,
                    });

                if (error) throw error;
            }

            onLikeToggled(comment.id, !wasLiked);
        } catch (err) {
            console.error('[CommentItem] Error toggling like:', err);
            // Rollback
            setIsLiked(wasLiked);
            setLikeCount(previousCount);
        } finally {
            setIsLiking(false);
        }
    };

    const handleReply = async () => {
        if (!currentUserId || !replyContent.trim() || submitting) return;

        const replyText = replyContent.trim();
        setSubmitting(true);

        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    author_id: currentUserId,
                    parent_id: comment.id,
                    content: replyText,
                })
                .select(`
                    id,
                    post_id,
                    author_id,
                    parent_id,
                    content,
                    created_at,
                    like_count,
                    profiles:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .single();

            if (error) {
                console.error('[CommentItem] Error adding reply:', error);
                return;
            }

            if (data) {
                const newComment = transformComment(data);
                onReplyAdded(newComment);
                setReplyContent('');
                setShowReplyInput(false);
            }
        } catch (err) {
            console.error('[CommentItem] Error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleReply();
        }
    };

    const maxDepth = 3;
    const indentLevel = Math.min(depth, maxDepth);

    return (
        <div style={{ marginLeft: depth > 0 ? `${indentLevel * 20}px` : 0 }}>
            <div className="flex gap-3 mb-3">
                {depth > 0 && (
                    <CornerDownRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2" />
                )}

                {comment.author?.avatarUrl ? (
                    <img
                        src={comment.author.avatarUrl}
                        alt={comment.author.fullName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                            {(comment.author?.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                                {comment.author?.fullName || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-400">
                                {getRelativeTime(comment.createdAt)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                        </p>
                    </div>

                    {/* Actions: Like and Reply */}
                    <div className="flex items-center gap-4 mt-1">
                        {/* Like button */}
                        <button
                            onClick={handleToggleLike}
                            disabled={!currentUserId || isLiking}
                            className={`flex items-center gap-1 text-xs transition-colors ${isLiked
                                ? 'text-red-500'
                                : 'text-gray-400 hover:text-red-500'
                                } disabled:opacity-50`}
                        >
                            <Heart
                                className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`}
                            />
                            {likeCount > 0 && <span>{likeCount}</span>}
                        </button>

                        {/* Reply button */}
                        {currentUserId && depth < maxDepth && (
                            <button
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
                            >
                                <Reply className="w-3 h-3" />
                                {showReplyInput ? 'Cancel' : 'Reply'}
                            </button>
                        )}
                    </div>

                    {/* Reply input */}
                    {showReplyInput && currentUserId && (
                        <div className="flex gap-2 mt-2">
                            {currentUserAvatar ? (
                                <img
                                    src={currentUserAvatar}
                                    alt={currentUserName}
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-white">
                                        {(currentUserName || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={`Reply to ${comment.author?.fullName || 'Anonymous'}...`}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={!replyContent.trim() || submitting}
                                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Send className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Render nested replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            postId={postId}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentUserAvatar}
                            currentUserName={currentUserName}
                            onReplyAdded={onReplyAdded}
                            onLikeToggled={onLikeToggled}
                            getRelativeTime={getRelativeTime}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const CommentSection: React.FC<CommentSectionProps> = ({
    postId,
    commentCount: initialCommentCount,
    currentUserId,
    currentUserAvatar,
    currentUserName,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [flatComments, setFlatComments] = useState<PostComment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [localCommentCount, setLocalCommentCount] = useState(initialCommentCount);

    const commentTree = buildCommentTree(flatComments);

    const fetchComments = useCallback(async () => {
        if (!isExpanded) return;

        setLoading(true);
        try {
            // Fetch comments
            const { data: commentsData, error: commentsError } = await supabase
                .from('post_comments')
                .select(`
                    id,
                    post_id,
                    author_id,
                    parent_id,
                    content,
                    created_at,
                    like_count,
                    profiles:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (commentsError) {
                console.error('[CommentSection] Error fetching comments:', commentsError);
                return;
            }

            // Fetch user's likes for these comments
            let userLikedIds = new Set<string>();
            if (currentUserId && commentsData && commentsData.length > 0) {
                const commentIds = commentsData.map((c: { id: string }) => c.id);
                const { data: likesData } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .eq('user_id', currentUserId)
                    .in('comment_id', commentIds);

                if (likesData) {
                    userLikedIds = new Set(likesData.map((l: { comment_id: string }) => l.comment_id));
                }
            }

            const transformedComments = (commentsData || []).map((row: unknown) =>
                transformComment(row, userLikedIds)
            );
            setFlatComments(transformedComments);
        } catch (err) {
            console.error('[CommentSection] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [postId, isExpanded, currentUserId]);

    useEffect(() => {
        if (isExpanded) {
            fetchComments();
        }
    }, [isExpanded, fetchComments]);

    const handleAddComment = async () => {
        if (!currentUserId || !newComment.trim() || submitting) return;

        const commentText = newComment.trim();
        setSubmitting(true);

        const optimisticComment: PostComment = {
            id: `temp-${Date.now()}`,
            postId,
            authorId: currentUserId,
            parentId: null,
            content: commentText,
            createdAt: new Date().toISOString(),
            likeCount: 0,
            isLiked: false,
            author: {
                id: currentUserId,
                fullName: currentUserName || 'You',
                avatarUrl: currentUserAvatar,
            },
            replies: [],
        };

        setFlatComments(prev => [...prev, optimisticComment]);
        setNewComment('');
        setLocalCommentCount(prev => prev + 1);

        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    author_id: currentUserId,
                    parent_id: null,
                    content: commentText,
                })
                .select(`
                    id,
                    post_id,
                    author_id,
                    parent_id,
                    content,
                    created_at,
                    like_count,
                    profiles:author_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .single();

            if (error) {
                console.error('[CommentSection] Error adding comment:', error);
                setFlatComments(prev => prev.filter(c => c.id !== optimisticComment.id));
                setLocalCommentCount(prev => prev - 1);
                setNewComment(commentText);
                return;
            }

            if (data) {
                const realComment = transformComment(data);
                setFlatComments(prev =>
                    prev.map(c => c.id === optimisticComment.id ? realComment : c)
                );
            }

            await supabase
                .from('posts')
                .update({ comment_count: localCommentCount })
                .eq('id', postId);

        } catch (err) {
            console.error('[CommentSection] Error:', err);
            setFlatComments(prev => prev.filter(c => c.id !== optimisticComment.id));
            setLocalCommentCount(prev => prev - 1);
            setNewComment(commentText);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplyAdded = (newReply: PostComment) => {
        setFlatComments(prev => [...prev, newReply]);
        setLocalCommentCount(prev => prev + 1);
    };

    const handleLikeToggled = (commentId: string, isLiked: boolean) => {
        // Update the flat comments state to reflect the like change
        setFlatComments(prev => prev.map(c =>
            c.id === commentId
                ? { ...c, isLiked, likeCount: isLiked ? c.likeCount + 1 : Math.max(0, c.likeCount - 1) }
                : c
        ));
    };

    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-3"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="w-4 h-4" />
                        Hide comments
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-4 h-4" />
                        {localCommentCount > 0
                            ? `View all ${localCommentCount} comment${localCommentCount !== 1 ? 's' : ''}`
                            : 'Add a comment'
                        }
                    </>
                )}
            </button>

            {isExpanded && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : commentTree.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                            {commentTree.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    depth={0}
                                    postId={postId}
                                    currentUserId={currentUserId}
                                    currentUserAvatar={currentUserAvatar}
                                    currentUserName={currentUserName}
                                    onReplyAdded={handleReplyAdded}
                                    onLikeToggled={handleLikeToggled}
                                    getRelativeTime={getRelativeTime}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-2">
                            No comments yet. Be the first to comment!
                        </p>
                    )}

                    {currentUserId && (
                        <div className="flex gap-3 pt-2 border-t border-gray-100">
                            {currentUserAvatar ? (
                                <img
                                    src={currentUserAvatar}
                                    alt={currentUserName}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-white">
                                        {(currentUserName || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 flex gap-2">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Write a comment..."
                                    rows={1}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || submitting}
                                    className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
