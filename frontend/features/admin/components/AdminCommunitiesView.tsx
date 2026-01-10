import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import { Users, Building2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PendingRequest {
    id: string;
    user_id: string;
    community_id: string;
    joined_at: string;
    user: {
        full_name: string;
        email: string;
        avatar_url: string | null;
    } | null;
    community: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

interface Stats {
    totalCommunities: number;
    pendingRequests: number;
    totalMembers: number;
}

export const AdminCommunitiesView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalCommunities: 0,
        pendingRequests: 0,
        totalMembers: 0,
    });
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch data
    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch stats
            const [communitiesRes, pendingRes, membersRes] = await Promise.all([
                supabase.from('communities').select('id', { count: 'exact', head: true }),
                supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
            ]);

            setStats({
                totalCommunities: communitiesRes.count || 0,
                pendingRequests: pendingRes.count || 0,
                totalMembers: membersRes.count || 0,
            });

            // Fetch pending requests with user and community info
            const { data: requests, error } = await supabase
                .from('community_members')
                .select(`
                    id,
                    user_id,
                    community_id,
                    joined_at,
                    profiles!community_members_user_id_fkey (
                        full_name,
                        email,
                        avatar_url
                    ),
                    communities (
                        id,
                        name,
                        slug
                    )
                `)
                .eq('status', 'pending')
                .order('joined_at', { ascending: false });

            if (error) {
                console.error('Error fetching pending requests:', error);
            } else {
                // Transform the data
                const transformed = (requests || []).map((r: any) => ({
                    id: r.id,
                    user_id: r.user_id,
                    community_id: r.community_id,
                    joined_at: r.joined_at,
                    user: r.profiles ? {
                        full_name: r.profiles.full_name,
                        email: r.profiles.email,
                        avatar_url: r.profiles.avatar_url,
                    } : null,
                    community: r.communities ? {
                        id: r.communities.id,
                        name: r.communities.name,
                        slug: r.communities.slug,
                    } : null,
                }));
                setPendingRequests(transformed);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle accept request
    const handleAccept = async (request: PendingRequest) => {
        setProcessingId(request.id);
        try {
            const { error } = await supabase
                .from('community_members')
                .update({ status: 'approved' })
                .eq('id', request.id);

            if (error) {
                console.error('Error accepting request:', error);
                return;
            }

            // Optional: Send notification to user that they were accepted
            if (request.user_id && request.community) {
                await supabase.from('notifications').insert({
                    user_id: request.user_id,
                    type: 'join_approved',
                    title: 'Join Request Approved',
                    message: `Your request to join ${request.community.name} has been approved!`,
                    data: {
                        community_id: request.community.id,
                        community_name: request.community.name,
                    },
                });
            }

            // Refresh data
            fetchData();
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setProcessingId(null);
        }
    };

    // Handle reject request
    const handleReject = async (request: PendingRequest) => {
        setProcessingId(request.id);
        try {
            // Delete the membership record
            const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('id', request.id);

            if (error) {
                console.error('Error rejecting request:', error);
                return;
            }

            // Optional: Send notification to user that they were rejected
            if (request.user_id && request.community) {
                await supabase.from('notifications').insert({
                    user_id: request.user_id,
                    type: 'join_rejected',
                    title: 'Join Request Declined',
                    message: `Your request to join ${request.community.name} was not approved at this time.`,
                    data: {
                        community_id: request.community.id,
                        community_name: request.community.name,
                    },
                });
            }

            // Refresh data
            fetchData();
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Community Management</h1>
                <p className="text-slate-400 mt-1">Manage communities and approve join requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Total Communities"
                    value={stats.totalCommunities}
                    icon={<Building2 className="w-5 h-5" />}
                    color="emerald"
                />
                <StatsCard
                    title="Pending Requests"
                    value={stats.pendingRequests}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
                <StatsCard
                    title="Total Members"
                    value={stats.totalMembers}
                    icon={<Users className="w-5 h-5" />}
                    color="blue"
                />
            </div>

            {/* Pending Requests Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">Pending Join Requests</h2>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-400">No pending requests</h3>
                        <p className="text-slate-500 text-sm">All join requests have been processed</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Community
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Requested
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {pendingRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {request.user?.avatar_url ? (
                                                    <img
                                                        src={request.user.avatar_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {request.user?.full_name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {request.user?.email || ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-white font-medium">
                                                {request.community?.name || 'Unknown Community'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                            {new Date(request.joined_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAccept(request)}
                                                    disabled={processingId === request.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request)}
                                                    disabled={processingId === request.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4" />
                                                    )}
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
