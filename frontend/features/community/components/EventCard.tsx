import React from 'react';
import { CommunityEvent } from '../../../types';
import { Calendar, Clock, MapPin, Video, Users, ExternalLink, MoreVertical } from 'lucide-react';

interface EventCardProps {
    event: CommunityEvent;
    isCreator?: boolean;
    onEdit?: (event: CommunityEvent) => void;
    onDelete?: (event: CommunityEvent) => void;
    showCommunity?: boolean;
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const isUpcoming = (dateString: string): boolean => {
    return new Date(dateString) > new Date();
};

export const EventCard: React.FC<EventCardProps> = ({
    event,
    isCreator = false,
    onEdit,
    onDelete,
    showCommunity = false,
}) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const upcoming = isUpcoming(event.startTime);

    const handleAction = (action: 'edit' | 'delete') => {
        setShowMenu(false);
        if (action === 'edit' && onEdit) onEdit(event);
        if (action === 'delete' && onDelete) onDelete(event);
    };

    return (
        <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden transition-all hover:shadow-lg ${!upcoming ? 'opacity-60' : ''
            }`}>
            {/* Cover Image or Gradient Header */}
            {event.coverImage ? (
                <div className="h-32 relative">
                    <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
            ) : (
                <div className={`h-24 relative ${event.locationType === 'remote'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500'
                    }`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {event.locationType === 'remote' ? (
                            <Video className="w-10 h-10 text-white/30" />
                        ) : (
                            <MapPin className="w-10 h-10 text-white/30" />
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {/* Date & Time Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span>{formatDate(event.startTime)}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span>{formatTime(event.startTime)}</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                    {event.title}
                </h3>

                {/* Description */}
                {event.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {event.description}
                    </p>
                )}

                {/* Location */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${event.locationType === 'remote'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-orange-50 text-orange-700'
                    }`}>
                    {event.locationType === 'remote' ? (
                        <>
                            <Video className="w-4 h-4" />
                            <span>Remote</span>
                        </>
                    ) : (
                        <>
                            <MapPin className="w-4 h-4" />
                            <span>In Person</span>
                        </>
                    )}
                </div>

                {/* Address or Meeting Link */}
                {event.locationType === 'remote' && event.meetingLink && (
                    <div className="mt-2 text-sm text-gray-500 truncate">
                        <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Join Meeting
                        </a>
                    </div>
                )}
                {event.locationType === 'in_person' && event.address && (
                    <div className="mt-2 text-sm text-gray-500 truncate">
                        📍 {event.address}
                    </div>
                )}

                {/* Community Name (if showing in dashboard) */}
                {showCommunity && event.community && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            From <strong className="text-gray-700">{event.community.name}</strong>
                        </span>
                    </div>
                )}

                {/* Max Attendees */}
                {event.maxAttendees && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>Max {event.maxAttendees} attendees</span>
                    </div>
                )}
            </div>

            {/* Admin Actions */}
            {isCreator && (onEdit || onDelete) && (
                <div className="px-4 pb-4 relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute bottom-12 left-4 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[120px]">
                                {onEdit && (
                                    <button
                                        onClick={() => handleAction('edit')}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit Event
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => handleAction('delete')}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Delete Event
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
