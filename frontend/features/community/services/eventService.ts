import { supabase } from '../../../config/supabase';
import { CommunityEvent, CommunityEventRow, EventLocationType } from '../../../types';

/**
 * Transform database row to frontend type
 */
const transformEventRow = (row: CommunityEventRow): CommunityEvent => ({
    id: row.id,
    communityId: row.community_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    locationType: row.location_type,
    meetingLink: row.meeting_link,
    address: row.address,
    coverImage: row.cover_image,
    maxAttendees: row.max_attendees,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    community: row.communities ? {
        id: row.communities.id,
        name: row.communities.name,
        slug: row.communities.slug,
        coverImage: row.communities.cover_image,
    } : undefined,
});

/**
 * Fetch all events for a specific community
 */
export const fetchCommunityEvents = async (communityId: string): Promise<CommunityEvent[]> => {
    const { data, error } = await supabase
        .from('community_events')
        .select(`
            *,
            communities(id, name, slug, cover_image)
        `)
        .eq('community_id', communityId)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('[eventService] Error fetching community events:', error);
        throw error;
    }

    return (data as CommunityEventRow[]).map(transformEventRow);
};

/**
 * Fetch upcoming events for a specific community (only future events)
 */
export const fetchUpcomingCommunityEvents = async (communityId: string): Promise<CommunityEvent[]> => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('community_events')
        .select(`
            *,
            communities(id, name, slug, cover_image)
        `)
        .eq('community_id', communityId)
        .gte('start_time', now)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('[eventService] Error fetching upcoming events:', error);
        throw error;
    }

    return (data as CommunityEventRow[]).map(transformEventRow);
};

/**
 * Fetch upcoming events from ALL communities the user is a member of
 * Used for the dashboard widget
 */
export const fetchUserUpcomingEvents = async (userId: string, limit: number = 5): Promise<CommunityEvent[]> => {
    const now = new Date().toISOString();

    // First get all community IDs the user is a member of
    const { data: memberships, error: membershipError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId)
        .eq('status', 'approved');

    if (membershipError) {
        console.error('[eventService] Error fetching user memberships:', membershipError);
        throw membershipError;
    }

    if (!memberships || memberships.length === 0) {
        return [];
    }

    const communityIds = memberships.map(m => m.community_id);

    // Fetch upcoming events from those communities
    const { data, error } = await supabase
        .from('community_events')
        .select(`
            *,
            communities(id, name, slug, cover_image)
        `)
        .in('community_id', communityIds)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('[eventService] Error fetching user upcoming events:', error);
        throw error;
    }

    return (data as CommunityEventRow[]).map(transformEventRow);
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (eventId: string): Promise<CommunityEvent | null> => {
    const { data, error } = await supabase
        .from('community_events')
        .select(`
            *,
            communities(id, name, slug, cover_image)
        `)
        .eq('id', eventId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('[eventService] Error fetching event:', error);
        throw error;
    }

    return transformEventRow(data as CommunityEventRow);
};

/**
 * Create a new event
 */
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

export const createEvent = async (input: CreateEventInput, createdBy: string): Promise<CommunityEvent> => {
    const { data, error } = await supabase
        .from('community_events')
        .insert({
            community_id: input.communityId,
            created_by: createdBy,
            title: input.title,
            description: input.description,
            start_time: input.startTime,
            end_time: input.endTime,
            location_type: input.locationType,
            meeting_link: input.meetingLink,
            address: input.address,
            cover_image: input.coverImage,
            max_attendees: input.maxAttendees,
        })
        .select(`
            *,
            communities(id, name, slug, cover_image)
        `)
        .single();

    if (error) {
        console.error('[eventService] Error creating event:', error);
        throw error;
    }

    return transformEventRow(data as CommunityEventRow);
};

/**
 * Update an existing event
 */
export const updateEvent = async (
    eventId: string,
    updates: Partial<CreateEventInput>
): Promise<CommunityEvent> => {
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.locationType !== undefined) updateData.location_type = updates.locationType;
    if (updates.meetingLink !== undefined) updateData.meeting_link = updates.meetingLink;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage;
    if (updates.maxAttendees !== undefined) updateData.max_attendees = updates.maxAttendees;

    const { data, error } = await supabase
        .from('community_events')
        .update(updateData)
        .eq('id', eventId)
        .select(`
            *,
            communities(id, name, slug, cover_image)
        `)
        .single();

    if (error) {
        console.error('[eventService] Error updating event:', error);
        throw error;
    }

    return transformEventRow(data as CommunityEventRow);
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
    const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('[eventService] Error deleting event:', error);
        throw error;
    }
};
