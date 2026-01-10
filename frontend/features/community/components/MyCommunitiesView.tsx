import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../config/supabase';
import { Community } from '../../../types';
import { Loader2 } from 'lucide-react';

export const MyCommunitiesView: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [pendingCommunities, setPendingCommunities] = useState<Community[]>([]);

    // Fetch user's communities from Supabase
    useEffect(() => {
        const fetchMyCommunities = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch approved memberships
                const { data: approvedMemberships, error: approvedError } = await supabase
                    .from('community_members')
                    .select(`
                        community_id,
                        communities (
                            id,
                            name,
                            slug,
                            description,
                            cover_image,
                            is_private,
                            member_count,
                            tags
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'approved');

                if (approvedError) {
                    console.error('Error fetching approved communities:', approvedError);
                } else {
                    const approved = (approvedMemberships || [])
                        .filter((m: any) => m.communities)
                        .map((m: any) => ({
                            id: m.communities.id,
                            name: m.communities.name,
                            slug: m.communities.slug,
                            description: m.communities.description || '',
                            coverImage: m.communities.cover_image,
                            isPrivate: m.communities.is_private,
                            memberCount: m.communities.member_count,
                            tags: m.communities.tags || [],
                        }));
                    setMyCommunities(approved);
                }

                // Fetch pending memberships
                const { data: pendingMemberships, error: pendingError } = await supabase
                    .from('community_members')
                    .select(`
                        community_id,
                        communities (
                            id,
                            name,
                            slug,
                            description,
                            cover_image,
                            is_private,
                            member_count,
                            tags
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'pending');

                if (pendingError) {
                    console.error('Error fetching pending communities:', pendingError);
                } else {
                    const pending = (pendingMemberships || [])
                        .filter((m: any) => m.communities)
                        .map((m: any) => ({
                            id: m.communities.id,
                            name: m.communities.name,
                            slug: m.communities.slug,
                            description: m.communities.description || '',
                            coverImage: m.communities.cover_image,
                            isPrivate: m.communities.is_private,
                            memberCount: m.communities.member_count,
                            tags: m.communities.tags || [],
                        }));
                    setPendingCommunities(pending);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCommunities();
    }, [user?.id]);

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading your communities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Communities</h1>
                    <p className="text-gray-500">Manage your community memberships and stay connected.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* My Communities */}
                {myCommunities.length > 0 ? (
                    <div className="mb-12">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">groups</span>
                            Active Memberships
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myCommunities.map(community => (
                                <div
                                    key={community.id}
                                    onClick={() => navigate(`/communities/${community.slug}`)}
                                    className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                                >
                                    <div className="h-32 relative">
                                        {community.coverImage ? (
                                            <img
                                                src={community.coverImage}
                                                alt={community.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">{community.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{community.description}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">{community.memberCount} members</span>
                                            <span className="text-xs font-medium text-emerald-600 group-hover:underline">
                                                Enter →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center mb-12">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">diversity_3</span>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No memberships yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            You haven't joined any communities yet. Explore and find communities that match your interests.
                        </p>
                        <button
                            onClick={() => navigate('/communities')}
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Discover Communities
                        </button>
                    </div>
                )}

                {/* Pending Requests */}
                {pendingCommunities.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">hourglass_top</span>
                            Pending Requests
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingCommunities.map(community => (
                                <div
                                    key={community.id}
                                    className="bg-white rounded-xl border border-gray-100 overflow-hidden opacity-75"
                                >
                                    <div className="h-24 relative">
                                        {community.coverImage ? (
                                            <img
                                                src={community.coverImage}
                                                alt={community.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
                                        )}
                                        <div className="absolute inset-0 bg-gray-900/30" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">{community.name}</h3>
                                        <div className="flex items-center gap-1.5 text-amber-600 text-sm">
                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                            Awaiting approval
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
