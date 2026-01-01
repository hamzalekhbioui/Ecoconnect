import { Community, SubCommunity, CommunityMember } from '../../../types';

// =============================================================================
// Mock Communities Data
// =============================================================================

export const MOCK_COMMUNITIES: Community[] = [
    {
        id: 'c1',
        name: 'Sustainable Tourism',
        slug: 'sustainable-tourism',
        description: 'A community dedicated to promoting eco-friendly tourism practices and sustainable travel experiences.',
        mission: 'To transform the tourism industry by promoting responsible travel that conserves the environment, sustains the well-being of local people, and generates fair economic benefits.',
        coverImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
        isPrivate: false,
        memberCount: 2450,
        tags: ['Tourism', 'Sustainability', 'Travel', 'Eco-friendly'],
    },
    {
        id: 'c2',
        name: 'Regenerative Agriculture',
        slug: 'regenerative-agriculture',
        description: 'Techniques for soil restoration and sustainable farming practices that restore biodiversity.',
        mission: 'To heal the planet through regenerative farming practices that restore soil health, increase biodiversity, and sequester carbon.',
        coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80',
        isPrivate: false,
        memberCount: 1840,
        tags: ['Agriculture', 'Farming', 'Soil Health', 'Food'],
    },
    {
        id: 'c3',
        name: 'Circular Tech',
        slug: 'circular-tech',
        description: 'Reducing electronic waste through repair, refurbishment, and recycling of technology.',
        mission: 'To extend the lifecycle of technology through repair culture, open-source hardware, and responsible recycling.',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
        isPrivate: false,
        memberCount: 1250,
        tags: ['Technology', 'Repair', 'E-Waste', 'Circular Economy'],
    },
    {
        id: 'c4',
        name: 'Off-Grid Living',
        slug: 'off-grid-living',
        description: 'Strategies for energy independence and self-sufficient living.',
        mission: 'To empower individuals and communities to achieve energy independence through renewable technologies and sustainable practices.',
        coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80',
        isPrivate: true,
        memberCount: 520,
        tags: ['Energy', 'Self-Sufficiency', 'Solar', 'Homesteading'],
    },
    {
        id: 'c5',
        name: 'Local Currency Networks',
        slug: 'local-currency-networks',
        description: 'Building community credits and alternative economic systems.',
        mission: 'To strengthen local economies through community currencies that keep wealth circulating within communities.',
        coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
        isPrivate: true,
        memberCount: 340,
        tags: ['Finance', 'Community', 'Economics', 'Local'],
    },
    {
        id: 'c6',
        name: 'Urban Gardening',
        slug: 'urban-gardening',
        description: 'Growing food in cities through rooftop gardens, vertical farms, and community plots.',
        mission: 'To bring food production back into urban spaces, creating green oases that feed communities and support biodiversity.',
        coverImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
        isPrivate: false,
        memberCount: 1680,
        tags: ['Gardening', 'Urban', 'Food', 'Community'],
    },
];

// =============================================================================
// Mock Sub-Communities Data
// =============================================================================

export const MOCK_SUB_COMMUNITIES: SubCommunity[] = [
    // Sustainable Tourism Sub-Communities
    {
        id: 'sc1',
        parentCommunityId: 'c1',
        name: 'Eco-Lodges',
        description: 'A collective of eco-lodge owners and enthusiasts sharing best practices for sustainable accommodations.',
        focusArea: 'Accommodation',
        coverImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
        memberCount: 450,
    },
    {
        id: 'sc2',
        parentCommunityId: 'c1',
        name: 'Slow Travel',
        description: 'Promoting mindful travel experiences that connect deeply with local cultures and environments.',
        focusArea: 'Travel Philosophy',
        coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
        memberCount: 680,
    },
    {
        id: 'sc3',
        parentCommunityId: 'c1',
        name: 'Carbon-Neutral Transport',
        description: 'Innovating sustainable transportation solutions for the tourism industry.',
        focusArea: 'Transportation',
        coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
        memberCount: 320,
    },
    // Regenerative Agriculture Sub-Communities
    {
        id: 'sc4',
        parentCommunityId: 'c2',
        name: 'Permaculture Design',
        description: 'Designing self-sustaining agricultural systems using permaculture principles.',
        focusArea: 'Design Systems',
        coverImage: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
        memberCount: 520,
    },
    {
        id: 'sc5',
        parentCommunityId: 'c2',
        name: 'Seed Savers',
        description: 'Preserving heirloom varieties and maintaining seed sovereignty.',
        focusArea: 'Biodiversity',
        coverImage: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&q=80',
        memberCount: 380,
    },
    // Circular Tech Sub-Communities
    {
        id: 'sc6',
        parentCommunityId: 'c3',
        name: 'Right to Repair',
        description: 'Advocating for repair-friendly legislation and sharing DIY repair guides.',
        focusArea: 'Advocacy',
        coverImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
        memberCount: 420,
    },
    {
        id: 'sc7',
        parentCommunityId: 'c3',
        name: 'Open Hardware',
        description: 'Developing and sharing open-source hardware designs for sustainable tech.',
        focusArea: 'Innovation',
        coverImage: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&q=80',
        memberCount: 280,
    },
];

// =============================================================================
// Mock Community Members Data
// =============================================================================

export const MOCK_COMMUNITY_MEMBERS: CommunityMember[] = [
    {
        id: 'cm1',
        userId: 'u1',
        communityId: 'c1',
        role: 'admin',
        status: 'approved',
        joinedAt: '2024-01-15T10:00:00Z',
        user: {
            id: 'u1',
            fullName: 'Alex Rivera',
            avatarUrl: 'https://picsum.photos/seed/alex/200/200',
            bio: 'Sustainable architecture enthusiast',
            skills: ['Sustainability', 'Architecture', 'Community Building'],
        },
    },
    {
        id: 'cm2',
        userId: 'u2',
        communityId: 'c1',
        role: 'moderator',
        status: 'approved',
        joinedAt: '2024-02-20T14:30:00Z',
        user: {
            id: 'u2',
            fullName: 'Sarah Green',
            avatarUrl: 'https://picsum.photos/seed/sarah/200/200',
            bio: 'Eco-tourism consultant',
            skills: ['Tourism', 'Consulting', 'Marketing'],
        },
    },
    {
        id: 'cm3',
        userId: 'u3',
        communityId: 'c1',
        role: 'member',
        status: 'approved',
        joinedAt: '2024-03-10T09:15:00Z',
        user: {
            id: 'u3',
            fullName: 'Jordan Lee',
            avatarUrl: 'https://picsum.photos/seed/jordan/200/200',
            bio: 'Travel blogger and photographer',
            skills: ['Photography', 'Content Creation', 'Travel'],
        },
    },
    {
        id: 'cm4',
        userId: 'u4',
        communityId: 'c1',
        role: 'member',
        status: 'pending',
        joinedAt: '2024-06-01T16:45:00Z',
        user: {
            id: 'u4',
            fullName: 'Morgan Chen',
            avatarUrl: 'https://picsum.photos/seed/morgan/200/200',
            bio: 'Hotel sustainability manager',
            skills: ['Hospitality', 'Sustainability', 'Management'],
        },
    },
];

// =============================================================================
// Filter Options (for sidebar dropdowns)
// =============================================================================

export const FILTER_OPTIONS = {
    theme: [
        'Sustainability',
        'Innovation',
        'Community',
        'Education',
        'Technology',
    ],
    sector: [
        'Tourism',
        'Agriculture',
        'Technology',
        'Energy',
        'Finance',
        'Food',
    ],
    projectType: [
        'Research',
        'Implementation',
        'Advocacy',
        'Education',
        'Networking',
    ],
    territory: [
        'Global',
        'Europe',
        'North America',
        'Asia Pacific',
        'Africa',
        'Latin America',
    ],
};
