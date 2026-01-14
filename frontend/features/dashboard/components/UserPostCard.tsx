import React from 'react';
import { UserPost } from '../../../types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Users } from 'lucide-react';

interface UserPostCardProps {
    post: UserPost;
}

export const UserPostCard: React.FC<UserPostCardProps> = ({ post }) => {
    const navigate = useNavigate();

    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Just now';
        }
    };

    const truncateContent = (content: string, maxLength: number = 120) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength).trim() + '...';
    };

    const handleClick = () => {
        if (post.community?.slug) {
            navigate(`/communities/${post.community.slug}`);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group"
        >
            {/* Posted in Community Header */}
            <div className="flex items-center gap-2 mb-3">
                {post.community?.coverImage ? (
                    <img
                        src={post.community.coverImage}
                        alt={post.community.name}
                        className="w-6 h-6 rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                )}
                <span className="text-xs text-gray-500">
                    Posted in{' '}
                    <span className="font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                        {post.community?.name || 'Unknown Community'}
                    </span>
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                    {getRelativeTime(post.createdAt)}
                </span>
            </div>

            {/* Post Content Preview */}
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {truncateContent(post.content)}
            </p>

            {/* Media Thumbnail (if exists) */}
            {post.mediaUrl && (
                <div className="mb-3 rounded-lg overflow-hidden">
                    <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full h-24 object-cover"
                    />
                </div>
            )}

            {/* Engagement Footer */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-gray-500">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-medium">{post.likeCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{post.commentCount}</span>
                </div>
            </div>
        </div>
    );
};
