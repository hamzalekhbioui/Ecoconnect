import { api, buildQueryString } from '../../../config/api';
import { CommunityEvent, EventLocationType } from '../../../types';

// =============================================================================
// TYPES
// =============================================================================

interface ApiEvent {
    id: string;
    communityId: string;
    createdBy: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    locationType: EventLocationType;
    meetingLink?: string;
    address?: string;
    coverImage?: string;
    maxAttendees?: number;
    createdAt: string;
    updatedAt?: string;
    community?: {
        id: string;
        name: string;
        slug: string;
        coverImage?: string;
    };
}

export interface CreateEventInput {
    communityId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    locationType: EventLocationType;
    meetingLink?: string;
    address?: string;
    coverImage?: string;
    maxAttendees?: number;
}

// =============================================================================
// TRANSFORMERS
// =============================================================================

const transformApiEvent = (apiEvent: ApiEvent): CommunityEvent => ({
    id: apiEvent.id,
    communityId: apiEvent.communityId,
    createdBy: apiEvent.createdBy,
    title: apiEvent.title,
    description: apiEvent.description,
    startTime: apiEvent.startTime,
    endTime: apiEvent.endTime,
    locationType: apiEvent.locationType,
    meetingLink: apiEvent.meetingLink,
    address: apiEvent.address,
    coverImage: apiEvent.coverImage,
    maxAttendees: apiEvent.maxAttendees,
    createdAt: apiEvent.createdAt,
    updatedAt: apiEvent.updatedAt,
    community: apiEvent.community ? {
        id: apiEvent.community.id,
        name: apiEvent.community.name,
        slug: apiEvent.community.slug,
        coverImage: apiEvent.community.coverImage,
    } : undefined,
});

// =============================================================================
// EVENT FUNCTIONS
// =============================================================================

/**
 * Fetch all events for a specific community
 */
export const fetchCommunityEvents = async (communityId: string): Promise<CommunityEvent[]> => {
    const query = buildQueryString({ communityId });
    const events = await api.get<ApiEvent[]>(`/api/events${query}`);
    return events.map(transformApiEvent);
};

/**
 * Fetch upcoming events for a specific community (only future events)
 */
export const fetchUpcomingCommunityEvents = async (communityId: string): Promise<CommunityEvent[]> => {
    const query = buildQueryString({ communityId, upcoming: true });
    const events = await api.get<ApiEvent[]>(`/api/events${query}`);
    return events.map(transformApiEvent);
};

/**
 * Fetch upcoming events from ALL communities the user is a member of
 * Used for the dashboard widget
 */
export const fetchUserUpcomingEvents = async (_userId: string, limit: number = 5): Promise<CommunityEvent[]> => {
    const query = buildQueryString({ limit });
    const events = await api.get<ApiEvent[]>(`/api/events/upcoming/user${query}`);
    return events.map(transformApiEvent);
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (eventId: string): Promise<CommunityEvent | null> => {
    try {
        const event = await api.get<ApiEvent>(`/api/events/${eventId}`);
        return transformApiEvent(event);
    } catch (error) {
        console.error('[eventService] Error fetching event:', error);
        return null;
    }
};

/**
 * Create a new event
 */
export const createEvent = async (input: CreateEventInput, _createdBy: string): Promise<CommunityEvent> => {
    const event = await api.post<ApiEvent>('/api/events', input);
    return transformApiEvent(event);
};

/**
 * Update an existing event
 */
export const updateEvent = async (
    eventId: string,
    updates: Partial<CreateEventInput>
): Promise<CommunityEvent> => {
    const event = await api.patch<ApiEvent>(`/api/events/${eventId}`, updates);
    return transformApiEvent(event);
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
    await api.delete(`/api/events/${eventId}`);
};
