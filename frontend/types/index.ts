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