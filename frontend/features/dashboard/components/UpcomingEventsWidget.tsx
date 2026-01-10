import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserUpcomingEvents } from '../../community/hooks/useEvents';
import { EventCard } from '../../community/components/EventCard';
import { Calendar, Loader2, ArrowRight } from 'lucide-react';

interface UpcomingEventsWidgetProps {
    userId: string | null | undefined;
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({ userId }) => {
    const navigate = useNavigate();
    const { events, isLoading, error } = useUserUpcomingEvents(userId, 5);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <p className="text-gray-500 text-center py-4">Failed to load events</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                </div>
                {events.length > 0 && (
                    <button
                        onClick={() => navigate('/communities')}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {events.length > 0 ? (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => event.community && navigate(`/communities/${event.community.slug}`)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Date Badge */}
                                <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                                    <span className="text-xs font-bold text-emerald-600 uppercase">
                                        {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {new Date(event.startTime).getDate()}
                                    </span>
                                </div>

                                {/* Event Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        })}
                                        {' • '}
                                        <span className={event.locationType === 'remote' ? 'text-blue-600' : 'text-orange-600'}>
                                            {event.locationType === 'remote' ? '🖥️ Remote' : '📍 In Person'}
                                        </span>
                                    </p>
                                    {event.community && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {event.community.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 mb-1">No upcoming events</h3>
                    <p className="text-sm text-gray-500">
                        Join communities to see their events here
                    </p>
                    <button
                        onClick={() => navigate('/communities')}
                        className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm"
                    >
                        Browse Communities
                    </button>
                </div>
            )}
        </div>
    );
};
