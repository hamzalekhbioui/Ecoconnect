import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, Column } from '../shared/DataTable';
import { ActionButtons } from '../shared/ActionButtons';
import {
    ShoppingBag,
    DollarSign,
    Users,
    TrendingUp,
    X,
    Loader2,
    Eye,
    Calendar,
    Package
} from 'lucide-react';

interface MarketplaceListing {
    id: string;
    title: string;
    description: string;
    price: number | null;
    category: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    author?: {
        full_name: string;
        email: string;
        avatar_url: string | null;
    };
}

interface AdminMarketplaceViewProps {
    onNavigate: (page: string) => void;
}

export const AdminMarketplaceView: React.FC<AdminMarketplaceViewProps> = ({ onNavigate }) => {
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [filteredListings, setFilteredListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [viewListing, setViewListing] = useState<MarketplaceListing | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        free: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('marketplace_listings')
                .select(`
                    *,
                    author:profiles!user_id(full_name, email, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const listingsData = data as MarketplaceListing[];
            setListings(listingsData);
            setFilteredListings(listingsData);

            // Calculate stats
            const totalRevenue = listingsData.reduce((sum, l) => sum + (l.price || 0), 0);
            setStats({
                total: listingsData.length,
                paid: listingsData.filter(l => l.price && l.price > 0).length,
                free: listingsData.filter(l => !l.price || l.price === 0).length,
                totalRevenue
            });
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        const filtered = listings.filter(
            listing =>
                listing.title.toLowerCase().includes(query.toLowerCase()) ||
                listing.description?.toLowerCase().includes(query.toLowerCase()) ||
                listing.author?.full_name.toLowerCase().includes(query.toLowerCase()) ||
                listing.author?.email.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredListings(filtered);
    };

    const handleDeleteListing = async (listingId: string) => {
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('marketplace_listings')
                .delete()
                .eq('id', listingId);

            if (error) throw error;

            // Immediately update local state to remove the deleted listing
            const updatedListings = listings.filter(l => l.id !== listingId);
            setListings(updatedListings);
            setFilteredListings(filteredListings.filter(l => l.id !== listingId));

            // Recalculate stats
            const deletedListing = listings.find(l => l.id === listingId);
            setStats(prev => ({
                total: prev.total - 1,
                paid: deletedListing?.price && deletedListing.price > 0 ? prev.paid - 1 : prev.paid,
                free: !deletedListing?.price || deletedListing.price === 0 ? prev.free - 1 : prev.free,
                totalRevenue: prev.totalRevenue - (deletedListing?.price || 0)
            }));

            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting listing:', error);
            alert('Failed to delete listing. You may not have permission.');
        } finally {
            setDeleting(false);
        }
    };

    const getCategoryStyle = (category: string) => {
        const styles: Record<string, string> = {
            SKILL: 'bg-orange-500/20 text-orange-400',
            DOCUMENT: 'bg-emerald-500/20 text-emerald-400',
            SERVICE: 'bg-teal-500/20 text-teal-400',
            CONTACT: 'bg-blue-500/20 text-blue-400',
            PROJECT: 'bg-lime-500/20 text-lime-400',
            TOOL: 'bg-amber-500/20 text-amber-400'
        };
        return styles[category] || 'bg-slate-500/20 text-slate-400';
    };

    const columns: Column<MarketplaceListing>[] = [
        {
            key: 'image_url',
            header: 'Banner',
            render: (listing) => (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                    {listing.image_url ? (
                        <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (listing) => (
                <div className="max-w-[200px]">
                    <span className="font-medium text-white truncate block">{listing.title}</span>
                    <p className="text-xs text-slate-400 truncate">
                        {listing.description?.slice(0, 50)}...
                    </p>
                </div>
            )
        },
        {
            key: 'author',
            header: 'Author',
            render: (listing) => (
                <div className="flex items-center gap-2">
                    {listing.author?.avatar_url ? (
                        <img
                            src={listing.author.avatar_url}
                            alt={listing.author.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                                {listing.author?.full_name?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                    <div>
                        <span className="text-slate-300 text-sm">{listing.author?.full_name || 'Unknown'}</span>
                        {listing.author?.email && (
                            <p className="text-xs text-slate-500">{listing.author.email}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'price',
            header: 'Price',
            render: (listing) => (
                <span className={`font-medium ${listing.price ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {listing.price ? `€${listing.price.toFixed(2)}` : 'Free'}
                </span>
            )
        },
        {
            key: 'category',
            header: 'Category',
            render: (listing) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(listing.category)}`}>
                    {listing.category}
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            render: (listing) => (
                <span className="text-slate-400 text-xs">
                    {new Date(listing.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-white">Marketplace</h2>
                <p className="text-sm text-slate-400">Manage community marketplace listings</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Listings"
                    value={stats.total}
                    icon={<ShoppingBag className="w-5 h-5" />}
                    color="emerald"
                />
                <StatsCard
                    title="Paid Listings"
                    value={stats.paid}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="amber"
                />
                <StatsCard
                    title="Free Listings"
                    value={stats.free}
                    icon={<Users className="w-5 h-5" />}
                    color="blue"
                />
                <StatsCard
                    title="Total Value"
                    value={`€${stats.totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="purple"
                />
            </div>

            {/* Listings Table */}
            <DataTable
                data={filteredListings}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Search listings by title, author..."
                onSearch={handleSearch}
                loading={loading}
                emptyMessage="No marketplace listings found"
                actions={(listing) => (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setViewListing(listing)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="View"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <ActionButtons
                            onDelete={() => setDeleteConfirm(listing.id)}
                        />
                    </div>
                )}
            />

            {/* View Listing Modal */}
            {viewListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[85vh] overflow-hidden">
                        {/* Image Header */}
                        {viewListing.image_url && (
                            <div className="w-full h-48 bg-slate-900">
                                <img
                                    src={viewListing.image_url}
                                    alt={viewListing.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(viewListing.category)}`}>
                                    {viewListing.category}
                                </span>
                                <span className="font-semibold text-emerald-400">
                                    {viewListing.price ? `€${viewListing.price}` : 'Free'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3">{viewListing.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-h-32 overflow-y-auto">
                                {viewListing.description}
                            </p>

                            {/* Author Info */}
                            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg mb-4">
                                {viewListing.author?.avatar_url ? (
                                    <img
                                        src={viewListing.author.avatar_url}
                                        alt={viewListing.author.full_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                                        <span className="font-medium text-white">
                                            {viewListing.author?.full_name?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-white">{viewListing.author?.full_name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-400">{viewListing.author?.email}</p>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(viewListing.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setViewListing(null)}
                                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setViewListing(null);
                                        setDeleteConfirm(viewListing.id);
                                    }}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                                >
                                    Delete Listing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Listing?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. The listing will be permanently removed from the marketplace.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteListing(deleteConfirm)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
