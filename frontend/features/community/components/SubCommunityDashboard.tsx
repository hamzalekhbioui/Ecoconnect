import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../config/supabase';
import { Community, SubCommunity, CommunityMember } from '../../../types';
import { Loader2 } from 'lucide-react';
import { FeedList } from './FeedList';

type TabType = 'feed' | 'directory' | 'projects' | 'resources' | 'events';

interface TabConfig {
    id: TabType;
    label: string;
    icon: string;
}

const TABS: TabConfig[] = [
    { id: 'feed', label: 'Feed', icon: 'forum' },
    { id: 'directory', label: 'Directory', icon: 'people' },
    { id: 'projects', label: 'Projects', icon: 'science' },
    { id: 'resources', label: 'Resources', icon: 'folder_open' },
    { id: 'events', label: 'Events', icon: 'event' },
];

// NOTE: MOCK_POSTS removed - now using real data via FeedList component

const MOCK_PROJECTS = [
    {
        id: 'pr1',
        name: 'Carbon Footprint Calculator',
        description: 'Building an open-source calculator for eco-lodges to measure their carbon footprint.',
        status: 'In Progress',
        members: 12,
        progress: 65,
    },
    {
        id: 'pr2',
        name: 'Certification Database',
        description: 'Compiling a comprehensive database of sustainable tourism certifications worldwide.',
        status: 'Planning',
        members: 8,
        progress: 25,
    },
    {
        id: 'pr3',
        name: 'Best Practices Guide',
        description: 'Creating a community-driven guide for sustainable accommodation management.',
        status: 'Review',
        members: 15,
        progress: 90,
    },
];

const MOCK_RESOURCES = [
    {
        id: 'rs1',
        name: 'Eco-Lodge Certification Guide.pdf',
        type: 'PDF',
        size: '2.4 MB',
        uploadedBy: 'Sarah Green',
        date: 'Dec 28, 2024',
    },
    {
        id: 'rs2',
        name: 'Sustainable Tourism Metrics Spreadsheet',
        type: 'XLSX',
        size: '156 KB',
        uploadedBy: 'Alex Rivera',
        date: 'Dec 25, 2024',
    },
    {
        id: 'rs3',
        name: 'Community Onboarding Video',
        type: 'MP4',
        size: '45 MB',
        uploadedBy: 'Jordan Lee',
        date: 'Dec 20, 2024',
    },
];

const MOCK_EVENTS = [
    {
        id: 'ev1',
        name: 'Monthly Virtual Meetup',
        description: 'Discussion: Sustainable Tourism Post-2025',
        date: 'Jan 3, 2025',
        time: '3:00 PM CET',
        attendees: 34,
        type: 'Virtual',
    },
    {
        id: 'ev2',
        name: 'Eco-Lodge Summit 2025',
        description: 'Annual gathering of sustainable accommodation providers',
        date: 'Mar 15-17, 2025',
        time: 'All Day',
        attendees: 156,
        type: 'In-Person',
    },
    {
        id: 'ev3',
        name: 'Certification Workshop',
        description: 'Learn how to get your lodge certified',
        date: 'Jan 20, 2025',
        time: '10:00 AM CET',
        attendees: 28,
        type: 'Hybrid',
    },
];

// Mock members for directory (to be replaced with real data)
const MOCK_MEMBERS = [
    {
        id: 'cm1',
        role: 'admin',
        status: 'approved',
        user: {
            fullName: 'Alex Rivera',
            avatarUrl: 'https://picsum.photos/seed/alex/200/200',
            bio: 'Sustainable architecture enthusiast',
            skills: ['Sustainability', 'Architecture', 'Community Building'],
        },
    },
    {
        id: 'cm2',
        role: 'moderator',
        status: 'approved',
        user: {
            fullName: 'Sarah Green',
            avatarUrl: 'https://picsum.photos/seed/sarah/200/200',
            bio: 'Eco-tourism consultant',
            skills: ['Tourism', 'Consulting', 'Marketing'],
        },
    },
    {
        id: 'cm3',
        role: 'member',
        status: 'approved',
        user: {
            fullName: 'Jordan Lee',
            avatarUrl: 'https://picsum.photos/seed/jordan/200/200',
            bio: 'Travel blogger and photographer',
            skills: ['Photography', 'Content Creation', 'Travel'],
        },
    },
];

export const SubCommunityDashboard: React.FC = () => {
    const { slug, subId } = useParams<{ slug: string; subId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user, profile } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('feed');
    const [skillFilter, setSkillFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [parentCommunity, setParentCommunity] = useState<Community | null>(null);
    const [subCommunity, setSubCommunity] = useState<SubCommunity | null>(null);

    // Fetch data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch parent community by slug
                const { data: communityData } = await supabase
                    .from('communities')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (communityData) {
                    setParentCommunity({
                        id: communityData.id,
                        name: communityData.name,
                        slug: communityData.slug,
                        description: communityData.description || '',
                        coverImage: communityData.cover_image,
                        isPrivate: communityData.is_private,
                        memberCount: communityData.member_count,
                        tags: communityData.tags || [],
                    });
                }

                // Sub-communities are not yet implemented in DB
                // For now, show a placeholder
                setSubCommunity({
                    id: subId || '',
                    parentCommunityId: communityData?.id || '',
                    name: 'Sub-Community',
                    description: 'This sub-community is a placeholder. Full sub-community support coming soon.',
                    memberCount: 0,
                });
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchData();
        }
    }, [slug, subId]);

    // Filter members by skill
    const members = MOCK_MEMBERS.filter(m => {
        if (!skillFilter) return m.status === 'approved';
        return m.status === 'approved' && m.user?.skills?.some(s =>
            s.toLowerCase().includes(skillFilter.toLowerCase())
        );
    });

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading sub-community...</p>
                </div>
            </div>
        );
    }

    if (!subCommunity) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Sub-community not found</h2>
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

    // Tab Content Renderers
    const renderFeed = () => (
        <FeedList
            communityId={parentCommunity?.id || ''}
            currentUserId={user?.id}
            currentUserAvatar={profile?.avatar_url || undefined}
            currentUserName={profile?.full_name}
            canPost={true}
        />
    );

    const renderDirectory = () => (
        <div>
            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Filter by skills..."
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map(member => (
                    <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <img
                                src={member.user?.avatarUrl || `https://ui-avatars.com/api/?name=${member.user?.fullName}`}
                                alt={member.user?.fullName}
                                className="w-14 h-14 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 truncate">{member.user?.fullName}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        member.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {member.role}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-1 mb-2">{member.user?.bio}</p>
                                <div className="flex flex-wrap gap-1">
                                    {member.user?.skills?.slice(0, 3).map((skill, i) => (
                                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProjects = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MOCK_PROJECTS.map(project => (
                <div key={project.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            project.status === 'Planning' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                            {project.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{project.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-700">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                            <span className="material-symbols-outlined text-[18px]">group</span>
                            {project.members} contributors
                        </div>
                        <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
                            View Details →
                        </button>
                    </div>
                </div>
            ))}

            {/* Add Project Card */}
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">add_circle</span>
                <h4 className="font-semibold text-gray-700">Start a New Project</h4>
                <p className="text-sm text-gray-500">Collaborate with community members</p>
            </div>
        </div>
    );

    const renderResources = () => (
        <div>
            {/* Upload Area */}
            <div className="bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-200 p-6 text-center mb-6 hover:bg-emerald-100/50 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">cloud_upload</span>
                <h4 className="font-semibold text-gray-700 mb-1">Upload a Resource</h4>
                <p className="text-sm text-gray-500">Drag & drop files or click to browse</p>
            </div>

            {/* Resources List */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-700">Shared Resources</h4>
                </div>
                <div className="divide-y divide-gray-100">
                    {MOCK_RESOURCES.map(resource => (
                        <div key={resource.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resource.type === 'PDF' ? 'bg-red-100' :
                                resource.type === 'XLSX' ? 'bg-green-100' :
                                    'bg-purple-100'
                                }`}>
                                <span className="material-symbols-outlined text-xl ${
                  resource.type === 'PDF' ? 'text-red-600' :
                  resource.type === 'XLSX' ? 'text-green-600' :
                  'text-purple-600'
                }">
                                    {resource.type === 'PDF' ? 'picture_as_pdf' :
                                        resource.type === 'XLSX' ? 'table_chart' : 'movie'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 truncate">{resource.name}</h5>
                                <p className="text-sm text-gray-500">
                                    {resource.size} • Uploaded by {resource.uploadedBy}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400">{resource.date}</p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-gray-400">download</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderEvents = () => (
        <div className="space-y-4">
            {MOCK_EVENTS.map(event => (
                <div key={event.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-16 h-16 bg-emerald-50 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-emerald-600">
                                {event.date.split(' ')[1]?.replace(',', '') || event.date.split('-')[0]}
                            </span>
                            <span className="text-xs text-emerald-600 uppercase">
                                {event.date.split(' ')[0]}
                            </span>
                        </div>

                        {/* Event Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{event.name}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${event.type === 'Virtual' ? 'bg-blue-100 text-blue-700' :
                                    event.type === 'In-Person' ? 'bg-orange-100 text-orange-700' :
                                        'bg-purple-100 text-purple-700'
                                    }`}>
                                    {event.type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    {event.time}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">group</span>
                                    {event.attendees} attendees
                                </span>
                            </div>
                        </div>

                        {/* RSVP Button */}
                        <button className="flex-shrink-0 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">
                            RSVP
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'feed': return renderFeed();
            case 'directory': return renderDirectory();
            case 'projects': return renderProjects();
            case 'resources': return renderResources();
            case 'events': return renderEvents();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb & Back */}
                    <div className="py-4 flex items-center gap-2 text-sm">
                        <button
                            onClick={() => navigate(`/communities/${slug}`)}
                            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            {parentCommunity?.name}
                        </button>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 font-medium">{subCommunity.name}</span>
                    </div>

                    {/* Sub-Community Info */}
                    <div className="pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            {subCommunity.focusArea && (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                                    {subCommunity.focusArea}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{subCommunity.name}</h1>
                        <p className="text-gray-500">{subCommunity.description}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-px -mb-px">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {renderTabContent()}
            </div>
        </div>
    );
};
