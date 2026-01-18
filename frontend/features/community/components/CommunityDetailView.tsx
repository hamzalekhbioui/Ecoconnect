import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { RequestJoinModal } from './RequestJoinModal';
import { CommunityMembersList } from './CommunityMembersList';
import { CommunityEventsList } from './CommunityEventsList';
import { FeedList } from './FeedList';
import { PendingPostsPanel } from './PendingPostsPanel';
import { supabase } from '../../../config/supabase';
import { fetchPendingPostsCount } from '../services/postService';
import { Community, CommunityMember } from '../../../types';
import { Loader2, Users } from 'lucide-react';

export const CommunityDetailView: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, profile, user } = useAuth();

    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [community, setCommunity] = useState<Community | null>(null);
    const [communityAdminId, setCommunityAdminId] = useState<string | null>(null);

    const [membership, setMembership] = useState<CommunityMember | null>(null);
    const [showPendingPosts, setShowPendingPosts] = useState(false);
    const [pendingPostsCount, setPendingPostsCount] = useState(0);

    // Fetch community data from Supabase
    useEffect(() => {
        const fetchCommunityData = async () => {
            try {
                setLoading(true);

                // Fetch community by slug
                const { data: communityData, error: communityError } = await supabase
                    .from('communities')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (communityError) {
                    console.error('Error fetching community:', communityError);
                    setCommunity(null);
                    return;
                }

                // Transform to match Community type
                const transformedCommunity: Community = {
                    id: communityData.id,
                    name: communityData.name,
                    slug: communityData.slug,
                    description: communityData.description || '',
                    mission: communityData.mission,
                    coverImage: communityData.cover_image,
                    isPrivate: communityData.is_private,
                    memberCount: communityData.member_count,
                    tags: communityData.tags || [],
                };
                setCommunity(transformedCommunity);
                setCommunityAdminId(communityData.created_by || null);


                // Check if current user is a member
                if (user?.id && communityData.id) {
                    const { data: membershipData } = await supabase
                        .from('community_members')
                        .select('*')
                        .eq('community_id', communityData.id)
                        .eq('user_id', user.id)
                        .single();

                    if (membershipData) {
                        setMembership({
                            id: membershipData.id,
                            userId: membershipData.user_id,
                            communityId: membershipData.community_id,
                            role: membershipData.role,
                            status: membershipData.status,
                            joinedAt: membershipData.joined_at,
                        });
                    }
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchCommunityData();
        }
    }, [slug, user?.id]);

    const isMember = membership?.status === 'approved';
    const isPending = membership?.status === 'pending';
    const isAdmin = user?.id === communityAdminId;

    // Fetch pending posts count for admins
    const loadPendingPostsCount = useCallback(async () => {
        if (!isAdmin || !community?.id) return;
        try {
            const count = await fetchPendingPostsCount(community.id);
            setPendingPostsCount(count);
        } catch (err) {
            console.error('[CommunityDetailView] Error fetching pending posts count:', err);
        }
    }, [isAdmin, community?.id]);

    useEffect(() => {
        loadPendingPostsCount();
    }, [loadPendingPostsCount]);

    // Handle join request
    const handleJoinRequest = async (message: string) => {
        if (!user?.id || !community?.id) return;

        try {
            // Insert join request with pending status for private communities
            const { error } = await supabase
                .from('community_members')
                .insert({
                    user_id: user.id,
                    community_id: community.id,
                    role: 'member',
                    status: 'pending', // All communities now require approval
                });

            if (error) {
                console.error('Error joining community:', error);
                return;
            }

            // If private community, create notification for community admin
            if (community.isPrivate && communityAdminId) {
                const userName = profile?.full_name || 'A user';
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: communityAdminId,
                        type: 'join_request',
                        title: 'New Join Request',
                        message: `${userName} wants to join ${community.name}`,
                        data: {
                            community_id: community.id,
                            community_name: community.name,
                            requester_id: user.id,
                            requester_name: userName,
                            request_message: message,
                        },
                    });
            }

            // Refresh membership status
            const { data: membershipData } = await supabase
                .from('community_members')
                .select('*')
                .eq('community_id', community.id)
                .eq('user_id', user.id)
                .single();

            if (membershipData) {
                setMembership({
                    id: membershipData.id,
                    userId: membershipData.user_id,
                    communityId: membershipData.community_id,
                    role: membershipData.role,
                    status: membershipData.status,
                    joinedAt: membershipData.joined_at,
                });
            }

            setIsJoinModalOpen(false);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading community...</p>
                </div>
            </div>
        );
    }

    if (!community) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Community not found</h2>
                    <p className="text-gray-500 mb-6">The community you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/communities')}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Browse Communities
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative h-72 md:h-96">
                {community.coverImage ? (
                    <img
                        src={community.coverImage}
                        alt={community.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate('/communities')}
                    className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    <span className="font-medium">Back</span>
                </button>

                {/* Community Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {community.isPrivate && (
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                    Private
                                </span>
                            )}
                            {community.tags.slice(0, 4).map((tag, i) => (
                                <span key={i} className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{community.name}</h1>
                        <p className="text-white/80 text-lg max-w-2xl">{community.description}</p>
                    </div>
                </div>
            </div>

            {/* Stats & Actions Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Stats */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400">group</span>
                                <span className="font-semibold text-gray-900">{community.memberCount.toLocaleString()}</span>
                                <span className="text-gray-500">members</span>
                            </div>

                        </div>

                        {/* Action Button */}
                        <div>
                            {isMember || isAdmin ? (
                                <button
                                    onClick={() => navigate(`/dashboard/my-communities`)}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                                    Enter Dashboard
                                </button>
                            ) : isPending ? (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-100 text-amber-700 font-medium rounded-full cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                                    Request Pending
                                </button>
                            ) : (
                                <button
                                    onClick={() => isAuthenticated ? setIsJoinModalOpen(true) : navigate('/login')}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {community.isPrivate ? 'lock' : 'person_add'}
                                    </span>
                                    Request to Join
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Mission & About */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-500">flag</span>
                                Our Mission
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {community.mission || community.description}
                            </p>

                            {/* Tags */}
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Focus Areas</h3>
                            <div className="flex flex-wrap gap-2">
                                {community.tags.map((tag, i) => (
                                    <span key={i} className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Member Preview */}
                            {isMember && membership && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Your Role</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emerald-600">
                                                {membership.role === 'admin' ? 'shield_person' :
                                                    membership.role === 'moderator' ? 'verified_user' : 'person'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 capitalize">{membership.role}</p>
                                            <p className="text-sm text-gray-500">
                                                Joined {new Date(membership.joinedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Admin Moderation Panel */}
                                    {isAdmin && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Admin Tools</h3>
                                            <button
                                                onClick={() => setShowPendingPosts(!showPendingPosts)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${showPendingPosts
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                                                    <span className="font-medium">Pending Posts</span>
                                                </div>
                                                {pendingPostsCount > 0 && (
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                                        {pendingPostsCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Feed, Sub-Communities, Events, Members */}
                    <div className="lg:col-span-2">
                        {/* Pending Posts Panel - Admin Only */}
                        {isAdmin && showPendingPosts && (
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500">pending_actions</span>
                                        <h2 className="text-xl font-bold text-gray-900">Pending Posts</h2>
                                        {pendingPostsCount > 0 && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                                                {pendingPostsCount} awaiting review
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowPendingPosts(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <PendingPostsPanel
                                    communityId={community.id}
                                    onPostModerated={loadPendingPostsCount}
                                />
                            </div>
                        )}

                        {/* Community Feed - Only for approved members */}
                        {isMember && (
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-emerald-500">forum</span>
                                    <h2 className="text-xl font-bold text-gray-900">Community Feed</h2>
                                </div>
                                <FeedList
                                    communityId={community.id}
                                    currentUserId={user?.id}
                                    currentUserAvatar={profile?.avatar_url || undefined}
                                    currentUserName={profile?.full_name}
                                    canPost={true}
                                />
                            </div>
                        )}


                        {/* Community Events */}
                        {(isMember || (user?.id && communityAdminId === user.id)) && (
                            <div className="mt-10">
                                <CommunityEventsList
                                    communityId={community.id}
                                    isCreator={user?.id === communityAdminId}
                                    creatorId={communityAdminId || ''}
                                />
                            </div>
                        )}

                        {/* Members Directory */}
                        <div className="mt-10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-500" />
                                    Members Directory
                                </h2>
                                <span className="text-sm text-gray-500">{community.memberCount} members</span>
                            </div>
                            <CommunityMembersList
                                communityId={community.id}
                                creatorId={communityAdminId}
                                isMember={isMember}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Join Modal */}
            <RequestJoinModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                community={community}
                onSubmit={handleJoinRequest}
            />
        </div>
    );
};
