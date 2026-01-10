import React, { useState } from 'react';
import { CommunityEvent } from '../../../types';
import { EventCard } from './EventCard';
import { CreateEventModal } from './CreateEventModal';
import { useCommunityEvents } from '../hooks/useEvents';
import { Loader2, Plus, Calendar, AlertCircle } from 'lucide-react';

interface CommunityEventsListProps {
    communityId: string;
    isCreator: boolean;
    creatorId: string;
}

export const CommunityEventsList: React.FC<CommunityEventsListProps> = ({
    communityId,
    isCreator,
    creatorId,
}) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<CommunityEvent | null>(null);

    const {
        events,
        isLoading,
        error,
        refresh,
        createEvent,
        updateEvent,
        deleteEvent,
    } = useCommunityEvents(communityId, false);

    const handleCreateEvent = async (input: Parameters<typeof createEvent>[0]) => {
        await createEvent(input, creatorId);
        setIsCreateModalOpen(false);
    };

    const handleUpdateEvent = async (input: Parameters<typeof createEvent>[0]) => {
        if (!editingEvent) return;
        await updateEvent(editingEvent.id, input);
        setEditingEvent(null);
    };

    const handleDeleteEvent = async () => {
        if (!deleteConfirm) return;
        await deleteEvent(deleteConfirm.id);
        setDeleteConfirm(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Failed to load events</h3>
                <p className="text-gray-500 mb-4">There was an error loading the events.</p>
                <button
                    onClick={() => refresh()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Create Button */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-bold text-gray-900">Community Events</h2>
                    <span className="text-sm text-gray-500">({events.length})</span>
                </div>

                {isCreator && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Event
                    </button>
                )}
            </div>

            {/* Events Grid */}
            {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            isCreator={isCreator}
                            onEdit={isCreator ? setEditingEvent : undefined}
                            onDelete={isCreator ? setDeleteConfirm : undefined}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No events yet</h3>
                    <p className="text-gray-500 mb-4">
                        {isCreator
                            ? 'Create your first event to engage with your community!'
                            : 'This community hasn\'t scheduled any events yet.'}
                    </p>
                    {isCreator && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Event
                        </button>
                    )}
                </div>
            )}

            {/* Create Event Modal */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateEvent}
                communityId={communityId}
            />

            {/* Edit Event Modal */}
            {editingEvent && (
                <CreateEventModal
                    isOpen={true}
                    onClose={() => setEditingEvent(null)}
                    onSubmit={handleUpdateEvent}
                    communityId={communityId}
                    initialData={editingEvent}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Event?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEvent}
                                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
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
