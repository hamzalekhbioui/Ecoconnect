import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { Post } from '../../../types';
import { fetchPendingPosts, approvePost, rejectPost } from '../services/postService';
import { formatDistanceToNow } from 'date-fns';

interface PendingPostsPanelProps {
    communityId: string;
    onPostModerated?: () => void; // Callback to refresh counts
}

export const PendingPostsPanel: React.FC<PendingPostsPanelProps> = ({
    communityId,
    onPostModerated,
}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const loadPendingPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchPendingPosts(communityId);
            setPosts(data);
        } catch (err) {
            console.error('[PendingPostsPanel] Error loading pending posts:', err);
            setError('Failed to load pending posts.');
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        loadPendingPosts();
    }, [loadPendingPosts]);

    const handleApprove = async (postId: string) => {
        setActioningId(postId);
        try {
            await approvePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            onPostModerated?.();
        } catch (err) {
            console.error('[PendingPostsPanel] Error approving post:', err);
            alert('Failed to approve post.');
        } finally {
            setActioningId(null);
        }
    };

    const handleReject = async (postId: string) => {
        setActioningId(postId);
        try {
            await rejectPost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            onPostModerated?.();
        } catch (err) {
            console.error('[PendingPostsPanel] Error rejecting post:', err);
            alert('Failed to reject post.');
        } finally {
            setActioningId(null);
        }
    };

    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                <p className="text-gray-500">Loading pending posts...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <span className="material-symbols-outlined text-5xl text-red-300 mb-3">error</span>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={loadPendingPosts}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <span className="material-symbols-outlined text-5xl text-emerald-300 mb-3">check_circle</span>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
                <p className="text-gray-500">There are no pending posts to review.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <div
                    key={post.id}
                    className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                        {post.author?.avatarUrl ? (
                            <img
                                src={post.author.avatarUrl}
                                alt={post.author.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600">person</span>
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                                {post.author?.fullName || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{getRelativeTime(post.createdAt)}</span>
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                    Pending
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                    {/* Media */}
                    {post.mediaUrl && (
                        <div className="mb-4 -mx-5">
                            <img
                                src={post.mediaUrl}
                                alt="Post media"
                                className="w-full max-h-64 object-cover rounded-lg mx-5"
                                style={{ width: 'calc(100% - 2.5rem)' }}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => handleApprove(post.id)}
                            disabled={actioningId === post.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {actioningId === post.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Approve
                        </button>
                        <button
                            onClick={() => handleReject(post.id)}
                            disabled={actioningId === post.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {actioningId === post.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <X className="w-4 h-4" />
                            )}
                            Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
