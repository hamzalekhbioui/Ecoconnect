import React from 'react';
import { X, MapPin, Calendar, Tag, ExternalLink, MessageCircle } from 'lucide-react';

interface ListingProfile {
    full_name: string;
    avatar_url: string | null;
}

export interface MarketplaceListingData {
    id: string;
    title: string;
    description: string;
    price: number | null;
    category: 'SKILL' | 'DOCUMENT' | 'SERVICE' | 'CONTACT' | 'PROJECT' | 'TOOL';
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: ListingProfile;
}

interface ListingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: MarketplaceListingData | null;
}

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

const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'SKILL': return 'bg-orange-100 text-orange-700';
        case 'DOCUMENT': return 'bg-emerald-100 text-emerald-700';
        case 'SERVICE': return 'bg-teal-100 text-teal-700';
        case 'CONTACT': return 'bg-blue-100 text-blue-700';
        case 'PROJECT': return 'bg-lime-100 text-lime-700';
        case 'TOOL': return 'bg-amber-100 text-amber-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
    isOpen,
    onClose,
    listing,
}) => {
    if (!isOpen || !listing) return null;

    // Debug: Check what image_url we have
    console.log('Listing image_url:', listing.image_url);

    const formattedDate = new Date(listing.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedPrice = listing.price
        ? `€${listing.price.toFixed(2)}`
        : 'Free';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with Image */}
                <div className="relative">
                    {listing.image_url ? (
                        <div className="w-full h-64 bg-gray-100">
                            <img
                                src={listing.image_url}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-emerald-400">
                                {getCategoryIcon(listing.category)}
                            </span>
                        </div>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Category Badge */}
                    <div className="absolute bottom-4 left-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getCategoryColor(listing.category)}`}>
                            <span className="material-symbols-outlined text-[16px]">
                                {getCategoryIcon(listing.category)}
                            </span>
                            {listing.category}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Title & Price */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{listing.title}</h2>
                        <span className={`text-xl font-bold flex-shrink-0 ${listing.price ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {formattedPrice}
                        </span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formattedDate}
                        </span>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                            Description
                        </h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {listing.description}
                        </p>
                    </div>

                    {/* Author */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                            Posted by
                        </h3>
                        <div className="flex items-center gap-4">
                            <img
                                src={listing.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.profiles.full_name)}&background=13ec5b&color=fff`}
                                alt={listing.profiles.full_name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100"
                            />
                            <div className="flex-1">
                                <p className="text-lg font-semibold text-gray-900">
                                    {listing.profiles.full_name}
                                </p>
                                <p className="text-sm text-gray-500">Community Member</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
                    >
                        Close
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Contact
                    </button>
                </div>
            </div>
        </div>
    );
};
