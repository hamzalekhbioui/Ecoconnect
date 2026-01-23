import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UpdateReportStatusDto, ReportQueryDto } from './dto';

@Injectable()
export class AdminReportsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Fetch all reports with optional filters.
     */
    async findAll(query: ReportQueryDto) {
        const supabase = this.supabaseService.getAdminClient();
        const { status, limit = 50 } = query;

        let queryBuilder = supabase
            .from('reports')
            .select(`
                *,
                reporter:profiles!reports_reporter_id_fkey(id, full_name, email, avatar_url),
                reported:profiles!reports_reported_id_fkey(id, full_name, email, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            queryBuilder = queryBuilder.eq('status', status);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return data?.map(report => ({
            id: report.id,
            reporterId: report.reporter_id,
            reportedId: report.reported_id,
            reason: report.reason,
            description: report.description,
            contextJson: report.context_json,
            status: report.status,
            createdAt: report.created_at,
            updatedAt: report.updated_at,
            reporter: report.reporter,
            reported: report.reported,
        }));
    }

    /**
     * Get report statistics.
     */
    async getStats() {
        const supabase = this.supabaseService.getAdminClient();

        const [totalResult, pendingResult, resolvedResult] = await Promise.all([
            supabase.from('reports').select('*', { count: 'exact', head: true }),
            supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        ]);

        return {
            total: totalResult.count || 0,
            pending: pendingResult.count || 0,
            resolved: resolvedResult.count || 0,
        };
    }

    /**
     * Update report status.
     */
    async updateStatus(id: string, dto: UpdateReportStatusDto) {
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase
            .from('reports')
            .update({ status: dto.status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new NotFoundException('Report not found');
            }
            throw error;
        }

        return data;
    }
}
