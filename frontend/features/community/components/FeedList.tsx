import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../../../types';
import { CreatePostWidget } from './CreatePostWidget';
import { PostCard } from './PostCard';
import { fetchCommunityPosts, createPost, deletePost, toggleLike } from '../services/postService';
import { supabase } from '../../../config/supabase';

interface FeedListProps {
    communityId: string;
    currentUserId?: string;
    currentUserAvatar?: string;
    currentUserName?: string;
    canPost?: boolean;
}

// Helper to check if error is auth-related
const isAuthError = (error: unknown): boolean => {
    if (error && typeof error === 'object') {
        const err = error as { code?: string; message?: string; status?: number };
        // Check for common auth error patterns
        if (err.code === 'PGRST301' || err.code === '401' || err.status === 401) return true;
        if (err.message?.toLowerCase().includes('jwt') ||
            err.message?.toLowerCase().includes('token') ||
            err.message?.toLowerCase().includes('unauthorized') ||
            err.message?.toLowerCase().includes('not authenticated')) return true;
    }
    return false;
};

export const FeedList: React.FC<FeedListProps> = ({
    communityId,
    currentUserId,
    currentUserAvatar,
    currentUserName,
    canPost = true,
}) => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setSessionExpired(false);
            const data = await fetchCommunityPosts(communityId, currentUserId);
            setPosts(data);
        } catch (err) {
            console.error('[FeedList] Error loading posts:', err);
            if (isAuthError(err)) {
                setSessionExpired(true);
                setError('Your session has expired. Please log in again.');
            } else {
                setError('Failed to load posts. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [communityId, currentUserId]);

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[FeedList] Auth state changed:', event);

            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                if (!session) {
                    setSessionExpired(true);
                    setError('Your session has expired. Please log in again.');
                } else {
                    // Token was refreshed, reload posts
                    setSessionExpired(false);
                    loadPosts();
                }
            } else if (event === 'SIGNED_IN') {
                // User signed back in, refresh posts
                setSessionExpired(false);
                loadPosts();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadPosts]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handlePost = async (content: string, mediaFile?: File) => {
        if (!currentUserId) {
            setSessionExpired(true);
            setError('You must be logged in to post.');
            return;
        }

        try {
            const newPost = await createPost(
                { communityId, content, mediaFile },
                currentUserId
            );
            // Add new post to top of list
            setPosts(prev => [newPost, ...prev]);
        } catch (err) {
            console.error('[FeedList] Error creating post:', err);
            if (isAuthError(err)) {
                setSessionExpired(true);
                setError('Your session has expired. Please log in again to post.');
            } else {
                // Show error toast/alert
                alert('Failed to create post. Please try again.');
            }
            throw err; // Re-throw so CreatePostWidget knows it failed
        }
    };

    const handleLike = async (postId: string) => {
        if (!currentUserId) return;
        try {
            await toggleLike(postId, currentUserId);
        } catch (err) {
            console.error('[FeedList] Error toggling like:', err);
            if (isAuthError(err)) {
                setSessionExpired(true);
                setError('Your session has expired. Please log in again.');
            }
            throw err;
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            await deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            console.error('[FeedList] Error deleting post:', err);
            if (isAuthError(err)) {
                setSessionExpired(true);
                setError('Your session has expired. Please log in again.');
            }
            throw err;
        }
    };

    const handleComment = (postId: string) => {
        // TODO: Open comment modal/section
        console.log('Open comments for post:', postId);
    };

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                <p className="text-gray-500">Loading posts...</p>
            </div>
        );
    }

    // Session expired state - show login prompt
    if (sessionExpired) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-amber-200 shadow-sm">
                <span className="material-symbols-outlined text-5xl text-amber-400 mb-3">login</span>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Session Expired</h3>
                <p className="text-gray-500 mb-4">{error || 'Please log in again to continue.'}</p>
                <button
                    onClick={handleLoginRedirect}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                    Log In
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-red-300 mb-3">error</span>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={loadPosts}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Create Post Widget */}
            {canPost && currentUserId && (
                <CreatePostWidget
                    onPost={handlePost}
                    userAvatar={currentUserAvatar}
                    userName={currentUserName}
                />
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">forum</span>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Be the first to share something with the community!</p>
                </div>
            ) : (
                posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onDelete={handleDelete}
                        currentUserId={currentUserId}
                    />
                ))
            )}
        </div>
    );
};
