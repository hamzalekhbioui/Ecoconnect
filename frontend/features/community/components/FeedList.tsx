import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Post } from '../../../types';
import { CreatePostWidget } from './CreatePostWidget';
import { PostCard } from './PostCard';
import { fetchCommunityPosts, createPost, deletePost, toggleLike } from '../services/postService';

interface FeedListProps {
    communityId: string;
    currentUserId?: string;
    currentUserAvatar?: string;
    currentUserName?: string;
    canPost?: boolean;
}

export const FeedList: React.FC<FeedListProps> = ({
    communityId,
    currentUserId,
    currentUserAvatar,
    currentUserName,
    canPost = true,
}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchCommunityPosts(communityId, currentUserId);
            setPosts(data);
        } catch (err) {
            console.error('Error loading posts:', err);
            setError('Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [communityId, currentUserId]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handlePost = async (content: string, mediaFile?: File) => {
        if (!currentUserId) return;

        const newPost = await createPost(
            { communityId, content, mediaFile },
            currentUserId
        );
        // Add new post to top of list
        setPosts(prev => [newPost, ...prev]);
    };

    const handleLike = async (postId: string) => {
        if (!currentUserId) return;
        await toggleLike(postId, currentUserId);
    };

    const handleDelete = async (postId: string) => {
        await deletePost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    const handleComment = (postId: string) => {
        // TODO: Open comment modal/section
        console.log('Open comments for post:', postId);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                <p className="text-gray-500">Loading posts...</p>
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
