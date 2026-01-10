export type UserRole = 'admin' | 'member' | 'visitor';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  bio: string;
  skills: string[];
  credits: number;
  avatarUrl: string;
}

export type ResourceType = 'service' | 'product' | 'knowledge';
export type CostType = 'monetary' | 'free' | 'barter';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  costType: CostType;
  price: number | null;
  ownerId: string;
  ownerName: string;
  tags: string[];
  image?: string;
}

// =============================================================================
// Community Types
// =============================================================================

export type CommunityRole = 'admin' | 'moderator' | 'member';
export type MembershipStatus = 'pending' | 'approved';

// Tag categories for smart filtering
export type CommunityTagCategory = 'theme' | 'sector' | 'project_type' | 'territory';

export interface CommunityTag {
  category: CommunityTagCategory;
  value: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  mission?: string;
  coverImage?: string;
  isPrivate: boolean;
  memberCount: number;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCommunity {
  id: string;
  parentCommunityId: string;
  name: string;
  description: string;
  focusArea?: string;
  coverImage?: string;
  memberCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: CommunityRole;
  status: MembershipStatus;
  joinedAt: string;
  // Joined from profiles table
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    bio?: string;
    skills?: string[];
  };
}

export interface SubCommunityMember {
  id: string;
  userId: string;
  subCommunityId: string;
  role: CommunityRole;
  joinedAt: string;
  // Joined from profiles table
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    bio?: string;
    skills?: string[];
  };
}

// Filter options for community discovery
export interface CommunityFilters {
  search?: string;
  theme?: string[];
  sector?: string[];
  projectType?: string[];
  territory?: string[];
  isPrivate?: boolean;
}

// =============================================================================
// Community Event Types
// =============================================================================

export type EventLocationType = 'remote' | 'in_person';

export interface CommunityEvent {
  id: string;
  communityId: string;
  createdBy: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  locationType: EventLocationType;
  meetingLink?: string;
  address?: string;
  coverImage?: string;
  maxAttendees?: number;
  createdAt: string;
  updatedAt: string;
  // Joined data
  community?: {
    id: string;
    name: string;
    slug: string;
    coverImage?: string;
  };
}

// Raw database row type (before transformation)
export interface CommunityEventRow {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location_type: EventLocationType;
  meeting_link?: string;
  address?: string;
  cover_image?: string;
  max_attendees?: number;
  created_at: string;
  updated_at: string;
  communities?: {
    id: string;
    name: string;
    slug: string;
    cover_image?: string;
  };
}

// =============================================================================
// Message Types
// =============================================================================

export interface Message {
  id: string;
  senderId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  recommendedResources?: Resource[];
}

// =============================================================================
// Community Post Types
// =============================================================================

export type PostMediaType = 'image';

export interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: PostMediaType;
  authorId: string;
  communityId: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  // Joined from profiles table
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  // Whether the current user has liked this post
  isLiked?: boolean;
}

// Raw database row type (before transformation)
export interface PostRow {
  id: string;
  content: string;
  media_url?: string;
  media_type?: PostMediaType;
  author_id: string;
  community_id: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  // Joined from profiles table
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface PostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}