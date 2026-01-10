import { useState, useEffect, useCallback } from 'react';
import { CommunityEvent } from '../../../types';
import {
    fetchCommunityEvents,
    fetchUpcomingCommunityEvents,
    fetchUserUpcomingEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    CreateEventInput,
} from '../services/eventService';

interface UseEventsResult {
    events: CommunityEvent[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    createEvent: (input: CreateEventInput, createdBy: string) => Promise<CommunityEvent>;
    updateEvent: (eventId: string, updates: Partial<CreateEventInput>) => Promise<CommunityEvent>;
    deleteEvent: (eventId: string) => Promise<void>;
}

/**
 * Hook to fetch and manage events for a specific community
 */
export const useCommunityEvents = (
    communityId: string | null,
    upcomingOnly: boolean = false
): UseEventsResult => {
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadEvents = useCallback(async () => {
        if (!communityId) {
            setEvents([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const data = upcomingOnly
                ? await fetchUpcomingCommunityEvents(communityId)
                : await fetchCommunityEvents(communityId);

            setEvents(data);
        } catch (err) {
            console.error('[useCommunityEvents] Error loading events:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [communityId, upcomingOnly]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleCreateEvent = useCallback(async (input: CreateEventInput, createdBy: string) => {
        const newEvent = await createEvent(input, createdBy);
        setEvents(prev => [...prev, newEvent].sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));
        return newEvent;
    }, []);

    const handleUpdateEvent = useCallback(async (eventId: string, updates: Partial<CreateEventInput>) => {
        const updatedEvent = await updateEvent(eventId, updates);
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        return updatedEvent;
    }, []);

    const handleDeleteEvent = useCallback(async (eventId: string) => {
        await deleteEvent(eventId);
        setEvents(prev => prev.filter(e => e.id !== eventId));
    }, []);

    return {
        events,
        isLoading,
        error,
        refresh: loadEvents,
        createEvent: handleCreateEvent,
        updateEvent: handleUpdateEvent,
        deleteEvent: handleDeleteEvent,
    };
};

interface UseUserEventsResult {
    events: CommunityEvent[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch upcoming events from ALL communities the user is a member of
 * Used for the dashboard widget
 */
export const useUserUpcomingEvents = (
    userId: string | null | undefined,
    limit: number = 5
): UseUserEventsResult => {
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadEvents = useCallback(async () => {
        if (!userId) {
            setEvents([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchUserUpcomingEvents(userId, limit);
            setEvents(data);
        } catch (err) {
            console.error('[useUserUpcomingEvents] Error loading events:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, limit]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    return {
        events,
        isLoading,
        error,
        refresh: loadEvents,
    };
};
