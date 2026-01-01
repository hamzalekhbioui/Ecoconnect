import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { RequestJoinModal } from './RequestJoinModal';
import { MOCK_COMMUNITIES, MOCK_SUB_COMMUNITIES, MOCK_COMMUNITY_MEMBERS } from '../data/mockCommunityData';
import { SubCommunity } from '../../../types';

export const CommunityDetailView: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, profile } = useAuth();

    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    // Find community by slug
    const community = useMemo(() =>
        MOCK_COMMUNITIES.find(c => c.slug === slug),
        [slug]
    );

    // Get sub-communities for this parent
    const subCommunities = useMemo(() =>
        MOCK_SUB_COMMUNITIES.filter(sc => sc.parentCommunityId === community?.id),
        [community]
    );

    // Check if current user is a member
    const membership = useMemo(() => {
        if (!isAuthenticated || !profile || !community) return null;
        return MOCK_COMMUNITY_MEMBERS.find(
            m => m.communityId === community.id && m.user?.fullName === profile.full_name
        );
    }, [isAuthenticated, profile, community]);

    const isMember = membership?.status === 'approved';
    const isPending = membership?.status === 'pending';

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

    const SubCommunityCard: React.FC<{ subCommunity: SubCommunity }> = ({ subCommunity }) => (
        <div
            onClick={() => isMember && navigate(`/communities/${slug}/sub/${subCommunity.id}`)}
            className={`bg-white rounded-xl border border-gray-100 overflow-hidden transition-all ${isMember
                    ? 'hover:shadow-lg cursor-pointer transform hover:-translate-y-1'
                    : 'opacity-75'
                }`}
        >
            {/* Image */}
            <div className="h-32 relative">
                {subCommunity.coverImage ? (
                    <img
                        src={subCommunity.coverImage}
                        alt={subCommunity.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                )}
                {!isMember && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-white/80">lock</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {subCommunity.focusArea && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wide">
                        {subCommunity.focusArea}
                    </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-1">{subCommunity.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{subCommunity.description}</p>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span>{subCommunity.memberCount} members</span>
                </div>
            </div>
        </div>
    );

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
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400">diversity_2</span>
                                <span className="font-semibold text-gray-900">{subCommunities.length}</span>
                                <span className="text-gray-500">sub-communities</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div>
                            {isMember ? (
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
                                        {community.isPrivate ? 'lock' : 'add'}
                                    </span>
                                    {community.isPrivate ? 'Request to Join' : 'Join Community'}
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
                            {isMember && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Your Role</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emerald-600">
                                                {membership?.role === 'admin' ? 'shield_person' :
                                                    membership?.role === 'moderator' ? 'verified_user' : 'person'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 capitalize">{membership?.role}</p>
                                            <p className="text-sm text-gray-500">
                                                Joined {new Date(membership?.joinedAt || '').toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Sub-Communities */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Sub-Communities</h2>
                            {!isMember && (
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    Join to access
                                </span>
                            )}
                        </div>

                        {subCommunities.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subCommunities.map(sc => (
                                    <SubCommunityCard key={sc.id} subCommunity={sc} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                                <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">diversity_2</span>
                                <h3 className="text-lg font-semibold text-gray-700 mb-1">No sub-communities yet</h3>
                                <p className="text-gray-500">This community hasn't created any sub-communities yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Request Join Modal */}
            <RequestJoinModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                community={community}
                onSubmit={(message) => {
                    console.log('Join request submitted:', message);
                    // Here you would make a Supabase call to insert into community_members
                }}
            />
        </div>
    );
};
