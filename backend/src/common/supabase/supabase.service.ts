import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private readonly client: SupabaseClient;
    private readonly adminClient: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
            throw new Error('Missing Supabase environment variables');
        }

        // Regular client for authenticated user operations
        this.client = createClient(supabaseUrl, supabaseAnonKey);

        // Admin client with service role for bypassing RLS when needed
        this.adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    /**
     * Get client authenticated as a specific user.
     * Use this for operations that should respect RLS policies.
     */
    getClientWithAuth(accessToken: string): SupabaseClient {
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            }
        );
    }

    /**
     * Get admin client with service role.
     * Use this for admin operations that bypass RLS.
     */
    getAdminClient(): SupabaseClient {
        return this.adminClient;
    }

    /**
     * Verify a JWT token and return the user payload.
     */
    async verifyToken(token: string): Promise<{ user: { id: string; email: string; role?: string } } | null> {
        const { data, error } = await this.client.auth.getUser(token);

        if (error || !data.user) {
            return null;
        }

        // Fetch additional user info from profiles table
        const { data: profile } = await this.adminClient
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        return {
            user: {
                id: data.user.id,
                email: data.user.email || '',
                role: profile?.role || 'member',
            },
        };
    }
}
