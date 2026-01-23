import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UpdateUserDto, UserQueryDto } from './dto';

@Injectable()
export class AdminUsersService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Fetch all users with optional filters.
     */
    async findAll(query: UserQueryDto) {
        const supabase = this.supabaseService.getAdminClient();
        const { search, status, role, limit = 50, offset = 0 } = query;

        let queryBuilder = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) {
            queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (status) {
            queryBuilder = queryBuilder.eq('status', status);
        }

        if (role) {
            queryBuilder = queryBuilder.eq('role', role);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return data;
    }

    /**
     * Get user statistics.
     */
    async getStats() {
        const supabase = this.supabaseService.getAdminClient();

        const [totalResult, pendingResult, approvedResult] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        ]);

        return {
            total: totalResult.count || 0,
            pending: pendingResult.count || 0,
            approved: approvedResult.count || 0,
        };
    }

    /**
     * Get a single user by ID.
     */
    async findById(id: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('User not found');
            }
            throw error;
        }

        return data;
    }

    /**
     * Update a user.
     */
    async update(id: string, dto: UpdateUserDto) {
        const supabase = this.supabaseService.getAdminClient();

        const updateData: Record<string, any> = {};
        if (dto.role !== undefined) updateData.role = dto.role;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.credits !== undefined) updateData.credits = dto.credits;

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    /**
     * Approve a pending user.
     */
    async approve(id: string) {
        return this.update(id, { status: 'approved' });
    }

    /**
     * Reject/delete a user.
     */
    async reject(id: string) {
        const supabase = this.supabaseService.getAdminClient();

        // In a real app, you might mark as rejected instead of deleting
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
