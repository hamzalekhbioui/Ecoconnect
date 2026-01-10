import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { User, Loader2, X, Calendar, Briefcase, UserPlus, UserCheck, Clock, Check, XIcon } from 'lucide-react';
import {
    getFriendshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    FriendshipStatus,
} from '../services/friendshipService';

// Member profile type with joined profile data
export interface CommunityMemberProfile {
    id: string;
    user_id: string;
    role: 'admin' | 'moderator' | 'member';
    status: 'pending' | 'approved';
    joined_at: string;
    profile: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        bio: string | null;
        email: string | null;
        industry: string | null;
    } | null;
}

interface CommunityMembersListProps {
    communityId: string;
    creatorId: string | null;
    isMember: boolean;
}

/**
 * Fetch all approved members AND admins of a community with their profile data.
 */
export const fetchCommunityMembers = async (communityId: string): Promise<CommunityMemberProfile[]> => {
    const { data, error } = await supabase
        .from('community_members')
        .select(`
            id,
            user_id,
            role,
            status,
            joined_at,
            profile:profiles(
                id,
                full_name,
                avatar_url,
                bio,
                email,
                industry
            )
        `)
        .eq('community_id', communityId)
        // Show approved members OR admins (admin should always show)
        .or('status.eq.approved,role.eq.admin')
        .order('role', { ascending: true }) // Admins first
        .order('joined_at', { ascending: true });

    if (error) {
        console.error('Error fetching community members:', error);
        return [];
    }

    // Transform the data - Supabase returns profile as array for foreign key joins
    return (data || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        status: member.status,
        joined_at: member.joined_at,
        // Profile is returned as array, take first element
        profile: Array.isArray(member.profile) ? member.profile[0] || null : member.profile,
    })) as CommunityMemberProfile[];
};

// Member Card Component
const MemberCard: React.FC<{
    member: CommunityMemberProfile;
    onClick: () => void;
}> = ({ member, onClick }) => {
    const profile = member.profile;
    const roleColors = {
        admin: 'bg-purple-100 text-purple-700 border-purple-200',
        moderator: 'bg-blue-100 text-blue-700 border-blue-200',
        member: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
        <button
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-emerald-200 transition-all text-left group"
        >
            {/* Avatar */}
            <div className="flex items-center gap-3 mb-3">
                {profile?.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-emerald-200 transition-all"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-emerald-200 transition-all">
                        <User className="w-6 h-6 text-white" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                        {profile?.full_name || 'Unknown User'}
                    </h3>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border capitalize ${roleColors[member.role]}`}>
                        {member.role}
                    </span>
                </div>
            </div>

            {/* Bio preview */}
            {profile?.bio && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {profile.bio}
                </p>
            )}

            {/* Industry */}
            {profile?.industry && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Briefcase className="w-3 h-3" />
                    <span className="truncate">{profile.industry}</span>
                </div>
            )}
        </button>
    );
};

// Member Profile Modal Component with Friend Request
const MemberProfileModal: React.FC<{
    member: CommunityMemberProfile | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ member, isOpen, onClose }) => {
    const { user } = useAuth();
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus | null>(null);
    const [loadingFriendship, setLoadingFriendship] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch friendship status when modal opens
    useEffect(() => {
        const loadFriendshipStatus = async () => {
            if (!member || !user || member.user_id === user.id) {
                setLoadingFriendship(false);
                return;
            }

            setLoadingFriendship(true);
            const status = await getFriendshipStatus(member.user_id);
            setFriendshipStatus(status);
            setLoadingFriendship(false);
        };

        if (isOpen && member) {
            loadFriendshipStatus();
        }
    }, [isOpen, member, user]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFriendshipStatus(null);
            setLoadingFriendship(true);
        }
    }, [isOpen]);

    const handleSendRequest = async () => {
        if (!member) return;
        setActionLoading(true);
        const result = await sendFriendRequest(member.user_id);
        if (result.success) {
            setFriendshipStatus({
                friendship_id: null,
                status: 'pending',
                is_requester: true,
                created_at: new Date().toISOString(),
            });
        }
        setActionLoading(false);
    };

    const handleAccept = async () => {
        if (!friendshipStatus?.friendship_id) return;
        setActionLoading(true);
        const success = await acceptFriendRequest(friendshipStatus.friendship_id);
        if (success) {
            setFriendshipStatus({ ...friendshipStatus, status: 'accepted' });
        }
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!friendshipStatus?.friendship_id) return;
        setActionLoading(true);
        const success = await rejectFriendRequest(friendshipStatus.friendship_id);
        if (success) {
            setFriendshipStatus({ ...friendshipStatus, status: 'rejected' });
        }
        setActionLoading(false);
    };

    const handleCancel = async () => {
        if (!friendshipStatus?.friendship_id) return;
        setActionLoading(true);
        const success = await cancelFriendRequest(friendshipStatus.friendship_id);
        if (success) {
            setFriendshipStatus(null);
        }
        setActionLoading(false);
    };

    if (!isOpen || !member) return null;

    const profile = member.profile;
    const roleColors = {
        admin: 'bg-purple-100 text-purple-700',
        moderator: 'bg-blue-100 text-blue-700',
        member: 'bg-emerald-100 text-emerald-700',
    };

    const isOwnProfile = user?.id === member.user_id;

    // Render friendship action button
    const renderFriendshipButton = () => {
        if (isOwnProfile || loadingFriendship) {
            return null;
        }

        if (actionLoading) {
            return (
                <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Processing...</span>
                </div>
            );
        }

        // No existing friendship - show Add Friend
        if (!friendshipStatus) {
            return (
                <button
                    onClick={handleSendRequest}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                </button>
            );
        }

        // Already friends
        if (friendshipStatus.status === 'accepted') {
            return (
                <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                    <span className="font-medium">Friends</span>
                </div>
            );
        }

        // Pending - I sent the request
        if (friendshipStatus.status === 'pending' && friendshipStatus.is_requester) {
            return (
                <button
                    onClick={handleCancel}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium rounded-lg transition-colors"
                >
                    <Clock className="w-4 h-4" />
                    Request Pending (Cancel)
                </button>
            );
        }

        // Pending - I received the request (direct user to Dashboard)
        if (friendshipStatus.status === 'pending' && !friendshipStatus.is_requester) {
            return (
                <div className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">Check your Dashboard for pending requests</span>
                </div>
            );
        }

        // Rejected
        if (friendshipStatus.status === 'rejected') {
            return (
                <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-500 rounded-lg">
                    <XIcon className="w-4 h-4" />
                    <span className="font-medium">Request Declined</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header with gradient */}
                <div className="h-24 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Avatar - overlapping header */}
                <div className="flex justify-center -mt-12">
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-4 border-white shadow-lg">
                            <User className="w-12 h-12 text-white" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 pt-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {profile?.full_name || 'Unknown User'}
                    </h2>
                    <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full capitalize ${roleColors[member.role]}`}>
                        {member.role}
                    </span>

                    {/* Bio */}
                    {profile?.bio ? (
                        <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                            {profile.bio}
                        </p>
                    ) : (
                        <p className="mt-4 text-gray-400 text-sm italic">
                            No bio available
                        </p>
                    )}

                    {/* Details */}
                    <div className="mt-6 space-y-3 text-left">
                        {profile?.industry && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Briefcase className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Industry</p>
                                    <p className="text-sm font-medium text-gray-700">{profile.industry}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Member since</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {new Date(member.joined_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Friendship Action Button */}
                    <div className="mt-6 space-y-2">
                        {renderFriendshipButton()}

                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Component
export const CommunityMembersList: React.FC<CommunityMembersListProps> = ({
    communityId,
    creatorId,
    isMember,
}) => {
    const [members, setMembers] = useState<CommunityMemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<CommunityMemberProfile | null>(null);

    useEffect(() => {
        const loadMembers = async () => {
            setLoading(true);

            // Fetch community members
            const membersData = await fetchCommunityMembers(communityId);

            // Check if creator is already in the members list
            const creatorInList = creatorId && membersData.some(m => m.user_id === creatorId);

            // If creator is not in members list, fetch their profile and add them
            if (creatorId && !creatorInList) {
                const { data: creatorProfile } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, bio, email, industry')
                    .eq('id', creatorId)
                    .single();

                if (creatorProfile) {
                    // Add creator as admin at the beginning of the list
                    const creatorMember: CommunityMemberProfile = {
                        id: `creator-${creatorId}`,
                        user_id: creatorId,
                        role: 'admin',
                        status: 'approved',
                        joined_at: new Date().toISOString(),
                        profile: creatorProfile,
                    };
                    membersData.unshift(creatorMember);
                }
            }

            setMembers(membersData);
            setLoading(false);
        };

        if (communityId) {
            loadMembers();
        }
    }, [communityId, creatorId]);

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-8">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    <span className="text-gray-500">Loading members...</span>
                </div>
            </div>
        );
    }

    // Empty state
    if (members.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No members yet</h3>
                <p className="text-gray-500 text-sm">Be the first to join this community!</p>
            </div>
        );
    }

    return (
        <>
            {/* Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                    <MemberCard
                        key={member.id}
                        member={member}
                        onClick={() => setSelectedMember(member)}
                    />
                ))}
            </div>

            {/* Profile Modal */}
            <MemberProfileModal
                member={selectedMember}
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
            />
        </>
    );
};
