import { Community, Resource, UserProfile } from "../types";

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'member',
  status: 'approved',
  bio: 'Sustainable architecture enthusiast and frontend developer.',
  skills: ['React', 'Sustainability', '3D Modeling'],
  credits: 150,
  avatarUrl: 'https://picsum.photos/seed/alex/200/200'
};

// export const MOCK_COMMUNITIES: Community[] = [
//   { id: 'c1', name: 'Regenerative Agriculture', description: 'Techniques for soil restoration.', isPrivate: false, memberCount: 1240 },
//   { id: 'c2', name: 'Circular Tech Repair', description: 'Fixing electronics to reduce waste.', isPrivate: false, memberCount: 850 },
//   { id: 'c3', name: 'Off-Grid Living', description: 'Strategies for energy independence.', isPrivate: true, memberCount: 320 },
//   { id: 'c4', name: 'Local Currency Trading', description: 'Managing community credits.', isPrivate: true, memberCount: 150 },
// ];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    title: 'Permaculture Design Course',
    description: 'A comprehensive guide to designing self-sufficient ecosystems.',
    type: 'knowledge',
    costType: 'monetary',
    price: 50,
    ownerId: 'u2',
    ownerName: 'Sarah Green',
    tags: ['agriculture', 'design', 'education'],
    image: 'https://picsum.photos/seed/perma/400/300'
  },
  {
    id: 'r2',
    title: '3D Printer Repair Service',
    description: 'I can fix most consumer FDM printers. Will trade for PLA filament.',
    type: 'service',
    costType: 'barter',
    price: null,
    ownerId: 'u3',
    ownerName: 'Tech Fixer',
    tags: ['repair', 'technology', 'hardware'],
    image: 'https://picsum.photos/seed/3dprint/400/300'
  },
  {
    id: 'r3',
    title: 'Heirloom Tomato Seeds',
    description: 'Organic seeds saved from last harvest.',
    type: 'product',
    costType: 'free',
    price: 0,
    ownerId: 'u4',
    ownerName: 'Community Garden',
    tags: ['garden', 'food'],
    image: 'https://picsum.photos/seed/tomato/400/300'
  },
  {
    id: 'r4',
    title: 'React & Node.js Mentorship',
    description: 'Senior dev looking to help juniors. 1 hour sessions.',
    type: 'service',
    costType: 'monetary',
    price: 80,
    ownerId: 'u1',
    ownerName: 'Alex Rivera',
    tags: ['coding', 'education'],
    image: 'https://picsum.photos/seed/code/400/300'
  },
  {
    id: 'r5',
    title: 'Compost Bin Construction',
    description: 'I will build a 3-tier cedar compost bin for your yard.',
    type: 'product',
    costType: 'monetary',
    price: 200,
    ownerId: 'u5',
    ownerName: 'Carpenter Joe',
    tags: ['construction', 'garden'],
    image: 'https://picsum.photos/seed/wood/400/300'
  }
];

// Symbiosis Marketplace Data - Featured Listings (static banners)
export interface FeaturedListing {
  id: string;
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonStyle: 'neon' | 'white';
  backgroundImage: string;
}

export const FEATURED_LISTINGS: FeaturedListing[] = [
  {
    id: 'f1',
    badge: 'FEATURED EVENT',
    title: 'Circular Economy Summit 2025',
    description: 'Join over 500 professionals discussing the future of regenerative materials and zero-waste cities.',
    buttonText: 'Get Tickets - 45€',
    buttonStyle: 'neon',
    backgroundImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
  },
  {
    id: 'f2',
    badge: 'MEMBER SPOTLIGHT',
    title: 'Open Source Material Library',
    description: 'A comprehensive database of biodegradable polymers available for research and prototyping.',
    buttonText: 'Access Library',
    buttonStyle: 'white',
    backgroundImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80'
  }
];