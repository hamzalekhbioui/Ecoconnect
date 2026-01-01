import React from 'react';
import { Community } from '../../../types';

interface CommunityCardProps {
    community: Community;
    onClick?: () => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        >
            {/* Cover Image */}
            <div className="relative h-40 overflow-hidden">
                {community.coverImage ? (
                    <img
                        src={community.coverImage}
                        alt={community.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                )}

                {/* Privacy Badge */}
                {community.isPrivate && (
                    <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        Private
                    </span>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {community.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                    {community.tags.length > 3 && (
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            +{community.tags.length - 3}
                        </span>
                    )}
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {community.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {community.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        <span className="text-sm font-medium">{community.memberCount.toLocaleString()}</span>
                        <span className="text-sm">members</span>
                    </div>

                    <span className="inline-flex items-center text-emerald-600 text-sm font-medium group-hover:gap-2 transition-all">
                        View
                        <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
                            arrow_forward
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};
