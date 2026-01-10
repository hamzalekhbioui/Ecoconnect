import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityCard } from './CommunityCard';
import { CreateCommunityModal } from './CreateCommunityModal';
import { filterCommunities } from '../utils/communityFilters';
import { CommunityFilters, Community } from '../../../types';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2, Plus } from 'lucide-react';

// Filter options for sidebar dropdowns (static UI data)
const FILTER_OPTIONS = {
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

export const CommunitiesLandingView: React.FC = () => {
    const navigate = useNavigate();
    const { profile, isAuthenticated } = useAuth();

    // Check if user can create communities (member or admin)
    const canCreateCommunity = isAuthenticated && (profile?.role === 'member' || profile?.role === 'admin');

    // Create community modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Communities data from Supabase
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
    const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
    const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
    const [showPrivateOnly, setShowPrivateOnly] = useState<boolean | null>(null);

    // Mobile filter sidebar toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch communities from Supabase
    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('communities')
                .select('*')
                .order('member_count', { ascending: false });

            if (fetchError) throw fetchError;

            // Transform to match Community type
            const transformedData: Community[] = (data || []).map(c => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                description: c.description || '',
                coverImage: c.cover_image,
                isPrivate: c.is_private,
                memberCount: c.member_count,
                tags: c.tags || [],
            }));

            setCommunities(transformedData);
        } catch (err: any) {
            console.error('Error fetching communities:', err);
            setError(err.message || 'Failed to load communities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    // Build filters object
    const filters: CommunityFilters = useMemo(() => ({
        search: searchQuery,
        theme: selectedThemes.length > 0 ? selectedThemes : undefined,
        sector: selectedSectors.length > 0 ? selectedSectors : undefined,
        projectType: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
        territory: selectedTerritories.length > 0 ? selectedTerritories : undefined,
        isPrivate: showPrivateOnly ?? undefined,
    }), [searchQuery, selectedThemes, selectedSectors, selectedProjectTypes, selectedTerritories, showPrivateOnly]);

    // Filter communities
    const filteredCommunities = useMemo(() =>
        filterCommunities(communities, filters),
        [communities, filters]
    );

    // Handle filter toggle
    const toggleFilter = (
        value: string,
        selected: string[],
        setSelected: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (selected.includes(value)) {
            setSelected(selected.filter(v => v !== value));
        } else {
            setSelected([...selected, value]);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedThemes([]);
        setSelectedSectors([]);
        setSelectedProjectTypes([]);
        setSelectedTerritories([]);
        setShowPrivateOnly(null);
    };

    const hasActiveFilters = searchQuery ||
        selectedThemes.length > 0 ||
        selectedSectors.length > 0 ||
        selectedProjectTypes.length > 0 ||
        selectedTerritories.length > 0 ||
        showPrivateOnly !== null;

    // Filter Section Component
    const FilterSection: React.FC<{
        title: string;
        options: string[];
        selected: string[];
        onToggle: (value: string) => void;
    }> = ({ title, options, selected, onToggle }) => (
        <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {options.map(option => (
                    <button
                        key={option}
                        onClick={() => onToggle(option)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selected.includes(option)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-bold mb-4">Discover Communities</h1>
                        <p className="text-lg text-emerald-100 mb-8">
                            Join specialized groups to collaborate on sustainable initiatives, share knowledge,
                            and connect with like-minded changemakers.
                        </p>

                        {/* Search Bar */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search communities by name, description, or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                            />
                        </div>

                        {/* Create Community Button - Only visible to members/admins */}
                        {canCreateCommunity && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Community
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Filters */}
                    <aside className={`lg:w-72 flex-shrink-0 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Privacy Toggle */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Access Type</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowPrivateOnly(showPrivateOnly === false ? null : false)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${showPrivateOnly === false
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">public</span>
                                        Public
                                    </button>
                                    <button
                                        onClick={() => setShowPrivateOnly(showPrivateOnly === true ? null : true)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${showPrivateOnly === true
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">lock</span>
                                        Private
                                    </button>
                                </div>
                            </div>

                            <FilterSection
                                title="Theme"
                                options={FILTER_OPTIONS.theme}
                                selected={selectedThemes}
                                onToggle={(v) => toggleFilter(v, selectedThemes, setSelectedThemes)}
                            />

                            <FilterSection
                                title="Sector"
                                options={FILTER_OPTIONS.sector}
                                selected={selectedSectors}
                                onToggle={(v) => toggleFilter(v, selectedSectors, setSelectedSectors)}
                            />

                            <FilterSection
                                title="Project Type"
                                options={FILTER_OPTIONS.projectType}
                                selected={selectedProjectTypes}
                                onToggle={(v) => toggleFilter(v, selectedProjectTypes, setSelectedProjectTypes)}
                            />

                            <FilterSection
                                title="Territory"
                                options={FILTER_OPTIONS.territory}
                                selected={selectedTerritories}
                                onToggle={(v) => toggleFilter(v, selectedTerritories, setSelectedTerritories)}
                            />
                        </div>
                    </aside>

                    {/* Main Grid */}
                    <main className="flex-1">
                        {/* Mobile Filter Toggle */}
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                Filters
                                {hasActiveFilters && (
                                    <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        Active
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">{filteredCommunities.length}</span>
                                {' '}communities found
                            </p>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                                <p className="text-gray-600">Loading communities...</p>
                            </div>
                        ) : error ? (
                            /* Error State */
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-symbols-outlined text-6xl text-red-300 mb-4">error</span>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to load communities</h3>
                                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredCommunities.length > 0 ? (
                            /* Communities Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredCommunities.map(community => (
                                    <CommunityCard
                                        key={community.id}
                                        community={community}
                                        onClick={() => navigate(`/communities/${community.slug}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No communities found</h3>
                                <p className="text-gray-500 mb-6 max-w-md">
                                    Try adjusting your filters or search terms to discover more communities.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Create Community Modal */}
            <CreateCommunityModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchCommunities()}
            />
        </div>
    );
};
