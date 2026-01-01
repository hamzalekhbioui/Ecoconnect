import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class CommunityDataService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not configured for AI context');
        }

        this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    }

    /**
     * Fetches active communities from Supabase
     */
    async fetchCommunities(): Promise<{ name: string; memberCount: number; tags: string[] }[]> {
        try {
            const { data, error } = await this.supabase
                .from('communities')
                .select('name, member_count, tags')
                .limit(20);

            if (error) {
                console.error('Error fetching communities:', error);
                return [];
            }

            return (data || []).map(c => ({
                name: c.name,
                memberCount: c.member_count || 0,
                tags: c.tags || [],
            }));
        } catch (err) {
            console.error('Failed to fetch communities:', err);
            return [];
        }
    }

    /**
     * Fetches marketplace resources from Supabase
     */
    async fetchResources(): Promise<{ title: string; category: string; price: number | null }[]> {
        try {
            const { data, error } = await this.supabase
                .from('marketplace_listings')
                .select('title, category, price')
                .limit(20);

            if (error) {
                console.error('Error fetching resources:', error);
                return [];
            }

            return (data || []).map(r => ({
                title: r.title,
                category: r.category || 'General',
                price: r.price,
            }));
        } catch (err) {
            console.error('Failed to fetch resources:', err);
            return [];
        }
    }

    /**
     * Builds a context string for the AI from real community data
     */
    async buildContextString(): Promise<string> {
        const [communities, resources] = await Promise.all([
            this.fetchCommunities(),
            this.fetchResources(),
        ]);

        let context = '';

        if (communities.length > 0) {
            context += '\n\nAVAILABLE COMMUNITIES:\n';
            communities.forEach(c => {
                context += `- ${c.name} (${c.memberCount} members)`;
                if (c.tags.length > 0) {
                    context += ` [Tags: ${c.tags.join(', ')}]`;
                }
                context += '\n';
            });
        }

        if (resources.length > 0) {
            context += '\n\nAVAILABLE RESOURCES/LISTINGS:\n';
            resources.forEach(r => {
                const priceStr = r.price === 0 || r.price === null ? 'Free' : `€${r.price}`;
                context += `- ${r.title} (${r.category}) - ${priceStr}\n`;
            });
        }

        return context;
    }
}
