import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto';

@Injectable()
export class EventsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Fetch events with optional filters.
     */
    async findAll(query: EventQueryDto) {
        const supabase = this.supabaseService.getAdminClient();
        const { communityId, upcoming, limit = 20 } = query;

        let queryBuilder = supabase
            .from('community_events')
            .select(`
                *,
                communities(id, name, slug, cover_image)
            `)
            .order('start_time', { ascending: true })
            .limit(limit);

        if (communityId) {
            queryBuilder = queryBuilder.eq('community_id', communityId);
        }

        if (upcoming) {
            queryBuilder = queryBuilder.gte('start_time', new Date().toISOString());
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return data?.map(this.transformEvent);
    }

    /**
     * Get a single event by ID.
     */
    async findById(id: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('community_events')
            .select(`
                *,
                communities(id, name, slug, cover_image)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Event not found');
            }
            throw error;
        }

        return this.transformEvent(data);
    }

    /**
     * Create a new event.
     */
    async create(dto: CreateEventDto, createdBy: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Verify user is community creator
        const { data: community } = await supabase
            .from('communities')
            .select('created_by')
            .eq('id', dto.communityId)
            .single();

        if (!community) {
            throw new NotFoundException('Community not found');
        }

        if (community.created_by !== createdBy) {
            throw new ForbiddenException('Only the community creator can create events');
        }

        const { data, error } = await supabase
            .from('community_events')
            .insert({
                community_id: dto.communityId,
                created_by: createdBy,
                title: dto.title,
                description: dto.description,
                start_time: dto.startTime,
                end_time: dto.endTime,
                location_type: dto.locationType,
                meeting_link: dto.meetingLink,
                address: dto.address,
                cover_image: dto.coverImage,
                max_attendees: dto.maxAttendees,
            })
            .select(`
                *,
                communities(id, name, slug, cover_image)
            `)
            .single();

        if (error) throw error;

        return this.transformEvent(data);
    }

    /**
     * Update an event.
     */
    async update(id: string, dto: UpdateEventDto, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const { data: event } = await supabase
            .from('community_events')
            .select('created_by')
            .eq('id', id)
            .single();

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (event.created_by !== userId) {
            throw new ForbiddenException('Only the event creator can update it');
        }

        const updateData: Record<string, any> = {};
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.startTime !== undefined) updateData.start_time = dto.startTime;
        if (dto.endTime !== undefined) updateData.end_time = dto.endTime;
        if (dto.locationType !== undefined) updateData.location_type = dto.locationType;
        if (dto.meetingLink !== undefined) updateData.meeting_link = dto.meetingLink;
        if (dto.address !== undefined) updateData.address = dto.address;
        if (dto.coverImage !== undefined) updateData.cover_image = dto.coverImage;
        if (dto.maxAttendees !== undefined) updateData.max_attendees = dto.maxAttendees;

        const { data, error } = await supabase
            .from('community_events')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                communities(id, name, slug, cover_image)
            `)
            .single();

        if (error) throw error;

        return this.transformEvent(data);
    }

    /**
     * Delete an event.
     */
    async delete(id: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const { data: event } = await supabase
            .from('community_events')
            .select('created_by')
            .eq('id', id)
            .single();

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        if (event.created_by !== userId) {
            throw new ForbiddenException('Only the event creator can delete it');
        }

        const { error } = await supabase
            .from('community_events')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Get upcoming events for a user (from all their communities).
     */
    async getUserUpcomingEvents(userId: string, limit: number = 5) {
        const supabase = this.supabaseService.getAdminClient();

        // Get user's community IDs
        const { data: memberships } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (!memberships || memberships.length === 0) {
            return [];
        }

        const communityIds = memberships.map(m => m.community_id);

        const { data, error } = await supabase
            .from('community_events')
            .select(`
                *,
                communities(id, name, slug, cover_image)
            `)
            .in('community_id', communityIds)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return data?.map(this.transformEvent);
    }

    private transformEvent(row: any) {
        return {
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
        };
    }
}
