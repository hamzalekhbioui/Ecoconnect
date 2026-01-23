import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateCommunityDto, UpdateCommunityDto, CommunityQueryDto } from './dto';

@Injectable()
export class CommunitiesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * List all communities with optional search and pagination.
     */
    async findAll(query: CommunityQueryDto) {
        const supabase = this.supabaseService.getAdminClient();
        const { search, limit = 20, offset = 0 } = query;

        let queryBuilder = supabase
            .from('communities')
            .select(`
                *,
                creator:profiles!communities_created_by_fkey(id, full_name, avatar_url),
                member_count:community_members(count)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            queryBuilder = queryBuilder.ilike('name', `%${search}%`);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return data?.map(community => ({
            ...community,
            memberCount: community.member_count?.[0]?.count || 0,
        }));
    }

    /**
     * Get a single community by ID.
     */
    async findById(id: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('communities')
            .select(`
                *,
                creator:profiles!communities_created_by_fkey(id, full_name, avatar_url),
                member_count:community_members(count)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Community not found');
            }
            throw error;
        }

        return {
            ...data,
            memberCount: data.member_count?.[0]?.count || 0,
        };
    }

    /**
     * Get a single community by slug.
     */
    async findBySlug(slug: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('communities')
            .select(`
                *,
                creator:profiles!communities_created_by_fkey(id, full_name, avatar_url),
                member_count:community_members(count)
            `)
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Community not found');
            }
            throw error;
        }

        return {
            ...data,
            memberCount: data.member_count?.[0]?.count || 0,
        };
    }

    /**
     * Create a new community.
     */
    async create(dto: CreateCommunityDto, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Generate slug from name
        const slug = dto.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check if slug already exists
        const { data: existing } = await supabase
            .from('communities')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existing) {
            throw new ConflictException('A community with this name already exists');
        }

        const { data, error } = await supabase
            .from('communities')
            .insert({
                name: dto.name,
                slug,
                description: dto.description,
                cover_image: dto.coverImage,
                created_by: userId,
                requires_post_approval: dto.requiresPostApproval ?? false,
                requires_membership_approval: dto.requiresMembershipApproval ?? false,
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-add creator as approved member
        await supabase.from('community_members').insert({
            community_id: data.id,
            user_id: userId,
            status: 'approved',
            role: 'admin',
        });

        return data;
    }

    /**
     * Update a community.
     */
    async update(id: string, dto: UpdateCommunityDto, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const community = await this.findById(id);
        if (community.created_by !== userId) {
            throw new ForbiddenException('Only the community creator can update it');
        }

        const updateData: Record<string, any> = {};
        if (dto.name !== undefined) {
            updateData.name = dto.name;
            updateData.slug = dto.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.coverImage !== undefined) updateData.cover_image = dto.coverImage;
        if (dto.requiresPostApproval !== undefined) updateData.requires_post_approval = dto.requiresPostApproval;
        if (dto.requiresMembershipApproval !== undefined) updateData.requires_membership_approval = dto.requiresMembershipApproval;

        const { data, error } = await supabase
            .from('communities')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Delete a community.
     */
    async delete(id: string, userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check ownership
        const community = await this.findById(id);
        if (community.created_by !== userId) {
            throw new ForbiddenException('Only the community creator can delete it');
        }

        const { error } = await supabase
            .from('communities')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Get members of a community.
     */
    async getMembers(communityId: string, status?: string) {
        const supabase = this.supabaseService.getAdminClient();

        let query = supabase
            .from('community_members')
            .select(`
                *,
                user:profiles!community_members_user_id_fkey(id, full_name, email, avatar_url)
            `)
            .eq('community_id', communityId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data;
    }

    /**
     * Request to join a community.
     */
    async requestJoin(communityId: string, userId: string, message?: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check if already a member
        const { data: existing } = await supabase
            .from('community_members')
            .select('id, status')
            .eq('community_id', communityId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            if (existing.status === 'approved') {
                throw new ConflictException('You are already a member of this community');
            }
            if (existing.status === 'pending') {
                throw new ConflictException('You already have a pending request');
            }
        }

        // Check if community requires approval
        const community = await this.findById(communityId);
        const status = community.requires_membership_approval ? 'pending' : 'approved';

        const { data, error } = await supabase
            .from('community_members')
            .insert({
                community_id: communityId,
                user_id: userId,
                status,
                request_message: message,
            })
            .select()
            .single();

        if (error) throw error;

        return { ...data, autoApproved: status === 'approved' };
    }

    /**
     * Update member status (approve/reject).
     */
    async updateMemberStatus(communityId: string, memberId: string, status: 'approved' | 'rejected', adminUserId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check if requester is community admin
        const community = await this.findById(communityId);
        if (community.created_by !== adminUserId) {
            throw new ForbiddenException('Only the community creator can manage members');
        }

        const { data, error } = await supabase
            .from('community_members')
            .update({ status })
            .eq('community_id', communityId)
            .eq('user_id', memberId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Remove a member from a community.
     */
    async removeMember(communityId: string, memberId: string, adminUserId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // Check if requester is community admin or the member themselves
        const community = await this.findById(communityId);
        if (community.created_by !== adminUserId && memberId !== adminUserId) {
            throw new ForbiddenException('You cannot remove this member');
        }

        const { error } = await supabase
            .from('community_members')
            .delete()
            .eq('community_id', communityId)
            .eq('user_id', memberId);

        if (error) throw error;
    }

    /**
     * Check if user is a member of a community.
     */
    async isMember(communityId: string, userId: string): Promise<boolean> {
        const supabase = this.supabaseService.getAdminClient();

        const { data } = await supabase
            .from('community_members')
            .select('status')
            .eq('community_id', communityId)
            .eq('user_id', userId)
            .eq('status', 'approved')
            .maybeSingle();

        return !!data;
    }

    /**
     * Get communities the user is a member of.
     */
    async getUserCommunities(userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('community_members')
            .select(`
                status,
                role,
                community:communities(
                    *,
                    creator:profiles!communities_created_by_fkey(id, full_name, avatar_url),
                    member_count:community_members(count)
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (error) throw error;

        return data?.map(item => {
            const community = item.community as any;
            return {
                ...community,
                memberCount: community?.member_count?.[0]?.count || 0,
                memberRole: item.role,
            };
        });

    }
}
