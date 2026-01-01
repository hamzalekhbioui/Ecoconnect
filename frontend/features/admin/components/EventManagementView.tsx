import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, Column } from '../shared/DataTable';
import { ActionButtons } from '../shared/ActionButtons';
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    Users,
    Clock,
    Globe,
    MapPin,
    X,
    Save,
    Loader2,
    Plus
} from 'lucide-react';

type EventCategory = 'workshop' | 'webinar' | 'meetup' | 'cleanup' | 'fundraiser' | 'conference' | 'other';

interface Event {
    id: string;
    title: string;
    description: string | null;
    date: string;
    start_time: string;
    end_time: string;
    category: EventCategory;
    location_type: 'online' | 'offline';
    community_id: string | null;
    created_at: string;
    community?: {
        name: string;
    } | null;
}

interface Community {
    id: string;
    name: string;
}

interface EventManagementViewProps {
    onNavigate: (page: string) => void;
}

const emptyEvent: Omit<Event, 'id' | 'created_at' | 'community'> = {
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    start_time: '09:00',
    end_time: '17:00',
    category: 'workshop',
    location_type: 'online',
    community_id: null
};

export const EventManagementView: React.FC<EventManagementViewProps> = ({ onNavigate }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newEvent, setNewEvent] = useState(emptyEvent);
    const [savingEvent, setSavingEvent] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        active: 0,
        upcomingThisWeek: 0,
        totalRegistrations: 0,
        pendingDraft: 0
    });

    useEffect(() => {
        fetchEvents();
        fetchCommunities();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    community:communities!community_id(name)
                `)
                .order('date', { ascending: true });

            if (error) throw error;

            const eventsData = data as Event[];
            setEvents(eventsData);
            setFilteredEvents(eventsData);

            const now = new Date();
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

            // Calculate stats
            setStats({
                active: eventsData.filter(e => new Date(e.date) >= now).length,
                upcomingThisWeek: eventsData.filter(e => {
                    const eventDate = new Date(e.date);
                    return eventDate >= now && eventDate <= oneWeekFromNow;
                }).length,
                totalRegistrations: 0, // TODO: Sum from event_registrations table when available
                pendingDraft: 0 // TODO: Count events with status='draft' when status field is added
            });
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommunities = async () => {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setCommunities(data || []);
        } catch (error) {
            console.error('Error fetching communities:', error);
        }
    };

    const handleSearch = (query: string) => {
        const filtered = events.filter(
            event =>
                event.title.toLowerCase().includes(query.toLowerCase()) ||
                event.description?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredEvents(filtered);
    };

    const handleCreateEvent = async () => {
        setSavingEvent(true);
        try {
            const { error } = await supabase
                .from('events')
                .insert([{
                    ...newEvent,
                    date: new Date(newEvent.date).toISOString()
                }]);

            if (error) throw error;

            await fetchEvents();
            setIsCreating(false);
            setNewEvent(emptyEvent);
        } catch (error) {
            console.error('Error creating event:', error);
        } finally {
            setSavingEvent(false);
        }
    };

    const handleEditEvent = async () => {
        if (!editingEvent) return;
        setSavingEvent(true);

        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title: editingEvent.title,
                    description: editingEvent.description,
                    date: new Date(editingEvent.date).toISOString(),
                    start_time: editingEvent.start_time,
                    end_time: editingEvent.end_time,
                    category: editingEvent.category,
                    location_type: editingEvent.location_type,
                    community_id: editingEvent.community_id
                })
                .eq('id', editingEvent.id);

            if (error) throw error;

            await fetchEvents();
            setEditingEvent(null);
        } catch (error) {
            console.error('Error updating event:', error);
        } finally {
            setSavingEvent(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            await fetchEvents();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
            time: date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleDateString('en', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    const columns: Column<Event>[] = [
        {
            key: 'date',
            header: 'Date',
            sortable: true,
            render: (event) => {
                const dateInfo = formatEventDate(event.date);
                const isPast = new Date(event.date) < new Date();
                return (
                    <div className={`text-center w-14 ${isPast ? 'opacity-50' : ''}`}>
                        <div className="text-lg font-bold text-white">{dateInfo.day}</div>
                        <div className="text-xs text-emerald-400 font-medium">{dateInfo.month}</div>
                        <div className="text-xs text-slate-400">{dateInfo.time}</div>
                    </div>
                );
            }
        },
        {
            key: 'title',
            header: 'Event',
            render: (event) => (
                <div>
                    <span className="font-medium text-white">{event.title}</span>
                    {event.description && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">
                            {event.description}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'location_type',
            header: 'Location',
            render: (event) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${event.location_type === 'online'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {event.location_type === 'online' ? (
                        <Globe className="w-3 h-3" />
                    ) : (
                        <MapPin className="w-3 h-3" />
                    )}
                    {event.location_type.charAt(0).toUpperCase() + event.location_type.slice(1)}
                </span>
            )
        },
        {
            key: 'community',
            header: 'Community',
            render: (event) => (
                <span className="text-slate-300">
                    {event.community?.name || 'No community'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (event) => {
                const isPast = new Date(event.date) < new Date();
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPast
                        ? 'bg-slate-500/20 text-slate-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {isPast ? 'Past' : 'Upcoming'}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Events</h2>
                    <p className="text-sm text-slate-400">Schedule and manage community events</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Schedule Event
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Active Events"
                    value={stats.active}
                    icon={<Calendar className="w-5 h-5" />}
                    color="emerald"
                />
                <StatsCard
                    title="Upcoming This Week"
                    value={stats.upcomingThisWeek}
                    icon={<CalendarClock className="w-5 h-5" />}
                    color="blue"
                />
                <StatsCard
                    title="Total Registrations"
                    value={stats.totalRegistrations}
                    icon={<Users className="w-5 h-5" />}
                    color="purple"
                />
                <StatsCard
                    title="Pending Draft"
                    value={stats.pendingDraft}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
            </div>

            {/* Event Table */}
            <DataTable
                data={filteredEvents}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Search events..."
                onSearch={handleSearch}
                loading={loading}
                emptyMessage="No events found"
                actions={(event) => (
                    <ActionButtons
                        onEdit={() => setEditingEvent(event)}
                        onDelete={() => setDeleteConfirm(event.id)}
                    />
                )}
            />

            {/* Create/Edit Modal */}
            {(editingEvent || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">
                                {isCreating ? 'Schedule Event' : 'Edit Event'}
                            </h3>
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setIsCreating(false);
                                    setNewEvent(emptyEvent);
                                }}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={isCreating ? newEvent.title : editingEvent?.title}
                                    onChange={(e) => isCreating
                                        ? setNewEvent({ ...newEvent, title: e.target.value })
                                        : setEditingEvent({ ...editingEvent!, title: e.target.value })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Event title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={isCreating ? newEvent.description || '' : editingEvent?.description || ''}
                                    onChange={(e) => isCreating
                                        ? setNewEvent({ ...newEvent, description: e.target.value })
                                        : setEditingEvent({ ...editingEvent!, description: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 resize-none"
                                    placeholder="Describe the event..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={isCreating
                                        ? newEvent.date.slice(0, 10)
                                        : editingEvent?.date.slice(0, 10)
                                    }
                                    onChange={(e) => isCreating
                                        ? setNewEvent({ ...newEvent, date: e.target.value })
                                        : setEditingEvent({ ...editingEvent!, date: e.target.value })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={isCreating ? newEvent.start_time : editingEvent?.start_time}
                                        onChange={(e) => isCreating
                                            ? setNewEvent({ ...newEvent, start_time: e.target.value })
                                            : setEditingEvent({ ...editingEvent!, start_time: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={isCreating ? newEvent.end_time : editingEvent?.end_time}
                                        onChange={(e) => isCreating
                                            ? setNewEvent({ ...newEvent, end_time: e.target.value })
                                            : setEditingEvent({ ...editingEvent!, end_time: e.target.value })
                                        }
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={isCreating ? newEvent.category : editingEvent?.category}
                                    onChange={(e) => isCreating
                                        ? setNewEvent({ ...newEvent, category: e.target.value as EventCategory })
                                        : setEditingEvent({ ...editingEvent!, category: e.target.value as EventCategory })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="workshop">Workshop</option>
                                    <option value="webinar">Webinar</option>
                                    <option value="meetup">Meetup</option>
                                    <option value="cleanup">Cleanup</option>
                                    <option value="fundraiser">Fundraiser</option>
                                    <option value="conference">Conference</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Location Type
                                </label>
                                <select
                                    value={isCreating ? newEvent.location_type : editingEvent?.location_type}
                                    onChange={(e) => isCreating
                                        ? setNewEvent({ ...newEvent, location_type: e.target.value as Event['location_type'] })
                                        : setEditingEvent({ ...editingEvent!, location_type: e.target.value as Event['location_type'] })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="online">Online</option>
                                    <option value="offline">Offline / In-Person</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Community (Optional)
                                </label>
                                <select
                                    value={isCreating ? newEvent.community_id || '' : editingEvent?.community_id || ''}
                                    onChange={(e) => isCreating
                                        ? setNewEvent({ ...newEvent, community_id: e.target.value || null })
                                        : setEditingEvent({ ...editingEvent!, community_id: e.target.value || null })
                                    }
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">No community</option>
                                    {communities.map((community) => (
                                        <option key={community.id} value={community.id}>
                                            {community.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setIsCreating(false);
                                    setNewEvent(emptyEvent);
                                }}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isCreating ? handleCreateEvent : handleEditEvent}
                                disabled={savingEvent}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {savingEvent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isCreating ? 'Create' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Event?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. The event will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteEvent(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
