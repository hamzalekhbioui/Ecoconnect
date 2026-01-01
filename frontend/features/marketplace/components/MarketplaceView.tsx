import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { FEATURED_LISTINGS } from '../../../config/constants';
import { CreateListingModal } from './CreateListingModal';
import { ListingDetailsModal, MarketplaceListingData } from './ListingDetailsModal';
import { Loader2 } from 'lucide-react';

type FilterType = 'All' | 'Skills' | 'Documents' | 'Events' | 'Contacts';
type PriceFilter = 'paid' | 'free' | null;

export const MarketplaceView: React.FC = () => {
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [listings, setListings] = useState<MarketplaceListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListingData | null>(null);

  const filters: FilterType[] = ['All', 'Skills', 'Documents', 'Events', 'Contacts'];

  const canCreateListing = profile?.role === 'member' || profile?.role === 'admin';

  // Fetch listings from Supabase
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('marketplace_listings')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setListings(data as MarketplaceListingData[]);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const getCategoryForFilter = (filter: FilterType): string[] => {
    switch (filter) {
      case 'Skills': return ['SKILL'];
      case 'Documents': return ['DOCUMENT'];
      case 'Events': return ['SERVICE', 'PROJECT'];
      case 'Contacts': return ['CONTACT'];
      default: return [];
    }
  };

  const filteredListings = listings.filter(listing => {
    // Filter by category
    if (activeFilter !== 'All') {
      const categories = getCategoryForFilter(activeFilter);
      if (!categories.includes(listing.category)) return false;
    }

    // Filter by price type
    if (priceFilter === 'paid' && (!listing.price || listing.price <= 0)) return false;
    if (priceFilter === 'free' && listing.price && listing.price > 0) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query);
    }

    return true;
  });

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'SKILL': return 'psychology';
      case 'DOCUMENT': return 'description';
      case 'SERVICE': return 'handyman';
      case 'CONTACT': return 'person_add';
      case 'PROJECT': return 'science';
      case 'TOOL': return 'construction';
      default: return 'category';
    }
  };

  const getCategoryBgColor = (category: string): string => {
    switch (category) {
      case 'SKILL': return 'bg-orange-100';
      case 'DOCUMENT': return 'bg-emerald-100';
      case 'SERVICE': return 'bg-teal-100';
      case 'CONTACT': return 'bg-blue-100';
      case 'PROJECT': return 'bg-lime-100';
      case 'TOOL': return 'bg-amber-100';
      default: return 'bg-gray-100';
    }
  };

  const getPriceDisplay = (price: number | null): { text: string; className: string } => {
    if (!price || price <= 0) {
      return { text: 'Free', className: 'text-emerald-600 font-medium' };
    }
    return { text: `€${price.toFixed(2)}`, className: 'text-gray-900 font-semibold' };
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Marketplace</h1>
            <p className="text-gray-500 mt-1">Exchange skills, resources, and circular opportunities with peers.</p>
          </div>
          {canCreateListing && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Listing
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative flex-1 w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Search skills, documents, or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilter === filter
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {filter}
              </button>
            ))}

            {/* Paid & Free Toggle Buttons */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => setPriceFilter(priceFilter === 'paid' ? null : 'paid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${priceFilter === 'paid'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Paid
              </button>
              <button
                onClick={() => setPriceFilter(priceFilter === 'free' ? null : 'free')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${priceFilter === 'free'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">sell</span>
                Free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Banner */}
          <div
            className="relative rounded-2xl overflow-hidden h-72 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(to right, rgba(13, 40, 24, 0.95) 50%, rgba(13, 40, 24, 0.4) 100%), url('${FEATURED_LISTINGS[0].backgroundImage}')` }}
          >
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <span className="inline-flex w-fit bg-[#13ec5b] text-[10px] font-bold text-gray-900 px-2.5 py-1 rounded uppercase tracking-wide">
                {FEATURED_LISTINGS[0].badge}
              </span>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{FEATURED_LISTINGS[0].title}</h3>
                <p className="text-gray-300 text-sm mb-4 max-w-xs">{FEATURED_LISTINGS[0].description}</p>
                <button className="inline-flex items-center bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 font-semibold px-4 py-2 rounded-full text-sm transition-colors">
                  {FEATURED_LISTINGS[0].buttonText}
                </button>
              </div>
            </div>
          </div>

          {/* Right Banner */}
          <div
            className="relative rounded-2xl overflow-hidden h-72 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(to right, rgba(13, 40, 24, 0.9) 40%, rgba(13, 40, 24, 0.3) 100%), url('${FEATURED_LISTINGS[1].backgroundImage}')` }}
          >
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <span className="inline-flex w-fit bg-[#13ec5b] text-[10px] font-bold text-gray-900 px-2.5 py-1 rounded uppercase tracking-wide">
                {FEATURED_LISTINGS[1].badge}
              </span>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{FEATURED_LISTINGS[1].title}</h3>
                <p className="text-gray-300 text-sm mb-4 max-w-xs">{FEATURED_LISTINGS[1].description}</p>
                <button className="inline-flex items-center bg-white hover:bg-gray-100 text-gray-900 font-semibold px-4 py-2 rounded-full text-sm transition-colors">
                  {FEATURED_LISTINGS[1].buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
            <p className="text-gray-500">Loading listings...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-4">error</span>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchListings}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">inbox</span>
            <p className="text-gray-500 text-lg mb-2">No listings found</p>
            <p className="text-gray-400 text-sm">
              {searchQuery || activeFilter !== 'All' || priceFilter
                ? 'Try adjusting your filters'
                : 'Be the first to create a listing!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredListings.map(listing => {
              const priceInfo = getPriceDisplay(listing.price);
              return (
                <div
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col group"
                >
                  {/* Image or Icon */}
                  {listing.image_url ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-4">
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-xl ${getCategoryBgColor(listing.category)} flex items-center justify-center mb-4`}>
                      <span className="material-symbols-outlined text-2xl text-gray-700">
                        {getCategoryIcon(listing.category)}
                      </span>
                    </div>
                  )}

                  {/* Top Row: Category Badge & Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-200 px-2 py-0.5 rounded">
                      {listing.category}
                    </span>
                    <span className={priceInfo.className}>
                      {priceInfo.text}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">{listing.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{listing.description}</p>

                  {/* User Profile */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <img
                      src={listing.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.profiles.full_name)}&background=13ec5b&color=fff`}
                      alt={listing.profiles.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.profiles.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchListings}
      />

      <ListingDetailsModal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        listing={selectedListing}
      />
    </div>
  );
};