import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../config/supabase';
import { X, Save, Loader2, Crown, User, Upload, Plus, Package, MoreVertical, Eye, Pencil, Trash2, Calendar, UserPlus, Check, XIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UpcomingEventsWidget } from './UpcomingEventsWidget';
import { CreateEventModal } from '../../community/components/CreateEventModal';
import { createEvent, CreateEventInput } from '../../community/services/eventService';
import {
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  Friendship,
} from '../../community/services/friendshipService';

// Mock data for the dashboard
const STATS = [
  { value: '12', label: 'Exchanges this month', highlight: true },
  { value: '5', label: 'Pending requests', highlight: true },
  { value: '85%', label: 'Profile completion', highlight: false }
];

const RECOMMENDED = [
  { id: 'r1', type: 'Event', typeColor: 'bg-[#13ec5b] text-gray-900', title: 'Regenerative Business', subtitle: 'Workshop • Tomorrow' },
  { id: 'r2', type: 'Contact', typeColor: 'bg-white border border-gray-200 text-gray-600', title: 'Maria Gonzales', subtitle: 'Sustainable Textile Expert' },
  { id: 'r3', type: 'Resource', typeColor: 'bg-[#13ec5b] text-gray-900', title: 'Circular Toolkit v2', subtitle: 'PDF • Free Download' }
];

const NEWS_POSTS = [
  {
    id: 'n1',
    author: 'Sarah Jenning',
    role: 'shared a project in Eco-Designers',
    time: '2h ago',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    content: "Just finished our first prototype for the biodegradable packaging initiative! We used mycelium composites grown locally. Looking for feedback on water resistance coatings if anyone has experience?",
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
    likes: 24,
    comments: 8
  },
  {
    id: 'n2',
    author: 'Symbiosis Team',
    role: 'Announcement',
    time: '5h ago',
    avatar: '',
    content: 'We are excited to launch the new "Skills Swap" feature in the Marketplace! Now you can officially trade hours of expertise without any currency exchange. Check your Finance & Exchange tab to set up your wallet.',
    image: null,
    likes: 156,
    comments: 12
  }
];

// EVENTS removed - replaced with dynamic UpcomingEventsWidget

// RESOURCES removed - replaced with dynamic My Marketplace Listings

interface UserListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number | null;
  image_url: string | null;
  created_at: string;
}

// Removed COMMUNITIES mock - now fetched from Supabase

interface UserCommunity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  created_by: string | null;
}

// Membership request interface for pending approvals
interface MembershipRequest {
  id: string;
  user_id: string;
  community_id: string;
  status: string;
  joined_at: string;
  user_name: string;
  user_avatar: string | null;
  community_name: string;
}

// Role Badge Component
const RoleBadge: React.FC<{ role: 'member' | 'visitor' | 'admin' }> = ({ role }) => {
  if (role === 'member') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 rounded-full text-xs font-semibold shadow-sm">
        <Crown className="w-3 h-3" />
        Member
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs font-semibold shadow-sm">
        <Crown className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
      <User className="w-3 h-3" />
      Visitor
    </span>
  );
};

// Edit Profile Modal Component with File Upload
interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
  onSave: (data: { full_name: string; avatar_url: string; bio: string }) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          throw new Error('Storage bucket "avatars" not found. Please create it in Supabase.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setAvatarPreview(publicUrl);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload image');
      setAvatarPreview(profile.avatar_url || '');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ full_name: fullName, avatar_url: avatarUrl, bio });
      onClose();
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Your full name"
            />
          </div>

          {/* Avatar Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={() => setAvatarPreview('')}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {fullName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                        <span className="text-sm text-gray-600 font-medium">Click to upload</span>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const { profile, refreshProfile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [myListings, setMyListings] = useState<UserListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // CRUD states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewListing, setPreviewListing] = useState<UserListing | null>(null);
  const [editListing, setEditListing] = useState<UserListing | null>(null);
  const [deleteListing, setDeleteListing] = useState<UserListing | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Communities state
  const [joinedCommunities, setJoinedCommunities] = useState<UserCommunity[]>([]);
  const [createdCommunities, setCreatedCommunities] = useState<UserCommunity[]>([]);

  // Community CRUD states
  const [openCommunityMenuId, setOpenCommunityMenuId] = useState<string | null>(null);
  const [editCommunity, setEditCommunity] = useState<UserCommunity | null>(null);
  const [deleteCommunity, setDeleteCommunity] = useState<UserCommunity | null>(null);
  const [communityEditForm, setCommunityEditForm] = useState({ name: '', description: '', cover_image: '' });
  const [savingCommunity, setSavingCommunity] = useState(false);
  const [deletingCommunity, setDeletingCommunity] = useState(false);
  const communityMenuRef = useRef<HTMLDivElement>(null);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  // Create Event state
  const [createEventForCommunity, setCreateEventForCommunity] = useState<UserCommunity | null>(null);

  // Membership requests state (for community owners)
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Friend requests state
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [friendRequestsLoading, setFriendRequestsLoading] = useState(true);
  const [processingFriendRequestId, setProcessingFriendRequestId] = useState<string | null>(null);

  // Fetch user's marketplace listings
  useEffect(() => {
    const fetchMyListings = async () => {
      if (!user) {
        setListingsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('id, title, description, category, price, image_url, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setMyListings(data || []);
      } catch (err) {
        console.error('Error fetching listings:', err);
      } finally {
        setListingsLoading(false);
      }
    };

    fetchMyListings();
  }, [user]);

  // Fetch user's communities (joined and created)
  const fetchCommunities = useCallback(async () => {
    if (!user) {
      setCommunitiesLoading(false);
      return;
    }
    setCommunitiesLoading(true);
    try {
      // 1) Fetch communities where user is a member with APPROVED status
      const { data: approvedMemberships, error: membershipsError } = await supabase
        .from('community_members')
        .select(`
          community_id,
          status,
          communities (
            id, name, slug, description, cover_image, created_by
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved'); // Only fetch approved memberships

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError);
      }

      // 2) Also fetch communities the user created directly
      //    (creator might not be in community_members table)
      const { data: ownedCommunities, error: ownedError } = await supabase
        .from('communities')
        .select('id, name, slug, description, cover_image, created_by')
        .eq('created_by', user.id);

      if (ownedError) {
        console.error('Error fetching owned communities:', ownedError);
      }

      // Process approved memberships
      const memberCommunities = (approvedMemberships || [])
        .filter((m: any) => m.communities) // Ensure communities data exists
        .map((m: any) => ({
          id: m.communities.id,
          name: m.communities.name,
          slug: m.communities.slug,
          description: m.communities.description,
          cover_image: m.communities.cover_image,
          created_by: m.communities.created_by,
        }));

      // Process owned communities
      const createdFromOwned = (ownedCommunities || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        cover_image: c.cover_image,
        created_by: c.created_by,
      }));

      // Merge and deduplicate (using Map for unique IDs)
      const allCommunitiesMap = new Map<string, UserCommunity>();
      [...memberCommunities, ...createdFromOwned].forEach(c => {
        allCommunitiesMap.set(c.id, c);
      });
      const allCommunities = Array.from(allCommunitiesMap.values());

      // Split into joined (not creator) and created (is creator)
      setJoinedCommunities(allCommunities.filter(c => c.created_by !== user.id));
      setCreatedCommunities(allCommunities.filter(c => c.created_by === user.id));
    } catch (err) {
      console.error('Error fetching communities:', err);
    } finally {
      setCommunitiesLoading(false);
    }
  }, [user]);

  // Auto-refresh communities when navigating back to dashboard
  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities, location.pathname]);

  // Fetch pending membership requests for communities the user created
  const fetchMembershipRequests = useCallback(async () => {
    if (!user) {
      setRequestsLoading(false);
      setMembershipRequests([]);
      return;
    }

    setRequestsLoading(true);
    try {
      // Step 1: Get the IDs of communities this user created
      const { data: ownedCommunities, error: ownedError } = await supabase
        .from('communities')
        .select('id, name')
        .eq('created_by', user.id);

      if (ownedError) {
        console.error('Error fetching owned communities:', ownedError);
        throw ownedError;
      }

      console.log('Owned communities for user', user.id, ':', ownedCommunities);

      if (!ownedCommunities || ownedCommunities.length === 0) {
        console.log('No owned communities - skipping membership request fetch');
        setMembershipRequests([]);
        setRequestsLoading(false);
        return;
      }

      const communityIds = ownedCommunities.map(c => c.id);
      const communityNameMap = new Map(ownedCommunities.map(c => [c.id, c.name]));

      console.log('Fetching pending members for community IDs:', communityIds);

      // Step 2: Fetch pending membership requests for those communities
      const { data: pendingMembers, error: membersError } = await supabase
        .from('community_members')
        .select('id, user_id, community_id, status, joined_at')
        .in('community_id', communityIds)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error fetching pending members:', membersError);
        throw membersError;
      }

      console.log('Pending members found:', pendingMembers);

      if (!pendingMembers || pendingMembers.length === 0) {
        setMembershipRequests([]);
        setRequestsLoading(false);
        return;
      }

      // Step 3: Fetch profile info for those users
      const userIds = pendingMembers.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Step 4: Build the final requests array
      const requests: MembershipRequest[] = pendingMembers.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        community_id: m.community_id,
        status: m.status,
        joined_at: m.joined_at,
        user_name: profileMap.get(m.user_id)?.full_name || 'Unknown User',
        user_avatar: profileMap.get(m.user_id)?.avatar_url || null,
        community_name: communityNameMap.get(m.community_id) || 'Unknown Community',
      }));

      console.log('Final membership requests:', requests);
      setMembershipRequests(requests);
    } catch (err) {
      console.error('Error fetching membership requests:', err);
      setMembershipRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [user]);

  // Fetch membership requests when user is loaded (independent of communities fetch)
  useEffect(() => {
    fetchMembershipRequests();
  }, [fetchMembershipRequests]);

  // Handle approve membership request
  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      // Remove from local state
      setMembershipRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error approving membership:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle reject membership request
  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Remove from local state
      setMembershipRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error rejecting membership:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    if (!user) {
      setFriendRequestsLoading(false);
      return;
    }
    setFriendRequestsLoading(true);
    try {
      const requests = await getPendingRequests();
      setFriendRequests(requests);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    } finally {
      setFriendRequestsLoading(false);
    }
  }, [user]);

  // Fetch friend requests on mount
  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  // Handle accept friend request
  const handleAcceptFriendRequest = async (friendshipId: string) => {
    setProcessingFriendRequestId(friendshipId);
    try {
      const success = await acceptFriendRequest(friendshipId);
      if (success) {
        setFriendRequests(prev => prev.filter(r => r.id !== friendshipId));
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    } finally {
      setProcessingFriendRequestId(null);
    }
  };

  // Handle reject friend request
  const handleRejectFriendRequest = async (friendshipId: string) => {
    setProcessingFriendRequestId(friendshipId);
    try {
      const success = await rejectFriendRequest(friendshipId);
      if (success) {
        setFriendRequests(prev => prev.filter(r => r.id !== friendshipId));
      }
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    } finally {
      setProcessingFriendRequestId(null);
    }
  };

  // Refresh listings function
  const refreshListings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, description, category, price, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      setMyListings(data || []);
    } catch (err) {
      console.error('Error refreshing listings:', err);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle edit listing
  const handleEditClick = (listing: UserListing) => {
    setEditForm({
      title: listing.title,
      description: listing.description || '',
      price: listing.price?.toString() || '',
      category: listing.category
    });
    setEditListing(listing);
    setOpenMenuId(null);
  };

  const handleEditSave = async () => {
    if (!editListing) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({
          title: editForm.title,
          description: editForm.description,
          price: editForm.price ? parseFloat(editForm.price) : null,
          category: editForm.category
        })
        .eq('id', editListing.id);

      if (error) throw error;
      await refreshListings();
      setEditListing(null);
    } catch (err) {
      console.error('Error updating listing:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete listing
  const handleDeleteClick = (listing: UserListing) => {
    setDeleteListing(listing);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteListing) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', deleteListing.id);

      if (error) throw error;
      setMyListings(prev => prev.filter(l => l.id !== deleteListing.id));
      setDeleteListing(null);
    } catch (err) {
      console.error('Error deleting listing:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Close community menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (communityMenuRef.current && !communityMenuRef.current.contains(event.target as Node)) {
        setOpenCommunityMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle edit community
  const handleEditCommunityClick = (community: UserCommunity) => {
    setCommunityEditForm({
      name: community.name,
      description: community.description || '',
      cover_image: community.cover_image || ''
    });
    setEditCommunity(community);
    setOpenCommunityMenuId(null);
  };

  const handleCommunitySave = async () => {
    if (!editCommunity) return;
    setSavingCommunity(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: communityEditForm.name,
          description: communityEditForm.description || null,
          cover_image: communityEditForm.cover_image || null
        })
        .eq('id', editCommunity.id);

      if (error) throw error;
      await fetchCommunities();
      setEditCommunity(null);
    } catch (err) {
      console.error('Error updating community:', err);
    } finally {
      setSavingCommunity(false);
    }
  };

  // Handle delete community
  const handleDeleteCommunityClick = (community: UserCommunity) => {
    setDeleteCommunity(community);
    setOpenCommunityMenuId(null);
  };

  const handleDeleteCommunityConfirm = async () => {
    if (!deleteCommunity) return;
    setDeletingCommunity(true);
    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', deleteCommunity.id);

      if (error) throw error;
      setCreatedCommunities(prev => prev.filter(c => c.id !== deleteCommunity.id));
      setDeleteCommunity(null);
    } catch (err) {
      console.error('Error deleting community:', err);
    } finally {
      setDeletingCommunity(false);
    }
  };
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  // Handle profile update
  const handleProfileUpdate = async (data: { full_name: string; avatar_url: string; bio: string }) => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        avatar_url: data.avatar_url || null,
        bio: data.bio || null
      })
      .eq('id', profile.id);

    if (error) throw error;

    // Refresh the profile in context
    await refreshProfile();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-3">
            {/* Profile Card - DYNAMIC */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white shadow-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  {profile?.role === 'member' && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                      <Crown className="w-3.5 h-3.5 text-amber-900" />
                    </div>
                  )}
                </div>

                {/* Name & Role Badge */}
                <h3 className="font-bold text-gray-900">{profile?.full_name || 'Loading...'}</h3>
                <div className="mt-1 mb-1">
                  <RoleBadge role={profile?.role || 'visitor'} />
                </div>

                {/* Email (read-only) */}
                {profile?.email && (
                  <p className="text-xs text-gray-400 mb-2">{profile.email}</p>
                )}

                {/* Bio */}
                {profile?.bio && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{profile.bio}</p>
                )}
                {!profile?.bio && (
                  <p className="text-sm text-gray-400 italic mb-4">No bio yet</p>
                )}

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Joined Communities */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Joined Communities
              </h4>
              {communitiesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : joinedCommunities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No communities joined yet</p>
              ) : (
                <div className="space-y-2">
                  {joinedCommunities.map(community => (
                    <div
                      key={community.id}
                      onClick={() => navigate(`/communities/${community.slug}`)}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
                        {community.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{community.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/communities')}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Join new community
              </button>
            </div>

            {/* Created Communities */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Created Communities
              </h4>
              {communitiesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : createdCommunities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">You haven't created any communities</p>
              ) : (
                <div className="space-y-1">
                  {createdCommunities.map(community => (
                    <div
                      key={community.id}
                      className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors relative"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0"
                        onClick={() => navigate(`/communities/${community.slug}`)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold flex-shrink-0">
                          {community.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">{community.name}</span>
                        <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      </div>

                      {/* Kebab Menu */}
                      <div className="relative" ref={openCommunityMenuId === community.id ? communityMenuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCommunityMenuId(openCommunityMenuId === community.id ? null : community.id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {openCommunityMenuId === community.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreateEventForCommunity(community);
                                setOpenCommunityMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Create Event
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCommunityClick(community);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit Community
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCommunityClick(community);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Community
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Membership Requests (for community owners) */}
            {createdCommunities.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 mt-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  Membership Requests
                  {membershipRequests.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      {membershipRequests.length}
                    </span>
                  )}
                </h4>
                {requestsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : membershipRequests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No pending requests</p>
                ) : (
                  <div className="space-y-3">
                    {membershipRequests.map(request => (
                      <div
                        key={request.id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {request.user_avatar ? (
                            <img
                              src={request.user_avatar}
                              alt={request.user_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {request.user_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.user_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              wants to join {request.community_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={processingRequestId === request.id}
                            className="flex-1 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {processingRequestId === request.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={processingRequestId === request.id}
                            className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                          >
                            {processingRequestId === request.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            )}
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Friend Requests */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Friend Requests
                {friendRequests.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {friendRequests.length}
                  </span>
                )}
              </h4>
              {friendRequestsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : friendRequests.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">No pending friend requests</p>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map(request => (
                    <div
                      key={request.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {request.requester?.avatar_url ? (
                          <img
                            src={request.requester.avatar_url}
                            alt={request.requester.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {request.requester?.full_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.requester?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            wants to be your friend
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request.id)}
                          disabled={processingFriendRequestId === request.id}
                          className="flex-1 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {processingFriendRequestId === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectFriendRequest(request.id)}
                          disabled={processingFriendRequestId === request.id}
                          className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {processingFriendRequestId === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XIcon className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            {/* Greeting - DYNAMIC */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Good Morning, {firstName}</h1>
              <p className="text-sm text-gray-500">Here is what's happening in your ecosystem today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {STATS.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className={`text-2xl font-bold ${stat.highlight ? 'text-[#13ec5b]' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recommended for you */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recommended for you</h3>
                <button className="text-sm text-[#13ec5b] hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {RECOMMENDED.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-2 ${item.typeColor}`}>
                      {item.type}
                    </span>
                    <h4 className="font-semibold text-sm text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Community News */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Community News</h3>
              <div className="space-y-4">
                {NEWS_POSTS.map(post => (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {post.avatar ? (
                        <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">S</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
                        <p className="text-xs text-gray-500">{post.role} • {post.time}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                    {post.image && (
                      <div className="rounded-lg overflow-hidden mb-3">
                        <img src={post.image} alt="Post" className="w-full h-48 object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{post.likes} Likes</span>
                      <span>{post.comments} Comments</span>
                      <span className="ml-auto">Share</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upcoming Events - Dynamic from Communities */}
            <UpcomingEventsWidget userId={user?.id} />

            {/* My Marketplace Listings */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">My Marketplace Listings</h4>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Create new listing"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {listingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No active listings</p>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {myListings.map(listing => (
                    <div
                      key={listing.id}
                      className="group flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors relative"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{listing.title}</p>
                        <p className="text-xs text-gray-500">
                          {listing.category} • {listing.price ? `€${listing.price}` : 'Free'}
                        </p>
                      </div>

                      {/* Kebab Menu */}
                      <div className="relative" ref={openMenuId === listing.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                          }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {openMenuId === listing.id && (
                          <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewListing(listing);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(listing);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(listing);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={{
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio
          }}
          onSave={handleProfileUpdate}
        />
      )}

      {/* Preview Listing Modal */}
      {previewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {previewListing.image_url && (
              <div className="w-full h-48 bg-gray-100">
                <img src={previewListing.image_url} alt={previewListing.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">{previewListing.category}</span>
                <span className="font-semibold text-emerald-600">
                  {previewListing.price ? `€${previewListing.price}` : 'Free'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{previewListing.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{previewListing.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(previewListing.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="border-t border-gray-100 p-4">
              <button
                onClick={() => setPreviewListing(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Listing</h3>
              <button onClick={() => setEditListing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="SKILL">Skill</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="SERVICE">Service</option>
                    <option value="CONTACT">Contact</option>
                    <option value="PROJECT">Project</option>
                    <option value="TOOL">Tool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    placeholder="Free"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setEditListing(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Listing?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "<span className="font-medium">{deleteListing.title}</span>"? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteListing(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {editCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Community</h3>
              <button
                onClick={() => setEditCommunity(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
                <input
                  type="text"
                  value={communityEditForm.name}
                  onChange={(e) => setCommunityEditForm({ ...communityEditForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter community name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={communityEditForm.description}
                  onChange={(e) => setCommunityEditForm({ ...communityEditForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Describe your community..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={communityEditForm.cover_image}
                  onChange={(e) => setCommunityEditForm({ ...communityEditForm, cover_image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setEditCommunity(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCommunitySave}
                disabled={savingCommunity || !communityEditForm.name.trim()}
                className="flex-1 py-2.5 bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingCommunity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingCommunity ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Community Confirmation Modal */}
      {deleteCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Community?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "<span className="font-medium">{deleteCommunity.name}</span>"? This action cannot be undone. All members will be removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCommunity(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunityConfirm}
                disabled={deletingCommunity}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deletingCommunity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletingCommunity ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {createEventForCommunity && user && (
        <CreateEventModal
          isOpen={true}
          onClose={() => setCreateEventForCommunity(null)}
          onSubmit={async (input: CreateEventInput) => {
            await createEvent(input, user.id);
            setCreateEventForCommunity(null);
          }}
          communityId={createEventForCommunity.id}
        />
      )}
    </div>
  );
};